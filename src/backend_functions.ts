/*
    Module that defines all functions used in backend, that are direct callbacks to IPC
*/

import { EventLogger } from "./logger"
import { Window } from "./app_config"

export function redirect_to_menu(app: any, 
                                 EvLogger: EventLogger,
                                 window_type: string,
                                 window: Window){
    app.app_status["redir-to-main"] = false

    //message call to redirect to main menu
    EvLogger.log("DEBUG", "redirect-to-menu event")

    if (window_type == "settings"){
        window.close()
        app.wrapper.unregister_window(window.window_id)
    }
    else if (window_type == "controller"){
        window.close()
        app.wrapper.unregister_window(window.window_id)

        for (let i = 0; i < app.workers.length; i++){
            app.workers[i]["win"].close()
            app.wrapper.unregister_window(app.workers[i]["win"].window_id)
        }

        for (let i = 0; i < app.widget_workers.length; i++){
            app.widget_workers[i]["win"].close()
            app.wrapper.unregister_window(app.widget_workers[i]["win"].window_id)
        }
        app.widget_workers = []
    }
}