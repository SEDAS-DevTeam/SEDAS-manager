import {app, BrowserWindow, ipcMain, screen} from "electron"

//TODO: work with screens

//window variable declarations
var mainMenu: Window;
var settings: Window;
var controllerWindow: Window;
var workerWindow: Window;

//other declarations
var sender_win_name: string = "";

const main_menu_dict = {
    width: 800,
    height: 600,
    title: "SEDAC manager",
    webPreferences: {
        nodeIntegration: true,
        contextIsolation: false
    },
    resizable: false,
    icon: "./res/img/sedac-manager-logo.png"
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
    icon: "./res/img/sedac-manager-logo.png"
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
    icon: "./res/img/sedac-manager-logo.png"
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
    icon: "./res/img/sedac-manager-logo.png"
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

    public constructor(config: any, path: string){
        this.window = new BrowserWindow(config);
        this.window.setMenu(null);
        this.window.webContents.openDevTools()

        this.path_load = path
        //this.show()
    }
}

app.on("ready", () => {
    mainMenu = new Window(main_menu_dict, "./res/index.html")
    mainMenu.show()
})

ipcMain.on("redirect", (event, data) => {
    //redirect event handler from menu

    mainMenu.close()
    if (data == "settings"){
        settings = new Window(settings_dict, "./res/settings.html")
        settings.show()
    }
    else if (data == "main-program"){

        controllerWindow = new Window(controller_dict, "./res/controller.html")
        workerWindow = new Window(worker_dict, "./res/worker.html")

        controllerWindow.show()
        workerWindow.show()
    }
})

ipcMain.on("redirect-settings", (event, data) => {
    settings.close() //TODO: this doesnt seem to work for some reason
    if (data == "menu"){
        mainMenu = new Window(main_menu_dict, "./res/index.html")
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