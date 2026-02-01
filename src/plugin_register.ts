/*
    File that handles plugins, their fetching, registering, etc.
*/

import utils from "./app_utils"
import {
  PluginRegisterInterface,
  MainAppInterface,
  
  popup_widget_dict,
  
  PopupWindow,
  
  PATH_TO_POPUP_HTML
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

export function install_plugin(main_app: MainAppInterface, data: any[]){
    main_app.selected_plugin_id = data[0]
    let plugin_name = data[1]

    //create popup window for user confirmation
    let coords = utils.calculate_center(
      popup_widget_dict.width,
      popup_widget_dict.height,
      
      main_app.monitor_info[1].center[0],
      main_app.monitor_info[1].center[1]
    )
    this.current_popup_window = new PopupWindow(popup_widget_dict, 
                                                PATH_TO_POPUP_HTML, 
                                                coords, 
                                                main_app.logger,  
                                                "confirm",
                                                "confirm-install")
    
    this.current_popup_window.load_popup(`Do you want to install plugin: ${plugin_name}?`, "Proceed?")
}

export function get_plugin_list(main_app: MainAppInterface){
    main_app.wrapper.send_message("controller", "plugin-list", this.local_plugin_list)
}

export function confirm_install(main_app: MainAppInterface, data: any[]){
    if (data[0]){
        main_app.logger.log("DEBUG", "Installing plugin")
        console.log(this.selected_plugin_id)
        //TODO
    }
    else{
        main_app.logger.log("DEBUG", "Plugin install aborted by user")
    }
    this.current_popup_window.close()
    this.current_popup_window = undefined
}