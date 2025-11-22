/*
    File that handles plugins, their fetching, registering, etc.
*/

import utils from "./app_utils"
import {
  PluginRegisterInterface
} from "./app_config"

export class PluginRegister implements PluginRegisterInterface{
    private json_config: any;

    constructor (plugin_config_path: string){
        this.json_config = utils.read_file_content(plugin_config_path);
    }

    // TODO: add more...
}

//
// Plugin frontend handlers
// 

export function install_plugin(data: any[]){
    this.selected_plugin_id = data[0]
    let plugin_name = data[1]

    //create popup window for user confirmation
    let coords = utils.get_window_info(app_settings, this.displays, -1, "normal", popup_widget_dict)[0]
    this.current_popup_window = new PopupWindow(popup_widget_dict, 
                                                PATH_TO_POPUP_HTML, 
                                                coords, 
                                                EvLogger,  
                                                "confirm",
                                                "confirm-install")
    
    this.current_popup_window.load_popup(`Do you want to install plugin: ${plugin_name}?`, "Proceed?")
}

export function get_plugin_list(){
    this.wrapper.send_message("controller", "plugin-list", this.local_plugin_list)
}

export function confirm_install(data: any[]){
    if (data[0]){
        EvLogger.log("DEBUG", "Installing plugin")
        console.log(this.selected_plugin_id)
        //TODO
    }
    else{
        EvLogger.log("DEBUG", "Plugin install aborted by user")
    }
    this.current_popup_window.close()
    this.current_popup_window = undefined
}