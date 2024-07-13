/*
    Just a config file to keep all window definitions or anything that is predefined and isnt changed
    while running the program
*/

import { join, resolve } from "path"
import { BrowserWindow, ipcMain, screen, Tray, nativeImage, Menu } from "electron";
import { EventLogger } from "./logger"

//init vars
export const ABS_PATH = resolve("")

//paths for all html files
export const PATH_TO_MAIN_HTML = join(ABS_PATH, "./src/res/html/other/main.html")
export const PATH_TO_SETTINGS_HTML = join(ABS_PATH, "./src/res/html/controller/settings.html")
export const PATH_TO_CONTROLLER_HTML = join(ABS_PATH, "./src/res/html/controller/controller_set.html")
export const PATH_TO_EXIT_HTML = join(ABS_PATH, "./src/res/html/other/exit.html")
export const PATH_TO_POPUP_HTML = join(ABS_PATH, "./src/res/html/other/popup.html")
export const PATH_TO_LOADER_HTML = join(ABS_PATH, "./src/res/html/other/load.html")

//paths to worker html files
export const PATH_TO_WORKER_HTML = join(ABS_PATH, "./src/res/html/worker/worker.html")
export const PATH_TO_DEP_ARR_HTML = join(ABS_PATH, "./src/res/html/worker/dep_arr.html")
export const PATH_TO_EMBED_HTML = join(ABS_PATH, "./src/res/html/worker/embed.html")
export const PATH_TO_WEATHER_HTML = join(ABS_PATH, "./src/res/html/worker/weather.html")

//paths for subprocesses
export const PATH_TO_AUDIO_UPDATE: string = join(ABS_PATH, "/src/res/neural/get_info.py")

//paths for local storage
export const PATH_TO_LOGS: string = join(ABS_PATH, "/src/logs/")
export const PATH_TO_MAPS: string = join(ABS_PATH, "/src/res/data/sim/maps/")
export const PATH_TO_COMMANDS: string = join(ABS_PATH, "/src/res/data/sim/commands/")
export const PATH_TO_AIRCRAFTS: string = join(ABS_PATH, "/src/res/data/sim/planes/")
export const PATH_TO_AIRLINES: string = join(ABS_PATH, "/src/res/data/sim/airlines/")
export const PATH_TO_CACHE: string = join(ABS_PATH, "/src/res/neural/alg_cache")
export const PATH_TO_CONFIG: string = join(ABS_PATH, "/src/res/data/alg/")
export const PATH_TO_SETTINGS: string = join(ABS_PATH, "/src/res/data/app/settings.json")

//paths for modifiable local storage (e. g. storage that is updated frequently)
export const PATH_TO_SPEECH_CONFIG: string = join(ABS_PATH, "/src/res/data/alg/speech_config.json")
export const PATH_TO_TEXT_CONFIG: string = join(ABS_PATH, "/src/res/data/alg/text_config.json")
export const PATH_TO_VOICE_CONFIG: string = join(ABS_PATH, "/src/res/data/alg/voice_config.json")

export const PATH_TO_IN_DEVICES: string = join(ABS_PATH, "/src/res/data/app/in_device_list.json")
export const PATH_TO_OUT_DEVICES: string = join(ABS_PATH, "/src/res/data/app/out_device_list.json")

//paths for gui layouts
export const PATH_TO_SETTINGS_LAYOUT: string = join(ABS_PATH, "/src/res/data/app/gui/settings_layout.json")

//paths for backup
export const PATH_TO_DATABASE: string = join(ABS_PATH, "/src/res/data/tmp/backup.json")

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
        preload: join(ABS_PATH, "src/res/scripts/utils/preload.js")
    }
}

export const load_dict = {
    width: 800,
    height: 600,
    title: "SEDAC manager - loading",
    resizable: false,
    icon: "./res/img/sedac-manager-logo.png",
    frame: false,
    webPreferences: {
        preload: join(ABS_PATH, "src/res/scripts/utils/preload.js")
    }
}


export const settings_dict = {
    width: 1920,
    height: 1080,
    title: "SEDAC manager - settings",
    resizable: true,
    icon: "./res/img/sedac-manager-logo.png",
    webPreferences: {
        preload: join(ABS_PATH, "src/res/scripts/utils/preload.js")
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
        preload: join(ABS_PATH, "src/res/scripts/utils/preload.js")
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
        preload: join(ABS_PATH, "src/res/scripts/utils/preload.js")
    }
}

export const worker_dict = {
    width: 1920,
    height: 1080,
    title: "SEDAC",
    resizable: false,
    icon: "./res/img/sedac-manager-logo.png",
    //frame: false, //TODO turn off when testing
    //focusable: false, //same here
    webPreferences: {
        preload: join(ABS_PATH, "src/res/scripts/utils/preload.js")
    }
}

export const basic_worker_widget_dict = {
    width: 300,
    height: 300,
    title: "SEDAC widget",
    resizable: true,
    icon: "./res/img/sedac-manager-logo.png",
    frame: false,
    webPreferences: {
        preload: join(ABS_PATH, "src/res/scripts/utils/preload.js")
    }
}

export const popup_widget_dict = {
    width: 500,
    height: 300,
    title: "SEDAC popup",
    resizable: false,
    icon: "./res/img/sedac-manager-logo.png",
    frame: false,
    webPreferences: {
        preload: join(ABS_PATH, "src/res/scripts/utils/preload.js")
    }
}

/*
    Window classes
*/

class BaseWindow{
    public window: BrowserWindow;
    public win_type: string = "none";
    public isClosed: boolean = false;
    public win_coordinates: number[];
    public path_load: string;
    public localConfig: any = {}; //contains local config of window
    public event_logger: EventLogger;

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
}

export class Window extends BaseWindow{

    public checkClose(callback: any = undefined){
        this.window.on("closed", () => {
            this.isClosed = true
            if (callback != undefined){
                callback()
            }
        })
    }

    public constructor(app_status: Record<string, boolean>, dev_panel: boolean = false,
        config: any, path: string, coords: number[],
        ev_logger: EventLogger, main_app: any, window_type: string = "none", display_res: number[] = []){
        
        super();

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
        if (dev_panel){
            this.window.webContents.openDevTools()
        }

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

export class LoaderWindow extends BaseWindow{

    public wait_for_load(callback: any){
        return new Promise<void>((resolve, reject) => {
            this.window.webContents.on("did-finish-load", async () => {
                await callback()
                resolve()
            })
        })
    }

    public constructor(config: any, path: string, coords: number[],
        ev_logger: EventLogger, display_res: number[] = []){

        super()

        this.win_coordinates = coords //store to use later
        this.event_logger = ev_logger

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
        //this.window.webContents.openDevTools()

        this.path_load = path

        this.event_logger.log("DEBUG", `Created window object(win_type=${this.win_type},path_load=${this.path_load}, coords=${coords})`)
    }
}

export class WidgetWindow extends BaseWindow{

    public wait_for_load(callback: any){
        this.window.webContents.on("did-finish-load", () => {
            callback()
        })
    }

    public minimize(){
        this.window.setSize(this.localConfig.width, 35) //default height of the header
    }

    public maximize(){
        this.window.setSize(this.localConfig.width, this.localConfig.height)
    }

    public constructor(config: any, path: string, coords: number[], 
                        ev_logger: EventLogger){

        super()

        this.event_logger = ev_logger
        Object.assign(this.localConfig, config)
        
        this.localConfig.x = coords[0]
        this.localConfig.y = coords[1]

        this.path_load = path

        this.event_logger.log("DEBUG", `Created worker widget window object(path_load=${this.path_load}, coords=${coords})`)
    }
}

export class PopupWindow extends BaseWindow{
    public popup_type: string;
    private comm_channel: string;

    public constructor(config: any, 
                        path: string, 
                        coords: number[], 
                        ev_logger: EventLogger,
                        type: string,
                        channel: string){
        super()
        
        this.event_logger = ev_logger
        Object.assign(this.localConfig, config)

        this.localConfig.x = coords[0]
        this.localConfig.y = coords[1]

        this.path_load = path
        this.popup_type = type
        this.comm_channel = channel

        this.window = new BrowserWindow(this.localConfig);
        this.window.setMenu(null);
        this.window.setAlwaysOnTop(true);

        this.event_logger.log("DEBUG", `Created popup window object(path_load=${this.path_load}, coords=${coords})`)
    }

    public load_popup(header: string, text: string){
        this.show()
        this.wait_for_load(() => {
            this.send_message("popup-init-info", [this.popup_type, this.comm_channel, header, text])
        })
    }

    private wait_for_load(callback: any){
        return new Promise<void>((resolve, reject) => {
            this.window.webContents.on("did-finish-load", async () => {
                await callback()
                resolve()
            })
        })
    }
}