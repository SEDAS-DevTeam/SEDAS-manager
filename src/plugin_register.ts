/*
    File that handles plugins, their fetching, registering, etc.
*/

import utils from "./utils"

export class PluginRegister{
    private json_config: any;

    constructor (plugin_config_path: string){
        this.json_config = utils.readJSON(plugin_config_path);
    }

    // TODO: add more...
}