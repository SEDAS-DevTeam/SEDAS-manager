/*
    Just a config file to keep all window definitions or anything that is predefined and isnt changed
    while running the program
*/

import { join, resolve } from "path"
import { BrowserWindow, ipcMain, screen, Tray, nativeImage, Menu } from "electron";
import { EventLogger } from "./logger"
import utils from "./utils"

//init vars
export const ABS_PATH = resolve("")

//paths for main html files
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

//paths to widget html files
export const PATH_TO_WIDGET_HTML = join(ABS_PATH, "./src/res/html/widget/worker_widget.html")

//paths for local storage
export const PATH_TO_LOGS: string = join(ABS_PATH, "/src/logs/")
export const PATH_TO_MAPS: string = join(ABS_PATH, "/src/res/data/sim/maps/")
export const PATH_TO_COMMANDS: string = join(ABS_PATH, "/src/res/data/sim/commands/")
export const PATH_TO_AIRCRAFTS: string = join(ABS_PATH, "/src/res/data/sim/planes/")
export const PATH_TO_AIRLINES: string = join(ABS_PATH, "/src/res/data/sim/airlines/")
export const PATH_TO_CACHE: string = join(ABS_PATH, "/src/res/neural/alg_cache")
export const PATH_TO_CONFIG: string = join(ABS_PATH, "/src/res/data/alg/")
export const PATH_TO_SETTINGS: string = join(ABS_PATH, "/src/res/data/app/settings.json")
export const PATH_TO_PLUGINS: string = join(ABS_PATH, "/src/res/data/app/config/plugins_config.json")
export const PATH_TO_MODULES: string = join(ABS_PATH, "/src/res/data/app/config/modules_config.json")
export const PATH_TO_ICON: string = join(ABS_PATH, "/src/res/img/sedas-manager-logo-rounded.png")

//paths for workers
export const PATH_TO_MSC: string = join(ABS_PATH, "/src/workers/backend.js")
export const PATH_TO_BACKUP: string = join(ABS_PATH, "/src/workers/database.js")

//paths for gui layouts
export const PATH_TO_SETTINGS_LAYOUT: string = join(ABS_PATH, "/src/res/data/app/gui/settings_layout.json")

//paths for backup
export const PATH_TO_DATABASE: string = join(ABS_PATH, "/src/res/data/tmp/backup.json")

//constants used in this app
export const WIDGET_OFFSET = 50

/*
    Window configs for electron
*/
export const main_menu_dict = {
    width: 800,
    height: 600,
    title: "SEDAS manager",
    resizable: false,
    icon: PATH_TO_ICON,
    webPreferences: {
        preload: join(ABS_PATH, "src/res/scripts/utils/preload.js")
    }
}

export const load_dict = {
    width: 800,
    height: 600,
    title: "SEDAS manager - loading",
    resizable: false,
    icon: PATH_TO_ICON,
    frame: false,
    webPreferences: {
        preload: join(ABS_PATH, "src/res/scripts/utils/preload.js")
    }
}


export const settings_dict = {
    width: 1920,
    height: 1080,
    title: "SEDAS manager - settings",
    resizable: true,
    icon: PATH_TO_ICON,
    webPreferences: {
        preload: join(ABS_PATH, "src/res/scripts/utils/preload.js")
    }
}

export const exit_dict = {
    width: 500,
    height: 300,
    title: "SEDAS manager - exit tray",
    resizable: false,
    icon: PATH_TO_ICON,
    frame: false,
    webPreferences: {
        preload: join(ABS_PATH, "src/res/scripts/utils/preload.js")
    }
}

export const controller_dict = {
    width: 1920,
    height: 1080,
    title: "SEDAS manager - control",
    resizable: true,
    icon: PATH_TO_ICON,
    frame: true,
    //focusable: true,
    webPreferences: {
        preload: join(ABS_PATH, "src/res/scripts/utils/preload.js")
    }
}

export const worker_dict = {
    width: 1920,
    height: 1080,
    title: "SEDAS",
    resizable: false,
    icon: PATH_TO_ICON,
    frame: false, //TODO turn off when testing
    focusable: false, //same here
    webPreferences: {
        preload: join(ABS_PATH, "src/res/scripts/utils/preload.js")
    }
}

export const basic_worker_widget_dict = {
    width: 300,
    height: 300,
    title: "SEDAS widget",
    resizable: true,
    icon: PATH_TO_ICON,
    frame: false,
    webPreferences: {
        preload: join(ABS_PATH, "src/res/scripts/utils/preload.js")
    }
}

export const popup_widget_dict = {
    width: 500,
    height: 300,
    title: "SEDAS popup",
    resizable: false,
    icon: PATH_TO_ICON,
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
    public window_id: string;
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

        //generate id for window
        this.window_id = utils.generate_win_id()

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
        
        dev_panel = false; // TODO
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

        //generate id for window
        this.window_id = utils.generate_win_id()

        this.event_logger = ev_logger
        Object.assign(this.localConfig, config)
        
        this.localConfig.x = coords[0]
        this.localConfig.y = coords[1]

        this.window = new BrowserWindow(this.localConfig);
        this.window.setMenu(null);
        this.window.setAlwaysOnTop(true);

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

/*
    Window handler classes
*/

export class WidgetWindowHandler{
    private widget_workers: any[] = [];

    public show_all(){
        for (let i = 0; i < this.widget_workers.length; i++){
            this.widget_workers[i]["win"].show()
            this.widget_workers[i]["win"].wait_for_load(() => {
                this.widget_workers[i]["win"].send_message("register", ["id", this.widget_workers[i]["id"]])
            })
        }
    }

    public setup_all(worker_coords: object[], EvLogger: EventLogger){
        for (let i = 0; i < worker_coords.length; i++){
            //setting up all layer widgets (overlaying whole map) TODO
            
            // add offset to coord spawn
            let coords = [worker_coords[i][0] + WIDGET_OFFSET, worker_coords[i][1] + WIDGET_OFFSET]

            this.create_widget_window(basic_worker_widget_dict, PATH_TO_WIDGET_HTML, EvLogger, coords)
        }
    }

    public exit_all(wrapper: any){
        for (let i = 0; i < this.widget_workers.length; i++){
            this.widget_workers[i]["win"].close()
            wrapper.unregister_window(this.widget_workers[i]["win"].window_id)
        }
        this.widget_workers = []
    }

    public minimize_widget(data: any[]){
        for (let i = 0; i < this.widget_workers.length; i++){
            if (this.widget_workers[i]["id"] == data[0]){
                this.widget_workers[i]["win"].minimize()
            }
        }
    }

    public maximize_widget(data: any[]){
        for (let i = 0; i < this.widget_workers.length; i++){
            if (this.widget_workers[i]["id"] == data[0]){
                this.widget_workers[i]["win"].maximize()
            }
        }
    }

    public exit_widget(data: any[], wrapper: any){
        for (let i = 0; i < this.widget_workers.length; i++){
            if (this.widget_workers[i]["id"] == data[0]){
                this.widget_workers[i]["win"].close()
                wrapper.unregister_window(this.widget_workers[i]["win"].window_id)

                this.widget_workers.splice(i, 1)
            }
        }
    }

    
    public create_widget_window(widget_dict: object, path_load: string, 
                                        event_logger: EventLogger, 
                                        coords: number[]){
        let datetimeWidgetWindow = new WidgetWindow(widget_dict, path_load, coords, event_logger)
        let datetime_id = utils.generate_id()
        
        this.widget_workers.push({
            "id": datetime_id,
            "win": datetimeWidgetWindow
        })
    }
}

export class WorkerWindowHandler{
    public constructor(){

    }
}