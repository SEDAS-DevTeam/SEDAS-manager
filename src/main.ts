import {app, BrowserWindow, ipcMain, screen} from "electron"

//TODO: work with screens

//window variable declarations
var mainMenu: Window;
var settings: Window;
var controllerWindow: Window;
var workerWindow: Window;

//other declarations
var sender_win_name: string = "";
var displays = [];

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
    fullscreen: false,
    frame: false
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
    //leftmost tactic //TODO: finish by loading JSON
    let x: number = displays[displays.length - 1].x
    let y: number = displays[displays.length - 1].y

    mainMenu = new Window(main_menu_dict, "./res/index.html", [x, y])
    mainMenu.show()
})

ipcMain.on("redirect", (event, data) => {
    //redirect event handler from menu

    mainMenu.close()
    if (data == "settings"){
        //calculate x, y
        //leftmost tactic
        let x: number = displays[displays.length - 1].x
        let y: number = displays[displays.length - 1].y

        settings = new Window(settings_dict, "./res/settings.html", [x, y])
        settings.show()
    }
    else if (data == "main-program"){

        //calculate x, y
        //leftmost tactic
        let x1: number = displays[displays.length - 2].x
        let y1: number = displays[displays.length - 2].y

        let x2: number = displays[displays.length - 3].x
        let y2: number = displays[displays.length - 3].y

        controllerWindow = new Window(controller_dict, "./res/controller.html", [x1, y1])
        workerWindow = new Window(worker_dict, "./res/worker.html", [x2, y2])

        controllerWindow.show()
        workerWindow.show()
    }
})

ipcMain.on("redirect-settings", (event, data) => {
    settings.close()

    //calculate x, y
    //leftmost tactic
    let x: number = displays[displays.length - 1].x
    let y: number = displays[displays.length - 1].y

    if (data == "menu"){
        mainMenu = new Window(main_menu_dict, "./res/index.html", [x, y])
        mainMenu.show()
    }
})

ipcMain.on("message-redirect", (event, data) => {
    console.log(data)

    if(data[0] == "worker"){
        workerWindow.send_message("recv", data[1])
        sender_win_name = "controller"
    }
    if (data[0] == "controller"){
        console.log("from worker")
        controllerWindow.send_message("recv", data[1])
        sender_win_name = "worker"
    }
    else if (data[0] == "validate"){ //validation arrived from receiver
        console.log("msg received!")
        if (sender_win_name == "worker"){
            workerWindow.send_message("valid", "success")
        }
        if (sender_win_name == "controller"){
            controllerWindow.send_message("valid", "success")
        }
    }
})