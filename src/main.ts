//system imports
import {app, BrowserWindow, ipcMain, screen} from "electron";
import * as fs from "fs";
import {Worker} from "worker_threads"
import {spawn} from "node:child_process"

//own imports
//import * as comm from "./res/communication" //importing communication module 

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

//run RedisDB
const database = spawn("redis-server")

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

    public constructor(config: any, path: string, coords: number[]){
        config.x = coords[0]
        config.y = coords[1]

        this.window = new BrowserWindow(config);
        this.window.setMenu(null);
        this.window.webContents.openDevTools()

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

    worker.postMessage("terrain")

})

//communication workers
const worker = new Worker("./controller_backend.js")
const voice_worker = new Worker("./voice_backend.js")

//worker listeners
worker.on("message", (message) => {
    console.log("backend output: " + message)
})

voice_worker.on("message", (message) => { //messages from microphone
    console.log("voice output: " + message)
})

//IPC listeners
ipcMain.on("message", (event, data) => {
    let coords = [0, 0]

    switch(data[1][0]){
        case "redirect-to-menu":
            //message call to redirect to main menu
            settings.close()

            //calculate x, y
            coords = get_window_coords(-1)

            mainMenu = new Window(main_menu_dict, "./res/index.html", coords)
            mainMenu.show()

            break
        case "save-settings":
            fs.writeFileSync("./res/data/settings.json", data[1][1])
            break
        case "redirect-to-settings":
            //message call to redirect to settings

            mainMenu.close()

            //calculate x, y
            coords = get_window_coords(-1)

            settings = new Window(settings_dict, "./res/settings.html", coords)
            settings.show()
            break
        case "redirect-to-main":
            //message call to redirect to main program (start)

            mainMenu.close()

            //calculate x, y
            //leftmost tactic
            for(let i = 0; i < displays.length; i++){
                coords = get_window_coords(i)
                //stop sequence (display limit reached)
                if (coords[0] == -2){
                    break
                }
                if (coords[0] == -3){
                    continue
                }

                workerWindow = new Window(worker_dict, "./res/worker.html", coords)
                workers.push(workerWindow)
            }

            coords = get_window_coords(-1)

            controllerWindow = new Window(controller_dict, "./res/controller.html", coords)
            
            for (let i = 0; i < workers.length; i++){
                workers[i].show()
            }
            controllerWindow.show()

            //setup voice recognition and ACAI backend
            voice_worker.postMessage("start")
            worker.postMessage("terrain") //generate terrain

            break
        case "exit":
            //disable voice recognition and ACAI backend
            voice_worker.postMessage("stop")
            //kill voice recognition
            voice_worker.postMessage("interrupt")
            
            //close windows
            controllerWindow.close()
            for(let i = 0; i < workers.length; i++){
                workers[i].close()
            }

            //stop database
            database.kill("SIGINT")

            break
        case "invoke":
            worker.postMessage(data[1][1])
            break
        
    }
})

ipcMain.on("message-redirect", (event, data) => {
    if (data[0] == "controller"){
        console.log("from worker")
        controllerWindow.send_message("message-redirect", data[1][0])
        sender_win_name = "worker"
    }
    else if (data[0] == "worker"){
        workers[0].send_message("message-redirect", data[1][0])
        sender_win_name = "worker"
    }
})