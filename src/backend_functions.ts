/*
    Module that defines all functions used in backend, that are direct callbacks to IPC
*/

import { EventLogger } from "./logger"
import utils from "./utils"
import {
    //window configs
    main_menu_dict,
    settings_dict,
    exit_dict,
    controller_dict,
    worker_dict,
    basic_worker_widget_dict,
    popup_widget_dict,
    load_dict,

    //window Classes
    Window,
    WidgetWindow,
    PopupWindow,

    //all init vars
    PATH_TO_MAIN_HTML,
    PATH_TO_SETTINGS_HTML,
    PATH_TO_CONTROLLER_HTML,
    PATH_TO_EXIT_HTML,
    PATH_TO_POPUP_HTML,

    PATH_TO_WORKER_HTML,
    PATH_TO_DEP_ARR_HTML,
    PATH_TO_EMBED_HTML,
    PATH_TO_WEATHER_HTML,

    ABS_PATH,
    PATH_TO_AUDIO_UPDATE,
    PATH_TO_MAPS,
    PATH_TO_COMMANDS,
    PATH_TO_AIRCRAFTS,
    PATH_TO_AIRLINES,

    PATH_TO_SPEECH_CONFIG,
    PATH_TO_TEXT_CONFIG,
    PATH_TO_VOICE_CONFIG,

    PATH_TO_IN_DEVICES,
    PATH_TO_OUT_DEVICES,

    PATH_TO_SETTINGS_LAYOUT

} from "./app_config"

export class BackendFunctions{
    private ev_logger: EventLogger;
    private app: any;

    public constructor(ev_logger: EventLogger, app: any){
        this.ev_logger = ev_logger
        this.app = app
    }

    public redirect_to_menu(window_type: string){
        this.app.app_status["redir-to-main"] = false

        //message call to redirect to main menu
        this.ev_logger.log("DEBUG", "redirect-to-menu event")

        if (window_type == "settings"){
            this.app.settingsWindow.close()
            this.app.wrapper.unregister_window(this.app.settingsWindow.window_id)
        }
        else if (window_type == "controller"){
            this.app.controllerWindow.close()
            this.app.wrapper.unregister_window(this.app.controllerWindow.window_id)

            for (let i = 0; i < this.app.workers.length; i++){
                this.app.workers[i]["win"].close()
                this.app.wrapper.unregister_window(this.app.workers[i]["win"].window_id)
            }

            for (let i = 0; i < this.app.widget_workers.length; i++){
                this.app.widget_workers[i]["win"].close()
                this.app.wrapper.unregister_window(this.app.widget_workers[i]["win"].window_id)
            }
            this.app.widget_workers = []
        }

        //calculate x, y
        let coords = utils.get_window_info(this.app.app_settings, this.app.displays, -1, "normal", main_menu_dict)[0]

        this.ev_logger.log("DEBUG", "main-menu show")
        this.app.mainMenuWindow = new Window(this.app.app_status, this.app.dev_panel, main_menu_dict, 
            PATH_TO_MAIN_HTML, coords, this.ev_logger, this.app)
        this.app.wrapper.register_window(this.app.mainMenuWindow, "main-menu")

        this.app.mainMenuWindow.show()
        
        this.app.workers = []
        this.app.widget_workers = []
        this.app.controllerWindow = undefined
        this.app.PlaneDatabase = undefined
    }

    public redirect_to_settings(){
        //message call to redirect to settings
        this.app.app_status["redir-to-main"] = true

        this.ev_logger.log("DEBUG", "redirect-to-settings event")

        this.app.mainMenuWindow.close()
        this.app.wrapper.unregister_window(this.app.mainMenuWindow.window_id)

        //calculate x, y
        const [coords, display_info] = utils.get_window_info(this.app.app_settings, this.app.displays, -1, "normal")

        this.ev_logger.log("DEBUG", "settings show")
        this.app.settingsWindow = new Window(this.app.app_status, this.app.dev_panel, settings_dict, PATH_TO_SETTINGS_HTML, coords, this.ev_logger, this.app, "settings", display_info)
        this.app.wrapper.register_window(this.app.settingsWindow, "settings")
        
        this.app.settingsWindow.show()
    }

    public redirect_to_main(){
        //message call to redirect to main program (start)
        this.app.app_status["redir-to-main"] = true
        if (this.app.app_status["turn-on-backend"]){
            this.app.backend_worker.postMessage(["action", "start-neural"])
        }
        this.app.main_app()
    }
}