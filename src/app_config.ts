/*
    Just a config file to keep all window definitions or anything that is predefined and isnt changed
    while running the program
*/

import path from "path"
import { BrowserWindow, ipcMain, screen, Tray, nativeImage, Menu } from "electron";
import { EventLogger } from "./logger"


//init
const ABS_PATH = path.resolve("")

/*
    Window configs for electron
*/
export const main_menu_dict = {
    width: 800,
    height: 600,
    title: "SEDAC manager",
    resizable: false,
    icon: "./res/img/sedac-manager-logo.png",
    webPreferences: {
        preload: path.join(ABS_PATH, "src/res/scripts/preload.js")
    }
}

export const settings_dict = {
    width: 1920,
    height: 1080,
    title: "SEDAC manager - settings",
    resizable: true,
    icon: "./res/img/sedac-manager-logo.png",
    webPreferences: {
        preload: path.join(ABS_PATH, "src/res/scripts/preload.js")
    }
}

export const exit_dict = {
    width: 500,
    height: 300,
    title: "SEDAC manager - exit tray",
    resizable: false,
    icon: "./res/img/sedac-manager-logo.png",
    frame: false,
    webPreferences: {
        preload: path.join(ABS_PATH, "src/res/scripts/preload.js")
    }
}

export const controller_dict = {
    width: 1920,
    height: 1080,
    title: "SEDAC manager - control",
    resizable: true,
    icon: "./res/img/sedac-manager-logo.png",
    frame: true,
    //focusable: true,
    webPreferences: {
        preload: path.join(ABS_PATH, "src/res/scripts/preload.js")
    }
}

export const worker_dict = {
    width: 1920,
    height: 1080,
    title: "SEDAC",
    resizable: false,
    icon: "./res/img/sedac-manager-logo.png",
    //frame: false,
    //focusable: false,
    webPreferences: {
        preload: path.join(ABS_PATH, "src/res/scripts/preload.js")
    }
}

export const basic_worker_widget_dict = {
    width: 300,
    height: 300,
    title: "SEDAC widget",
    resizable: false,
    icon: "./res/img/sedac-manager-logo.png",
    frame: false,
    webPreferences: {
        preload: path.join(ABS_PATH, "src/res/scripts/preload.js")
    }
}

/*
    Window classes
*/

export class Window{
    public window: BrowserWindow;
    public win_type: string = "none";
    public isClosed: boolean = false;
    public win_coordinates: number[];
    private path_load: string;
    private localConfig: any = {}; //contains local config of window
    private event_logger: EventLogger;

    public close(){
        if (!this.isClosed){
            this.window.close()
        }
        this.isClosed = true
    }

    public show(path: string = ""){
        if (path.length != 0){
            //rewrite path_load (used for controller window_manipulation
            this.path_load = path
        }

        this.isClosed = false
        this.window.loadFile(this.path_load);
    }

    public send_message(channel: string, message: any){
        this.window.webContents.postMessage(channel, message)
    }

    public checkClose(callback: any = undefined){
        this.window.on("closed", () => {
            this.isClosed = true
            if (callback != undefined){
                callback()
            }
        })
    }

    public constructor(app_status: Record<string, boolean>, config: any, path: string, coords: number[],
        ev_logger: EventLogger, main_app: any, window_type: string = "none", display_res: number[] = []){
        this.win_coordinates = coords //store to use later
        this.event_logger = ev_logger

        //retype window_type
        this.win_type = window_type

        Object.assign(this.localConfig, config)
        if (display_res.length > 0 && !display_res.includes(undefined)){
            //set resolution according to display resolution
            this.localConfig.width = display_res[0]
            this.localConfig.height = display_res[1]
        }

        this.localConfig.x = coords[0]
        this.localConfig.y = coords[1]

        this.window = new BrowserWindow(this.localConfig);
        this.window.setMenu(null);
        this.window.webContents.openDevTools()

        this.path_load = path
        this.window.maximize()
        
        if (path.includes("main")){
            this.checkClose(() => {
                if (!app_status["redir-to-main"]){
                    this.event_logger.log("DEBUG", "Closing app... Bye Bye")
                    main_app.exit_app()
                }
            })
        }

        this.event_logger.log("DEBUG", `Created window object(win_type=${this.win_type},path_load=${this.path_load}, coords=${coords})`)
    }
}

export class WidgetWindow{
    public window: BrowserWindow;
    public win_coordinates: number[];
    private event_logger: EventLogger;
    private localConfig: any = {}; //contains local config of window
    private path_load: string;

    public close(){
        this.window.close()
    }

    public show(path: string = ""){
        if (path.length != 0){
            //rewrite path_load (used for controller window_manipulation
            this.path_load = path
        }

        this.window.loadFile(this.path_load);
    }

    public send_message(channel: string, message: any){
        this.window.webContents.postMessage(channel, message)
    }

    public constructor(config: any, path: string, coords: number[], 
                        ev_logger: EventLogger){
        this.event_logger = ev_logger
        Object.assign(this.localConfig, config)
        
        this.localConfig.x = coords[0]
        this.localConfig.y = coords[1]

        this.window = new BrowserWindow(this.localConfig);
        this.window.setMenu(null);
        this.window.setAlwaysOnTop(true);
        this.window.webContents.openDevTools()

        this.path_load = path

        this.event_logger.log("DEBUG", `Created worker widget window object(path_load=${this.path_load}, coords=${coords})`)
    }
}