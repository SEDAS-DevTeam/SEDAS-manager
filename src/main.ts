import {app, BrowserWindow} from "electron"

const main_menu_settings = {
    width: 800,
    height: 600,
    title: "SEDAC manager",
    webPreferences: {
        nodeIntegration: true,
        contextIsolation: false
    },
    resizable: false
}

class Window{
    static window: BrowserWindow;

    private onClose(){
        Window.window = null;
    }

    public show(){
        Window.window.loadFile("./res/index.html");
    }

    public constructor(config: any){
        Window.window = new BrowserWindow(config);
        Window.window.setMenu(null);
        //Window.window.webContents.openDevTools();
        Window.window.on("closed", this.onClose);
    }
}

function start_app(){
    var mainMenu: any = new Window(main_menu_settings)
    mainMenu.show()
}

app.on("ready", () => {
    start_app()
})