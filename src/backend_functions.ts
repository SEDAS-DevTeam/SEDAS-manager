/*
    Module that defines all functions used in backend, that are direct callbacks to IPC
*/

import { EventLogger } from "./logger"
import utils, {ProgressiveLoader, IPCwrapper, MSCwrapper} from "./utils"
import {PluginRegister} from "./plugin_register"
import { Plane, PlaneDB } from "./plane_functions"
import { Worker } from "worker_threads"

import {
    //window configs
    main_menu_dict,
    settings_dict,
    load_dict,

    //window classes
    Window,
    WidgetWindow,
    PopupWindow,

    //window handler classes
    WidgetWindowHandler,
    WorkerWindowHandler,

    //all init vars
    PATH_TO_MAIN_HTML,
    PATH_TO_SETTINGS_HTML,

    ABS_PATH,
    PATH_TO_MAPS,
    PATH_TO_COMMANDS,
    PATH_TO_AIRCRAFTS,
    PATH_TO_AIRLINES,

    PATH_TO_SETTINGS_LAYOUT
} from "./app_config"
import { Environment } from "./environment"

import fs from "fs";
import path from "path"

export class MainAppFunctions{
    //window variable declarations
    public mainMenuWindow: Window;
    public settingsWindow: Window;
    public controllerWindow: Window;
    public exitWindow: Window;

    //all variables that contain "low-level" functionalities of the app
    public app_settings: object;
    public dev_panel: boolean;
    public displays = [];
    public workers: object[] = [];
    public worker_coords: object[] = [];

    public enviro: Environment;
    public plugin_register: PluginRegister;
    public wrapper: IPCwrapper;
    public msc_wrapper: MSCwrapper;
    public ev_logger: EventLogger;
    public widget_handler: WidgetWindowHandler;
    public worker_handler: WorkerWindowHandler;

    //all variables related to frontend
    public frontend_vars = {
        "controller_mon": {},
        "controller_set": {},
        "controller_sim": {},
        "wiki": {},
        "glob": {} //variables used across windows
    } //used to save variables that are then used on redirect between windows

    //all variables related to environment/map
    public map_configs_list: object[] = [];
    public map_data: object;
    public map_name: string = "None";
    public scenario_presets_list: object[] = []
    public scenario_data: object = undefined;
    public scenario_name: string = "None"

    public enviro_logger: EventLogger;

    public scale: number;
    public longitude: number = undefined;
    public latitude: number = undefined;
    public zoom: number = undefined;

    //all variables related to aircrafts
    public aircraft_presets_list: object[] = []
    public aircraft_preset_data: object = undefined;
    public aircraft_preset_name: string = "None"

    //all variables related to commands
    public command_presets_list: object[] = []
    public command_preset_data: object = undefined;
    public command_preset_name: string = "None"

    //app status (consists of switches/booleans for different functions 
    //  => written in dict for better arg passing to funcs + better readibility
    public app_status: Record<string, boolean> = {
        "internet-connection": false, //switch for internet connectivity and how to handle it in code
        "turn-on-backend": true,      //
        "backup-db-on": true,         //
        "app-running": true,          //
        "sim-running": false,         //
        "redir-to-main": false        //
    }

    //worker files
    public backup_worker: Worker;
    public PlaneDatabase: PlaneDB;

    //temporary variables
    public selected_plugin_id: string;
    public current_popup_window: PopupWindow; //For now, app only permits one popup window at the time (TODO)

    //other variables
    public loader: ProgressiveLoader;
    public backupdb_saving_frequency: number = 1000; //defaultly set to 1 second
    public local_plugin_list: object[];

    public constructor(app_settings: object, ev_logger: EventLogger){
        this.app_settings = app_settings
        this.ev_logger = ev_logger

        this.dev_panel = app_settings["debug_panel"]
    }

    /*
        Function definitions that are called in MainApp class
    */

    public broadcast_planes(planes: object[], plane_monitor_data: object[], plane_paths_data: object[]){}
    public main_app(backup_db: object = undefined){}
    public setup_environment(){}

    /*
        App redirects
    */

    // redirect to menu
    public redirect_to_menu(window_type: string){
        this.app_status["redir-to-main"] = false

        //message call to redirect to main menu
        this.ev_logger.log("DEBUG", "redirect-to-menu event")

        if (window_type == "settings"){
            this.settingsWindow.close()
            this.wrapper.unregister_window(this.settingsWindow.window_id)
        }
        else if (window_type == "controller"){
            this.controllerWindow.close()
            this.wrapper.unregister_window(this.controllerWindow.window_id)

            for (let i = 0; i < this.workers.length; i++){
                this.workers[i]["win"].close()
                this.wrapper.unregister_window(this.workers[i]["win"].window_id)
            }

            this.widget_handler.exit_all(this.wrapper)
        }

        //calculate x, y
        let coords = utils.get_window_info(this.app_settings, this.displays, -1, "normal", main_menu_dict)[0]

        this.ev_logger.log("DEBUG", "main-menu show")
        this.mainMenuWindow = new Window(this.app_status, this.dev_panel, main_menu_dict, 
            PATH_TO_MAIN_HTML, coords, this.ev_logger, this)
        this.wrapper.register_window(this.mainMenuWindow, "main-menu")

        this.mainMenuWindow.show()
        
        this.workers = []
        this.controllerWindow = undefined
        this.PlaneDatabase = undefined
    }

    // redirect to settings
    public redirect_to_settings(){
        //message call to redirect to settings
        this.app_status["redir-to-main"] = true

        this.ev_logger.log("DEBUG", "redirect-to-settings event")

        this.mainMenuWindow.close()
        this.wrapper.unregister_window(this.mainMenuWindow.window_id)

        //calculate x, y
        const [coords, display_info] = utils.get_window_info(this.app_settings, this.displays, -1, "normal")

        this.ev_logger.log("DEBUG", "settings show")
        this.settingsWindow = new Window(this.app_status, this.dev_panel, settings_dict, PATH_TO_SETTINGS_HTML, coords, this.ev_logger, this, "settings", display_info)
        this.wrapper.register_window(this.settingsWindow, "settings")
        
        this.settingsWindow.show()
    }

    //redirect to main app (starting workers and controller)
    public async redirect_to_main(){
        //message call to redirect to main program (start)
        this.app_status["redir-to-main"] = true
        this.main_app()
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
        this.current_popup_window = utils.create_popup_window(this.app_settings, this.ev_logger, this.displays,
            "alert", "confirm-settings",
            "Saved the settings",
            "Restart the app for changes to take the effect")
    }

    public send_info(window_type: string){
        if (window_type == "settings"){

            //reading settings gui layouts
            let settings_layout = utils.readJSON(PATH_TO_SETTINGS_LAYOUT)

            //sending app data and alg configs
            console.log("sending app data")
            //TODO: rework this...
            this.wrapper.send_message("settings", "app-data", [this.app_settings, settings_layout])
        }
        else if (window_type == "controller"){
            //sending monitor data

            //acquiring airport map data
            this.map_configs_list = []
            var map_files = utils.list_files(PATH_TO_MAPS)
            for (let i = 0; i < map_files.length; i++){
                let map = utils.read_file_content(PATH_TO_MAPS, map_files[i])
                if (map_files[i].includes("config")){
                    this.map_configs_list.push({
                        "hash": "airport-" + utils.generate_hash(),
                        "content": map
                    })
                }
            }

            //acquiring list of aircraft presets
            this.aircraft_presets_list = []
            let aircraft_files = utils.list_files(PATH_TO_AIRCRAFTS)
            for (let i = 0; i < aircraft_files.length; i++){
                let aircraft_config = utils.read_file_content(PATH_TO_AIRCRAFTS, aircraft_files[i])
                this.aircraft_presets_list.push({
                    "path": aircraft_files[i],
                    "hash": "aircraft-" + utils.generate_hash(),
                    "name": aircraft_config["info"]["name"],
                    "content": JSON.stringify(aircraft_config["all_planes"])
                })
            }

            //acquiring list of command presets
            this.command_presets_list = []
            let command_files = utils.list_files(PATH_TO_COMMANDS)
            for (let i = 0; i < command_files.length; i++){
                let commands_config = utils.read_file_content(PATH_TO_COMMANDS, command_files[i])
                this.command_presets_list.push({
                    "path": command_files[i],
                    "hash": "command-" + utils.generate_hash(),
                    "name": commands_config["info"]["name"],
                    "content": JSON.stringify(commands_config["commands"])
                })
            }
            this.wrapper.send_message("controller", "init-info", ["window-info", 
                                    JSON.stringify(this.workers), 
                                    this.map_configs_list, 
                                    JSON.stringify(this.app_settings), 
                                    [this.map_name, this.command_preset_name, this.aircraft_preset_name, this.scenario_name], 
                                    this.aircraft_presets_list, 
                                    this.command_presets_list, 
                                    this.frontend_vars, 
                                    this.app_status])
        }
        else if (window_type == "worker"){
            //send to all workers
            this.wrapper.broadcast("workers", "init-info", ["window-info", JSON.stringify(this.app_settings)])
        }
    }

    public send_scenario_list(data: any[]){
        //rewrite scenario presets lists
        this.scenario_presets_list = []
        console.log(data)

        let selected_map_data = utils.read_file_content(PATH_TO_MAPS, data[0])
        let scenarios = selected_map_data["scenarios"]
        if (scenarios == undefined){
            this.wrapper.send_message("controller", "scenario-list", [])
            return
        }

        for (let i = 0; i < scenarios.length; i++){
            this.scenario_presets_list.push({
                "hash": "scenario-" + utils.generate_hash(),
                "name": scenarios[i]["name"],
                "content": scenarios[i],
            })
        }

        this.wrapper.send_message("controller", "scenario-list", this.scenario_presets_list)
    }

    public set_environment(data: any[]){
        //getting map info, command preset info, aircraft preset info from user
        let filename_map = data[0]
                    
        //map addons
        let scenario_hash = data[3]

        let filename_command = data[1]
        let filename_aircraft = data[2]

        //save map data to variable
        this.map_data = utils.read_file_content(PATH_TO_MAPS, filename_map)

        //get scenario data
        for (let i = 0; i < this.scenario_presets_list.length; i++){
            if (scenario_hash == this.scenario_presets_list[i]["hash"]){
                this.scenario_data = this.scenario_presets_list[i]["content"]
                this.scenario_name = this.scenario_presets_list[i]["name"]
            }
        }

        //save map name for backup usage
        let map_config = utils.read_file_content(PATH_TO_MAPS, this.map_data["CONFIG"])
        this.map_name = map_config["AIRPORT_NAME"]

        this.command_preset_data = utils.read_file_content(PATH_TO_COMMANDS, filename_command)
        this.command_preset_name = this.command_preset_data["info"]["name"]

        this.aircraft_preset_data = utils.read_file_content(PATH_TO_AIRCRAFTS, filename_aircraft)
        this.aircraft_preset_name = this.aircraft_preset_data["info"]["name"]

        //read scale
        this.scale = utils.parse_scale(this.map_data["scale"])

        //for weather to align latitude, longtitude and zoom (https://www.maptiler.com/google-maps-coordinates-tile-bounds-projection/#1/131.42/4.37)
        if (this.map_data == undefined){
            //map wasn't selected
            this.longitude = undefined
            this.latitude = undefined
            this.zoom = undefined
        }
        else{
            this.longitude = this.map_data["long"]
            this.latitude = this.map_data["lat"]
            this.zoom = this.map_data["zoom"]
        }

        this.ev_logger.log("DEBUG", `Selected presets: ${[this.map_name, this.command_preset_name, this.aircraft_preset_name]}`)
        

        this.loader = new ProgressiveLoader(this.app_settings, this.displays, load_dict, this.ev_logger)
        this.loader.setup_loader(5, "Setting up simulation, please wait...", "Initializing simulation setup")
        
        this.enviro_logger = new EventLogger(true, "enviro_log", "environment")
        this.enviro_logger.init_logger()
        this.enviro_logger.log("INFO", "EventLogger instance on Environment is set up")

        // turn on the modules
        if (this.app_status["turn-on-backend"]){
            this.msc_wrapper.send_message("action", "start")
        }

        this.loader.send_progress("Setting up environment")
        this.enviro = new Environment(this.ev_logger, this, ABS_PATH, this.PlaneDatabase,
            this.command_preset_data,
            this.aircraft_preset_data,
            this.map_data, 
            this.scenario_data,
            parseFloat(this.app_settings["std_bank_angle"]),
            this.msc_wrapper)
        

        this.loader.send_progress("Setting plane schedules")
        this.enviro_logger.log("INFO", "Setting plane shedules")
        let n_unused_schedules = this.enviro.set_plane_schedules()
        if (n_unused_schedules > 0){
            //some schedules are deleted because no avaliable plane was found matching
            
            this.current_popup_window = utils.create_popup_window(this.app_settings, this.ev_logger, this.displays,
                                    "alert", "confirm-schedules",
                                    `WARNING: ${n_unused_schedules} plane schedules are going to be unused`,
                                    "because plane was not matching schedule type")
        }
        else{
            this.setup_environment()
        }
    }

    public render_map(){
        //rendering map data for user (invoked from worker)
        for (let i = 0; i < this.workers.length; i++){
            this.workers[i]["win"].send_message("map-data", [this.map_data, this.workers[i]["win"].win_type])
        }

        this.send_location_data()
    }

    public get_points(data: any[]){
        let spec_data: object;
        if (data[0].includes("ACC")){
            //selected monitor is in ACC mode
            spec_data = this.map_data["ACC"]
        }
        else if (data[0].includes("APP")){
            //selected monitor is in APP mode
            spec_data = this.map_data["APP"]
        }
        else if (data[0].includes("TWR")){
            //selected monitor is in TWR mode
            spec_data = this.map_data["TWR"]
        }
        let out_data = {}
        for (const [key, value] of Object.entries(spec_data)) {
            if (key == "POINTS" || key == "ARP" || key == "SID" || key == "STAR" || key == "RUNWAY"){
                out_data[key] = value
            }
        }
        this.wrapper.send_message("controller", "map-points", JSON.stringify(out_data))
    }

    public map_check(){
        if (this.map_data == undefined){
            this.ev_logger.log("WARN", "user did not check any map")
            this.wrapper.send_message("controller", "map-checked", JSON.stringify({"user-check": false}))
        }
        else {
            this.ev_logger.log("DEBUG", "user checked a map")
            this.wrapper.send_message("controller", "map-checked", JSON.stringify({"user-check": true}))
        }
    }

    public send_location_data(){
        for (let i = 0; i < this.workers.length; i++){
            if (this.workers[i]["win"]["win_type"] == "weather"){ //this layer is unchanged because IPC wrapper has no ways of handling different worker types (TODO)
                this.workers[i]["win"].send_message("geo-data", [this.latitude, this.longitude, this.zoom])
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
        let point_data = this.map_data[plane_data["monitor"].substring(plane_data["monitor"].length - 3, plane_data["monitor"].length)]
        
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
        this.PlaneDatabase.add_record(plane, plane_data["monitor"])

        if(this.app_status["turn-on-backend"]){
            // register plane on ai
            let voice_intensity: string = ((Math.random() * 0.9) + 0.1).toFixed(2) // generate random voice intensity from range 0.1 to 0.9
            this.msc_wrapper.send_message("module", "ai_backend", "register", plane_data["name"], voice_intensity)
        }

        this.broadcast_planes(this.PlaneDatabase.DB, this.PlaneDatabase.monitor_DB, this.PlaneDatabase.plane_paths_DB)
    }

    public plane_value_change(data: any[]){
        //TODO: add args to set command
        this.PlaneDatabase.set_command(data[2], data[0], data[1])      
        this.broadcast_planes(this.PlaneDatabase.DB, this.PlaneDatabase.monitor_DB, this.PlaneDatabase.plane_paths_DB)
        this.wrapper.send_message("controller", "terminal-add", data)
    }

    public plane_delete_record(data: any[]){ // add MSC_wrapper here!
        this.PlaneDatabase.delete_record(data[0])
        this.broadcast_planes(this.PlaneDatabase.DB, this.PlaneDatabase.monitor_DB, this.PlaneDatabase.plane_paths_DB)
    }

    public send_plane_data(){
        this.wrapper.broadcast("workers", "update-plane-db", this.PlaneDatabase.DB)
    }
}