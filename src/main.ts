import {app, BrowserWindow, ipcMain, screen} from "electron";
import * as fs from "fs";

//TODO: work with screens

//window variable declarations
var mainMenu: Window;
var settings: Window;
var controllerWindow: Window;
var workerWindow: Window;

//other declarations
var sender_win_name: string = "";
var displays = [];
var workers = [];

//read JSON
const JSON_raw = fs.readFileSync("./res/data/settings.json", "utf-8")
const app_settings = JSON.parse(JSON_raw);

const main_menu_dict = {
    width: 800,
    height: 600,
    title: "SEDAC manager",
    webPreferences: {
        nodeIntegration: true,
        contextIsolation: false
    },
    resizable: false,
    icon: "./res/img/sedac-manager-logo.png",
}

const settings_dict = {
    width: 1920,
    height: 1080,
    title: "SEDAC manager - settings",
    webPreferences: {
        nodeIntegration: true,
        contextIsolation: false
    },
    resizable: true,
    icon: "./res/img/sedac-manager-logo.png",
}

const controller_dict = {
    width: 1920,
    height: 1080,
    title: "SEDAC manager - control",
    webPreferences: {
        nodeIntegration: true,
        contextIsolation: false
    },
    resizable: true,
    icon: "./res/img/sedac-manager-logo.png",
    frame: true
}

const worker_dict = {
    width: 1920,
    height: 1080,
    title: "SEDAC",
    webPreferences: {
        nodeIntegration: true,
        contextIsolation: false
    },
    resizable: false,
    icon: "./res/img/sedac-manager-logo.png",
    frame: false,
    focusable: false
}

function get_window_coords(idx: number){
    let x: number
    let y: number

    if (app_settings["alignment"] == "free"){
        x = undefined
        y = undefined
        return [x, y]
    }

    if (displays.length == 1){
        x = displays[0].x
        y = displays[0].y
        return [x, y]
    }

    if (idx == -1){
        if (app_settings["controller-loc"] == "leftmost"){
            x = displays[0].x
            y = displays[0].y
        }
        else if (app_settings["controller-loc"] == "rightmost"){
            x = displays[displays.length - 1].x
            y = displays[displays.length - 1].y
        }
    }
    else{ //idx != -1: other worker windows
        if (app_settings["controller-loc"] == "leftmost"){
            if (displays.length == idx + 1){
                return [-2, -2]
            }

            x = displays[idx + 1].x
            y = displays[idx + 1].y
        }
        else if (app_settings["controller-loc"] == "rightmost"){
            if (displays.length == idx){
                return [-2, -2] //signalizes "break"
            }
            if(idx == 0){
                return [-3, -3] //signalizes "skip"
            }

            x = displays[idx - 1].x
            y = displays[idx - 1].y
        }
    }
    return [x, y]
}

class Window{
    private window: BrowserWindow;
    private path_load: string


    public close(){
        this.window.close()
    }

    public show(){
        this.window.loadFile(this.path_load);
    }

    public send_message(channel: string, message: string){
        this.window.webContents.postMessage(channel, message)
    }

    public constructor(config: any, path: string, [x, y]: [number, number]){
        config.x = x
        config.y = y

        this.window = new BrowserWindow(config);
        this.window.setMenu(null);

        this.path_load = path
        this.window.maximize()
    }
}

app.on("ready", () => {
    //get screen info
    var displays_info: any = screen.getAllDisplays()
    var displays_mod = []
    for(let i: number = 0; i < displays_info.length; i++){
        displays_mod.push(displays_info[i].bounds)
    }
    displays_mod.sort((a, b) => a.x - b.x);
    displays = displays_mod

    //calculate x, y
    let [x, y] = get_window_coords(-1)

    mainMenu = new Window(main_menu_dict, "./res/index.html", [x, y])
    mainMenu.show()
})

ipcMain.on("redirect", (event, data) => {
    //redirect event handler from menu

    mainMenu.close()
    if (data == "settings"){
        //calculate x, y
        let [x, y] = get_window_coords(-1)

        settings = new Window(settings_dict, "./res/settings.html", [x, y])
        settings.show()
    }
    else if (data == "main-program"){

        //calculate x, y
        //leftmost tactic
        console.log(displays)
        for(let i = 0; i < displays.length; i++){
            let [x, y] = get_window_coords(i)
            //stop sequence (display limit reached)
            if (x == -2 && y == -2){
                break
            }
            if (x == -3 && x == -3){
                continue
            }

            workerWindow = new Window(worker_dict, "./res/worker.html", [x, y])
            workers.push(workerWindow)
        }

        let [x, y] = get_window_coords(-1)

        controllerWindow = new Window(controller_dict, "./res/controller.html", [x, y])
        
        for (let i = 0; i < workers.length; i++){
            workers[i].show()
        }
        controllerWindow.show()
    }
})

ipcMain.on("redirect-settings", (event, data) => {
    //calculate x, y
    let [x, y] = get_window_coords(-1)

    switch(data[0]){
        case "menu":
            settings.close()
            mainMenu = new Window(main_menu_dict, "./res/index.html", [x, y])
            mainMenu.show()
            break
        case "save-settings":
            fs.writeFileSync("./res/data/settings.json", data[1])
            break
    }
})

ipcMain.on("message-redirect", (event, data) => {
    console.log(data)


    switch(data[0]){
        case "worker":
            workerWindow.send_message("recv", data[1])
            sender_win_name = "controller"
            break
        case "controller":
            console.log("from worker")
            controllerWindow.send_message("recv", data[1])
            sender_win_name = "worker"
            break
        case "main":
            console.log("program message")
            if (data[1] == "exit"){
                //exiting workers
                for(let i = 0; i < workers.length; i++){
                    workers[i].close()
                }
            }
            break
        case "validate":
            console.log("msg received!")
            if (sender_win_name == "worker"){
                workerWindow.send_message("valid", "success")
            }
            if (sender_win_name == "controller"){
                controllerWindow.send_message("valid", "success")
            }
            break
    }
})