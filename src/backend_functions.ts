/*
    Module that defines all functions used in backend, that are direct callbacks to IPC
*/

import { EventLogger } from "./logger"
import utils, {ProgressiveLoader} from "./utils"
import { Plane, PlaneDB } from "./plane_functions"
import {
    //window configs
    main_menu_dict,
    settings_dict,
    load_dict,

    //window Classes
    Window,

    //all init vars
    PATH_TO_MAIN_HTML,
    PATH_TO_SETTINGS_HTML,

    ABS_PATH,
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
import { Environment } from "./environment"

import fs from "fs";
import path from "path"

export class BackendFunctions{
    private ev_logger: EventLogger;
    private app: any;

    public constructor(ev_logger: EventLogger, app: any){
        this.ev_logger = ev_logger
        this.app = app
    }

    /*
        App redirects
    */

    // redirect to menu
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

    // redirect to settings
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

    //redirect to main app (starting workers and controller)
    public redirect_to_main(){
        //message call to redirect to main program (start)
        this.app.app_status["redir-to-main"] = true
        if (this.app.app_status["turn-on-backend"]){
            this.app.backend_worker.postMessage(["action", "start-neural"])
        }
        this.app.main_app()
    }

    /*
        Settings functions
    */

    // Save settings
    public save_settings(data: any[]){
        //save settings
        this.ev_logger.log("DEBUG", "saving settings")

        fs.writeFileSync(path.join(ABS_PATH, "/src/res/data/app/settings.json"), data[0])
        
        //inform user that settings are loaded only after restart
        this.app.current_popup_window = utils.create_popup_window(this.app.app_settings, this.ev_logger, this.app.displays,
            "alert", "confirm-settings",
            "Saved the settings",
            "Restart the app for changes to take the effect")
    }

    public send_info(window_type: string){
        if (window_type == "settings"){

            //ACAI backend¨
            let speech_config = utils.readJSON(PATH_TO_SPEECH_CONFIG)
            let text_config = utils.readJSON(PATH_TO_TEXT_CONFIG)
            let voice_config = utils.readJSON(PATH_TO_VOICE_CONFIG)

            //audio devices
            let in_devices = utils.readJSON(PATH_TO_IN_DEVICES)
            let out_devices = utils.readJSON(PATH_TO_OUT_DEVICES)

            //reading settings gui layouts
            let settings_layout = utils.readJSON(PATH_TO_SETTINGS_LAYOUT)

            //sending app data and alg configs
            this.app.wrapper.send_message("controller", "app-data", [this.app.app_settings, voice_config, text_config, speech_config, in_devices, out_devices, settings_layout])
        }
        else if (window_type == "controller"){
            //sending monitor data

            //acquiring airport map data
            this.app.map_configs_list = []
            var map_files = utils.list_files(PATH_TO_MAPS)
            for (let i = 0; i < map_files.length; i++){
                let map = utils.read_file_content(PATH_TO_MAPS, map_files[i])
                if (map_files[i].includes("config")){
                    this.app.map_configs_list.push({
                        "hash": "airport-" + utils.generate_hash(),
                        "content": map
                    })
                }
            }

            //acquiring list of aircraft presets
            this.app.aircraft_presets_list = []
            let aircraft_files = utils.list_files(PATH_TO_AIRCRAFTS)
            for (let i = 0; i < aircraft_files.length; i++){
                let aircraft_config = utils.read_file_content(PATH_TO_AIRCRAFTS, aircraft_files[i])
                this.app.aircraft_presets_list.push({
                    "path": aircraft_files[i],
                    "hash": "aircraft-" + utils.generate_hash(),
                    "name": aircraft_config["info"]["name"],
                    "content": JSON.stringify(aircraft_config["all_planes"])
                })
            }

            //acquiring list of command presets
            this.app.command_presets_list = []
            let command_files = utils.list_files(PATH_TO_COMMANDS)
            for (let i = 0; i < command_files.length; i++){
                let commands_config = utils.read_file_content(PATH_TO_COMMANDS, command_files[i])
                this.app.command_presets_list.push({
                    "path": command_files[i],
                    "hash": "command-" + utils.generate_hash(),
                    "name": commands_config["info"]["name"],
                    "content": JSON.stringify(commands_config["commands"])
                })
            }
            this.app.wrapper.send_message("controller", "init-info", ["window-info", JSON.stringify(this.app.workers), this.app.map_configs_list, 
                            JSON.stringify(this.app.app_settings), [this.app.map_name, this.app.command_preset_name, this.app.aircraft_preset_name], this.app.aircraft_presets_list, 
                            this.app.command_presets_list, this.app.frontend_vars, this.app.app_status])
        }
        else if (window_type == "worker"){
            //send to all workers
            this.app.wrapper.broadcast("workers", "init-info", ["window-info", JSON.stringify(this.app.app_settings)])
        }
    }

    public send_scenario_list(data: any[]){
        //rewrite scenario presets lists
        this.app.scenario_presets_list = []
        console.log(data)

        let selected_map_data = utils.read_file_content(PATH_TO_MAPS, data[0])
        let scenarios = selected_map_data["scenarios"]
        if (scenarios == undefined){
            this.app.wrapper("controller", "scenario-list", [])
            return
        }

        for (let i = 0; i < scenarios.length; i++){
            this.app.scenario_presets_list.push({
                "hash": "scenario-" + utils.generate_hash(),
                "name": scenarios[i]["name"],
                "content": scenarios[i],
            })
        }

        this.app.wrapper.send_message("controller", "scenario-list", this.app.scenario_presets_list)
    }

    public set_environment(data: any[]){
        //getting map info, command preset info, aircraft preset info from user
        let filename_map = data[0]
                    
        //map addons
        let scenario_hash = data[3]

        let filename_command = data[1]
        let filename_aircraft = data[2]

        //save map data to variable
        this.app.map_data = utils.read_file_content(PATH_TO_MAPS, filename_map)

        //get scenario data
        for (let i = 0; i < this.app.scenario_presets_list.length; i++){
            if (scenario_hash == this.app.scenario_presets_list[i]["hash"]){
                this.app.scenario_data = this.app.scenario_presets_list[i]["content"]
            }
        }

        //save map name for backup usage
        let map_config = utils.read_file_content(PATH_TO_MAPS, this.app.map_data["CONFIG"])
        this.app.map_name = map_config["AIRPORT_NAME"]

        this.app.command_preset_data = utils.read_file_content(PATH_TO_COMMANDS, filename_command)
        this.app.command_preset_name = this.app.command_preset_data["info"]["name"]

        this.app.aircraft_preset_data = utils.read_file_content(PATH_TO_AIRCRAFTS, filename_aircraft)
        this.app.aircraft_preset_name = this.app.aircraft_preset_data["info"]["name"]

        //set now to default (TODO: change later?)
        this.app.airline_preset_data = utils.read_file_content(PATH_TO_AIRLINES, "airline_data.json")
        this.app.airline_preset_name = this.app.aircraft_preset_data["info"]["name"]

        //read scale
        this.app.scale = utils.parse_scale(this.app.map_data["scale"])

        //for weather to align latitude, longtitude and zoom (https://www.maptiler.com/google-maps-coordinates-tile-bounds-projection/#1/131.42/4.37)
        if (this.app.map_data == undefined){
            //map wasn't selected
            this.app.longitude = undefined
            this.app.latitude = undefined
            this.app.zoom = undefined
        }
        else{
            this.app.longitude = this.app.map_data["long"]
            this.app.latitude = this.app.map_data["lat"]
            this.app.zoom = this.app.map_data["zoom"]
        }

        this.ev_logger.log("DEBUG", `Selected presets: ${[this.app.map_name, this.app.command_preset_name, this.app.aircraft_preset_name]}`)
        

        this.app.loader = new ProgressiveLoader(this.app.app_settings, this.app.displays, load_dict, this.ev_logger)
        this.app.loader.setup_loader(5, "Setting up simulation, please wait...", "Initializing simulation setup")
        
        this.app.enviro_logger = new EventLogger(true, "enviro_log", "environment")
        this.app.enviro_logger.log("INFO", "EventLogger instance on Environment is set up")

        this.app.loader.send_progress("Setting up environment")
        this.app.enviro = new Environment(this.ev_logger, this.app, ABS_PATH, this.app.PlaneDatabase,
            this.app.command_preset_data,
            this.app.aircraft_preset_data,
            this.app.airline_preset_data,
            this.app.map_data, 
            this.app.scenario_data,
            parseFloat(this.app.app_settings["std_bank_angle"]))
        

        this.app.loader.send_progress("Setting plane schedules")
        this.app.enviro_logger.log("INFO", "Setting plane shedules")
        let n_unused_schedules = this.app.enviro.set_plane_schedules()
        if (n_unused_schedules > 0){
            //some schedules are deleted because no avaliable plane was found matching
            
            this.app.current_popup_window = utils.create_popup_window(this.app.app_settings, this.ev_logger, this.app.displays,
                                    "alert", "confirm-schedules",
                                    `WARNING: ${n_unused_schedules} plane schedules are going to be unused`,
                                    "because plane was not matching schedule type")
        }
        else{
            this.app.setup_environment()
        }
    }

    public render_map(){
        //rendering map data for user (invoked from worker)
        for (let i = 0; i < this.app.workers.length; i++){
            this.app.workers[i]["win"].send_message("map-data", [this.app.map_data, this.app.workers[i]["win"].win_type])
        }

        this.send_location_data()
    }

    public get_points(data: any[]){
        let spec_data: object;
        if (data[0].includes("ACC")){
            //selected monitor is in ACC mode
            spec_data = this.app.map_data["ACC"]
        }
        else if (data[0].includes("APP")){
            //selected monitor is in APP mode
            spec_data = this.app.map_data["APP"]
        }
        else if (data[0].includes("TWR")){
            //selected monitor is in TWR mode
            spec_data = this.app.map_data["TWR"]
        }
        let out_data = {}
        for (const [key, value] of Object.entries(spec_data)) {
            if (key == "POINTS" || key == "ARP" || key == "SID" || key == "STAR" || key == "RUNWAY"){
                out_data[key] = value
            }
        }
        this.app.wrapper.send_message("controller", "map-points", JSON.stringify(out_data))
    }

    public map_check(){
        if (this.app.map_data == undefined){
            this.ev_logger.log("WARN", "user did not check any map")
            this.app.wrapper.send_message("controller", "map-checked", JSON.stringify({"user-check": false}))
        }
        else {
            this.ev_logger.log("DEBUG", "user checked a map")
            this.app.wrapper.send_message("controller", "map-checked", JSON.stringify({"user-check": true}))
        }
    }

    public send_location_data(){
        for (let i = 0; i < this.app.workers.length; i++){
            if (this.app.workers[i]["win"]["win_type"] == "weather"){ //this layer is unchanged because IPC wrapper has no ways of handling different worker types (TODO)
                this.app.workers[i]["win"].send_message("geo-data", [this.app.latitude, this.app.longitude, this.app.zoom])
            }
        }
    }

    /*
        Plane control
    */
    public spawn_plane(data: any[]){
        let plane_data = data[0]

        //get current x, y coordinates according to selected points
        let x = 0
        let y = 0
        //get according map data
        let point_data = this.app.map_data[plane_data["monitor"].substring(plane_data["monitor"].length - 3, plane_data["monitor"].length)]
        
        //get departure point (ARP/POINTS/SID/STAR)
        let corresponding_points = plane_data["departure"].split("_")
        let point_name = corresponding_points[0]
        let point_group = corresponding_points[1]



        for (let i = 0; i < point_data[point_group].length; i++){
            if (point_name == point_data[point_group][i].name){
                //found corresponding point - set initial point
                x = point_data[point_group][i].x
                y = point_data[point_group][i].y
            }
        }
        
        let curr_plane_id = utils.generate_hash()
        let plane = new Plane(curr_plane_id, plane_data["name"], 
                        plane_data["heading"], plane_data["heading"],
                        plane_data["level"], plane_data["level"],
                        plane_data["speed"], plane_data["speed"],
                        plane_data["departure"], plane_data["arrival"], 
                        plane_data["arrival_time"],
                        x, y)
        this.app.PlaneDatabase.add_record(plane, plane_data["monitor"])

        this.app.broadcast_planes(this.app.PlaneDatabase.DB, this.app.PlaneDatabase.monitor_DB, this.app.PlaneDatabase.plane_paths_DB)
    }

    public plane_value_change(data: any[]){
        //TODO: add args to set command
        this.app.PlaneDatabase.set_command(data[2], data[0], data[1])      
        this.app.broadcast_planes(this.app.PlaneDatabase.DB, this.app.PlaneDatabase.monitor_DB, this.app.PlaneDatabase.plane_paths_DB)
        this.app.wrapper.send_message("controller", "terminal-add", data[1].slice(1))
    }

    public plane_delete_record(data: any[]){
        this.app.PlaneDatabase.delete_record(data[0])
        this.app.broadcast_planes(this.app.PlaneDatabase.DB, this.app.PlaneDatabase.monitor_DB, this.app.PlaneDatabase.plane_paths_DB)
    }

    public send_plane_data(){
        this.app.wrapper.broadcast("workers", "update-plane-db", this.app.PlaneDatabase.DB)
    }
}