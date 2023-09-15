import {app, BrowserWindow, ipcMain, screen} from "electron"

//TODO: work with screens

//window variable declarations
var mainMenu: Window;
var settings: Window;
var controllerWindow: Window;
var workerWindow: Window;

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
    static window: BrowserWindow;
    static path_load: string


    public close(){
        Window.window.close()
    }

    public show(){
        Window.window.loadFile(Window.path_load);
    }

    public constructor(config: any, path: string){
        Window.window = new BrowserWindow(config);
        Window.window.setMenu(null);

        Window.path_load = path
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
        mainMenu.show()
    }
})

ipcMain.on("message-redirect", (event, data) => {
    if(data[0] == "worker"){

    }
    else if (data[0] == "controller"){
        
    }
})