/*
    Main file for SEDAS app
*/

//read runtime args + settings ABS_PATH (first thing that needs to be done on app start)
const runtime_args: Record<string, string> = parse_args()
process.env.ABS_PATH = (runtime_args["devel_path"] != undefined) ? runtime_args["devel_path"] : resolve("")

//glob imports
import fs from "fs";
import { resolve } from "path";
import { Worker } from "worker_threads"
import path from "path"
import { app, screen } from "electron";

//relative imports
import { Plane, PlaneDB } from "./plane_functions"
import { EventLogger } from "./logger"

import utils, {ProgressiveLoader, IPCwrapper, MSCwrapper, ElMonitor_object, PyMonitor_object, JsonData} from "./utils"
import {PluginRegister} from "./plugin_register" // TODO

// responsible for reading CLI arguments and setting all the variables accordingly
import {
    //window configs
    main_menu_dict,
    exit_dict,
    controller_dict,
    worker_dict,
    popup_widget_dict,
    load_dict,
    basic_worker_widget_dict,

    //window lasses
    Window,
    WidgetWindow,
    PopupWindow,
    WorkerWindow,

    //window handler classes
    WidgetWindowHandler,

    //html resource paths
    PATH_TO_MAIN_HTML,
    PATH_TO_CONTROLLER_HTML,
    PATH_TO_EXIT_HTML,
    PATH_TO_POPUP_HTML,

    PATH_TO_WORKER_HTML,
    PATH_TO_DEP_ARR_HTML,
    PATH_TO_EMBED_HTML,
    PATH_TO_WEATHER_HTML,
    PATH_TO_WIDGET_HTML,
    
    //local storage paths
    PATH_TO_PLUGINS,
    PATH_TO_MODULES,

    PATH_TO_MSC,
    PATH_TO_INSTALLER,
    PATH_TO_SETTINGS,
    PATH_TO_MONITOR_CONFIGURATION,
    PATH_TO_BACKUP
} from "./app_config"

import { MainAppFunctions } from "./backend_functions"

//C++ (N-API) imports
import { main } from "./bind";

//declaration for local workerWindow before assignment
var workerWindow: Window;

class MainApp extends MainAppFunctions{
    public constructor(app_settings: object, ev_logger: EventLogger){
        super(app_settings, ev_logger)

        this.app_settings = app_settings
        this.dev_panel = app_settings["debug_panel"]
    }

    //
    //Built-in functions
    //

    public setup_environment(){
        this.enviro.setup_enviro(this.loader, this.enviro_logger)

        this.loader.destroy_loaders()
        this.loader = undefined
        
        //everything is set up, time to load
        this.wrapper.broadcast("workers", "ask-for-render", []) //send workers command to fire "render-map" event
        
        //registering & rendering widget workers (TODO: disabling for now -> for demonstration purposes)
        //this.widget_handler.setup_all(this.worker_coords, EvLogger)
        //this.widget_handler.show_all()
    }

    private get_screen_info(){
        //get screen info
        var displays_info: any[] = screen.getAllDisplays()
        var displays_mod = []
        for(let i: number = 0; i < displays_info.length; i++){
            displays_mod.push(displays_info[i].bounds)
        }
        displays_mod.sort((a, b) => a.x - b.x);
        this.displays = displays_mod
    }

    public broadcast_planes(planes: object[], plane_monitor_data: object[], plane_paths_data: object[]){
        if (this.controllerWindow != undefined && this.workers.length != 0){
            //update planes on controller window
            this.wrapper.send_message("controller", "update-plane-db", planes)
    
            for (let i = 0; i < plane_monitor_data.length; i++){
                let temp_planes = []
    
                for (let i_plane = 0; i_plane < plane_monitor_data[i]["planes_id"].length; i_plane++){
                    //loop through all planes on specific monitor
    
                    //retrieve specific plane by id
                    for (let i2_plane = 0; i2_plane < planes.length; i2_plane++){
                        if (planes[i2_plane]["id"] == plane_monitor_data[i]["planes_id"][i_plane]){
                            temp_planes.push(planes[i2_plane])
                        }
                    }
                }
    
                //send updated data to all workers
                this.workers[i]["win"].send_message("update-plane-db", temp_planes)
                //send path data to all workers
                this.workers[i]["win"].send_message("update-paths", plane_paths_data)
            }
        }
    }

    //
    // event listener init
    //
    public add_listener_backend(){
        //backend-worker events
        if (this.app_status["turn-on-backend"]){
            this.msc_wrapper.set_listener((message: string[]) => {
                if (message[0] == "channels"){
                    // check which channels are permitted to send messages
                    this.msc_wrapper.enabled_channels = JSON.parse(message[1])
                }
                else if (message[0] == "module"){
                    let msg_command: string[] = JSON.parse(message[1])
                    if (msg_command[0] == "sedas_ai"){
                        let callsign: string = msg_command[1];
                        let value: string = msg_command[2];
                        let command: string = msg_command[3];

                        // update plane status
                        this.plane_value_change([command, value, callsign])
                    }
                }
            })

            /*
            this.backend_worker.on("message", (message: string) => {
                //processing from backend.js
                let arg = message.split(":")[0]
                let content = message.split(":")[1]

                switch(arg){
                    case "command":
                        let command_args = content.split(" ")

                        //TODO: add args to set command
                        this.PlaneDatabase.set_command(command_args[0], command_args[1], command_args[2])
                        break
                    case "debug":
                        //used for debug logging
                        EvLogger.log("DEBUG", content)
                        break
                }
            })
            */
        }
    }

    public add_listener_backup(){
        //database worker events
        this.backup_worker.on("message", (message: string) => {
            if (Array.isArray(message)){
                switch(message[0]){
                    case "db-data":
                        var database_data = JSON.parse(message[1])
                        this.map_data = database_data["map"]

                        this.main_app(database_data) //start main app on backup restore
                        break
                }
            }
        })
    }

    public add_listener_IPC(){
        //IPC listeners

        this.wrapper.register_channel("redirect-to-menu", ["controller"], "unidirectional", () => this.redirect_to_menu("controller"))
        this.wrapper.register_channel("redirect-to-menu", ["settings"], "unidirectional", () => this.redirect_to_menu("settings"))
        this.wrapper.register_channel("redirect-to-settings", ["menu"], "unidirectional", () => this.redirect_to_settings())
        this.wrapper.register_channel("redirect-to-main", ["menu"], "unidirectional", () => this.redirect_to_main())

        this.wrapper.register_channel("save-settings", ["menu"], "unidirectional", (data: any[]) => this.save_settings(data))
        this.wrapper.register_channel("monitor-change-info", ["controller"], "unidirectional", (data: any[]) => this.monitor_change_info(data))
        this.wrapper.register_channel("exit", ["worker", "controller"], "unidirectional", () => this.exit())
        
        this.wrapper.register_channel("ping", ["controller", "settings", "embed"], "bidirectional", (data: any[]) => this.ping(data))
        
        //send app configuration to controller
        this.wrapper.register_channel("send-info", ["controller"], "bidirectional", () => this.send_info("controller"))
        this.wrapper.register_channel("send-info", ["worker"], "bidirectional", () => this.send_info("worker"))
        this.wrapper.register_channel("send-info", ["settings"], "bidirectional", () => this.send_info("settings"))

        //environment invokes
        this.wrapper.register_channel("start-sim", ["controller", "worker"], "unidirectional", () => this.start_sim())
        this.wrapper.register_channel("stop-sim", ["controller", "worker"], "unidirectional", () => this.stop_sim())
        this.wrapper.register_channel("start-mic", ["worker"], "unidirectional", () => this.start_mic_record())
        this.wrapper.register_channel("stop-mic", ["worker"], "unidirectional", () => this.stop_mic_record())
        this.wrapper.register_channel("restore-sim", ["controller"], "unidirectional", () => this.restore_sim())
        this.wrapper.register_channel("regenerate-map", ["controller"], "unidirectional", () => this.regenerate_map())

        this.wrapper.register_channel("set-environment", ["controller"], "unidirectional", (data: any[]) => this.set_environment(data))
        this.wrapper.register_channel("json-description", ["controller"], "bidirectional", (data: any[]) => this.json_description(data))

        this.wrapper.register_channel("render-map", ["controller", "worker"], "unidirectional", () => this.render_map())
        this.wrapper.register_channel("get-points", ["controller"], "bidirectional", (data: any[]) => this.get_points(data))
        this.wrapper.register_channel("map-check", ["controller"], "bidirectional", () => this.map_check())
        this.wrapper.register_channel("send-location-data", ["weather"], "unidirectional", () => this.send_location_data())

        //plane invokes
        this.wrapper.register_channel("spawn-plane", ["controller"], "unidirectional", (data: any[]) => this.spawn_plane(data))
        this.wrapper.register_channel("plane-value-change", ["controller"], "unidirectional", (data: any[]) => this.plane_value_change(data))
        this.wrapper.register_channel("plane-delete-record", ["controller"], "unidirectional", (data: any[]) => this.plane_delete_record(data))
        this.wrapper.register_channel("send-plane-data", ["dep_arra"], "unidirectional", () => this.send_plane_data())
        
        //widget invokes
        this.wrapper.register_channel("min-widget", ["worker-widget"], "unidirectional", (data: any[]) => this.widget_handler.minimize_widget(data))
        this.wrapper.register_channel("max-widget", ["worker-widget"], "unidirectional", (data: any[]) => this.widget_handler.maximize_widget(data))
        this.wrapper.register_channel("exit-widget", ["worker-widget"], "unidirectional", (data: any[]) => this.widget_handler.exit_widget(data, this.wrapper))

        //plugin invokes
        this.wrapper.register_channel("install-plugin", ["controller"], "unidirectional", (data: any[]) => this.install_plugin(data))
        this.wrapper.register_channel("get-plugin-list", ["controller"], "bidirectional", (data: any[]) => this.get_plugin_list())

        //confirm invokes
        this.wrapper.register_channel("confirm-install", ["popup"], "unidirectional", (data: any[]) => this.confirm_install(data))
        this.wrapper.register_channel("confirm-settings", ["popup"], "unidirectional", () => this.confirm_settings())
        this.wrapper.register_channel("confirm-schedules", ["popup"], "unidirectional", () => this.confirm_schedules())

        //other invokes
        this.wrapper.register_channel("send-scenario-list", ["controller"], "bidirectional", (data: any[]) => this.send_scenario_list(data))
        this.wrapper.register_channel("rewrite-frontend-vars", ["controller"], "unidirectional", (data: any[]) => this.rewrite_frontend_vars(data))

        //setting all listeners to be active
        this.wrapper.set_all_listeners()
    }

    public add_listener_intervals(){
        //disable intervals on app exit
        try {
            if (this.app_status["app-running"]){
                //update all planes on one second
                setInterval(() => {
                    if (this.PlaneDatabase != undefined && this.map_data != undefined && this.workers.length != 0){
                        if (this.app_status["sim-running"]){
                            this.PlaneDatabase.update_planes(this.scale, 
                                            parseFloat(app_settings["std_bank_angle"]), 
                                            parseFloat(app_settings["standard_pitch_up"]), 
                                            parseFloat(app_settings["standard_pitch_down"]),
                                            parseFloat(app_settings["standard_accel"]), 
                                            parseInt(app_settings["plane_path_limit"]))
                        }
                        if (this.app_status["app-running"]){
                            //send updated plane database to all
                            this.broadcast_planes(this.PlaneDatabase.DB, this.PlaneDatabase.monitor_DB, this.PlaneDatabase.plane_paths_DB)
                        }
                    }
                }, 1000)
    
                //send updated time to all workers
                setInterval(() => {
                    if (this.enviro != undefined && this.app_status["sim-running"]){
                        //send date & time to frontend
                        this.wrapper.broadcast("workers", "time", [this.enviro.current_time])
                    }
                }, 1000)
    
                //send plane data to backend
                setInterval(() => {
                    if (this.app_status["turn-on-backend"]){
                        if (this.PlaneDatabase == undefined){
                            this.msc_wrapper.send_message("module", "ai_backend", "data", [])
                        }
                        else{
                            this.msc_wrapper.send_message("module", "ai_backend", "data", this.PlaneDatabase.DB)
                        }
                    }
                }, 500)
    
                //on every n minutes, save to local DB if app crashes
                setInterval(() => {
                    if (this.app_status["backup-db-on"] && (this.PlaneDatabase != undefined) && (this.map_data != undefined) && (this.workers.length != 0)){
                        let simulation_dict = {
                            "planes": this.PlaneDatabase.DB,
                            "monitor-planes": this.PlaneDatabase.monitor_DB,
                            "monitor-data": this.workers,
                            "map": this.map_data,
                            "map-name": this.map_name,
                            "command-preset": this.command_preset_data,
                            "command-preset-name": this.command_preset_name,
                            "aircraft-preset": this.aircraft_preset_data,
                            "aircraft-preset-name": this.aircraft_preset_name
                        }
                
                        //save to local db using database.ts 
                        this.backup_worker.postMessage(["save-to-db", JSON.stringify(simulation_dict, null, 2)])
                        EvLogger.log("DEBUG", "Saving temporary backup...")
                    }
                }, this.backupdb_saving_frequency)
            }
        }
        catch(error){
            EvLogger.log("ERROR", "An error happened, written down below")
            EvLogger.log("", error)
        }
    }

    /*
        App general utils (used when registering IPC)
    */

    private exit(){
        //spawning info window
        EvLogger.log("DEBUG", "Closing app... Bye Bye")
        this.exit_app()
    }

    private monitor_change_info(data: any[]){
        console.log(data)
        let mon_data = data[0]
        for (let i = 0; i < this.workers.length; i++){
            if (this.workers[i]["win"].win_type != mon_data[i]["type"]){
                //rewrite current window type and render to another one
                let path_to_render = "";


                switch(mon_data[i]["type"]){
                    case "ACC":
                        //rewrite to Area control
                        path_to_render = PATH_TO_WORKER_HTML
                        //command_presets_listTODO: add rendering
                        break
                    case "APP":
                        //rewrite to Approach control
                        path_to_render = PATH_TO_WORKER_HTML
                        //TODO: add rendering
                        break
                    case "TWR":
                        //rewrite to tower
                        path_to_render = PATH_TO_WORKER_HTML
                        //TODO: add rendering
                        break
                    case "weather":
                        //rewrite to weather forecast
                        path_to_render = PATH_TO_WEATHER_HTML
                        break
                    case "dep_arr":
                        //rewrite to departure/arrival list
                        path_to_render = PATH_TO_DEP_ARR_HTML
                        break
                    case "embed":
                        path_to_render = PATH_TO_EMBED_HTML
                        break
                }

                this.workers[i]["win"].win_type = mon_data[i]["type"]
                this.workers[i]["win"].show(path_to_render)


            }
            //change worker data in monitor_data DB
            this.PlaneDatabase.update_worker_data(this.workers)
        }
    }

    private start_sim(){
        this.app_status["sim-running"] = true

        //send stop event to all workers
        this.wrapper.broadcast("workers", "sim-event", "startsim")
        this.wrapper.send_message("controller", "sim-event", "startsim")
    }

    private stop_sim(){
        this.app_status["sim-running"] = false

        //send stop event to all workers
        this.wrapper.broadcast("workers", "sim-event", "stopsim")
        this.wrapper.send_message("controller", "sim-event", "stopsim")
    }

    // TODO: solve for multi-session (multiple ATCos)
    private start_mic_record(){
        console.log(this.app_status["sim-running"])
        if (this.msc_wrapper && this.app_status["sim-running"]) this.msc_wrapper.send_message("module", "ai_backend", "start-mic")
    }

    private stop_mic_record(){
        if (this.msc_wrapper && this.app_status["sim-running"]) this.msc_wrapper.send_message("module", "ai_backend", "stop-mic")
    }

    private restore_sim(){
        this.backup_worker.postMessage(["read-db"])
    }

    private regenerate_map(){
        if (this.app_status["turn-on-backend"]){
            console.log("Terrain generation not done yet :)")
            //this.backend_worker.postMessage(["action", "terrain"])
        }
    }

    private rewrite_frontend_vars(data: any[]){
        this.frontend_vars = data[0]
        console.log(this.frontend_vars)
    }

    private install_plugin(data: any[]){
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

    private get_plugin_list(){
        this.wrapper.send_message("controller", "plugin-list", this.local_plugin_list)
    }

    private confirm_install(data: any[]){
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

    private confirm_settings(){
        this.current_popup_window.close()
        this.current_popup_window = undefined
    }

    private confirm_schedules(){
        this.setup_environment()

        this.current_popup_window.close()
        this.current_popup_window = undefined
    }

    private async ping(data: any[]){
        let status: boolean = await utils.ping(data[0])
        for (let i = 0; i < this.workers.length; i++){
            this.wrapper.send_message(this.workers[i]["win-name"], "ping-status", status)
        }
    }

    private json_description(data: any[]){
        if (data[1] == "command"){
            this.wrapper.send_message("controller", "description-data", this.command_presets_list[data[0]])
        }
        else if (data[1] == "aircraft"){
            this.wrapper.send_message("controller", "description-data", this.aircraft_presets_list[data[0]])
        }
    }

    //
    //App phase functions (init/main/exit)
    //
    public async init_app(){
        this.get_screen_info() // getting screen info for all displays

        // setup IPC wrapper
        this.wrapper = new IPCwrapper()

        // set progressive loader object on loaders
        this.loader = new ProgressiveLoader(app_settings, this.displays, load_dict, EvLogger)
        this.loader.setup_loader(8, "SEDAS is loading, please wait...", "Initializing app")

        // set other important segments on MainApp
        this.widget_handler = new WidgetWindowHandler()

        /*
            Loader segment 1
        */
        this.loader.send_progress("Reading app configuration")

        //read JSON
        const app_settings_raw = fs.readFileSync(PATH_TO_SETTINGS, "utf-8")
        this.app_settings = JSON.parse(app_settings_raw);

        EvLogger.log("DEBUG", "APP-INIT")

        /*
            Loader segment 7 (rest of segments are in update_all)
        */
        this.loader.send_progress("Setting all backend processes")

        //workers
        if (this.app_settings["backend_init"]){
            EvLogger.log("DEBUG", "Starting Backend because flag backend_init is true")

            var backend_settings = { // settings only to be passed to backend
                "noise": this.app_settings["noise"],
                "abs_path": process.env.ABS_PATH
            }

            this.msc_wrapper = new MSCwrapper(PATH_TO_MSC, backend_settings, PATH_TO_MODULES)
        }
        else{
            this.app_status["turn-on-backend"] = false
            EvLogger.log("DEBUG", "Not starting Backend because flag backend_init is false")
        }
        this.backup_worker = new Worker(PATH_TO_BACKUP)
        
        //backup saving frequency
        if (this.app_settings["saving_frequency"].includes("min")){
            this.backupdb_saving_frequency = parseInt(this.app_settings["saving_frequency"].charAt(0)) * 60 * 1000
        }
        else if (this.app_settings["saving_frequency"].includes("hour")){
            this.backupdb_saving_frequency = parseInt(this.app_settings["saving_frequency"].charAt(0)) * 3600 * 1000
        }
        else if (this.app_settings["saving_frequency"].includes("never")){
            this.app_status["backup-db-on"] = false
            //by default set to 5 mins
            this.backupdb_saving_frequency = 5 * 60 * 1000
        }

        EvLogger.log("DEBUG", `BackupDB saving frequency is set to ${this.backupdb_saving_frequency / 1000} seconds`)

        // load all modules
        this.loader.send_progress("Loading SEDAS modules")
        // TODO: load all modules using MSC :)

        // setup plugin register
        this.plugin_register = new PluginRegister(PATH_TO_PLUGINS)

        /*
            Loader segment 10
        */
        this.loader.send_progress("Loading local plugins")

        EvLogger.log("DEBUG", "Loading local plugins")
    }

    public init_gui(){
        /*
            Loader segment 9
        */
        this.loader.send_progress("Initializing GUI")

        EvLogger.log("DEBUG", "Get display coords info for better window positioning")
        
        //calculate x, y
        let coords = utils.get_window_info(app_settings, this.displays, -1, "normal", main_menu_dict)[0]

        //delete loaders
        this.loader.destroy_loaders()
        this.loader = undefined

        EvLogger.log("DEBUG", "main-menu show")
        this.mainMenuWindow = new Window(this.app_status, this.dev_panel, main_menu_dict, PATH_TO_MAIN_HTML, coords, EvLogger, main_app)
        this.wrapper.register_window(this.mainMenuWindow, "main-menu")
        this.mainMenuWindow.show()
    }

    public async main_app(backup_db: object = undefined){
        this.mainMenuWindow.close()
        this.wrapper.unregister_window(this.mainMenuWindow.window_id)

        this.workers = []

        // reading monitor geometry configuration
        let geometry_config: JsonData = utils.readJSON(PATH_TO_MONITOR_CONFIGURATION)
        let python_monitor_config: PyMonitor_object[] = geometry_config["configuration"]
        let environment_config: JsonData = geometry_config["env_configuration"]
        let monitor_config: ElMonitor_object[] = screen.getAllDisplays().map(display => display.bounds)

        // spawning worker & controller windows
        this.monitor_configuration = utils.align_windows(python_monitor_config,
            monitor_config,
            environment_config,
            app_settings["controller_loc"], 
            this, 
            EvLogger)
        
        //setting all windows to show()
        for (let i = 0; i < this.workers.length; i++){
            this.workers[i]["win"].show()
            this.workers[i]["win"].checkClose()
        }

        this.controllerWindow.show()

        // other modules (backup, backend) check
        if (this.app_status["turn-on-backend"]){
            //setup voice recognition and ACAI backend
            this.msc_wrapper.send_message("action", "debug", app_settings["logging"])
        }

        if (backup_db){
            //set scale of map
            this.scale = utils.parse_scale(backup_db["map"]["scale"])

            this.map_name = backup_db["map-name"]
        }

        //run local plane DB
        this.PlaneDatabase = new PlaneDB(this.workers);
        if (backup_db){
            //run if backup db is avaliable
            this.app_status["redir-to-main"] = true

            for (let i = 0; i < backup_db["planes"].length; i++){
                //get monitor-type spawn
                let monit_type: string;
                for (let i2 = 0; i2 < backup_db["monitor-planes"].length; i2++){
                    if (backup_db["monitor-planes"][i2]["planes_id"].includes(backup_db["planes"][i2]["id"])){
                        monit_type = backup_db["monitor-planes"][i2]["type"]
                        break
                    }
                }

                let curr_plane_id = utils.generate_hash()
                let plane = new Plane(curr_plane_id, backup_db["planes"][i]["callsign"], 
                        backup_db["planes"][i]["heading"], backup_db["planes"][i]["updated_heading"],
                        backup_db["planes"][i]["level"], backup_db["planes"][i]["updated_level"],
                        backup_db["planes"][i]["speed"], backup_db["planes"][i]["updated_speed"],
                        backup_db["planes"][i]["departure"], backup_db["planes"][i]["arrival"], 
                        backup_db["planes"][i]["arrival_time"],
                        backup_db["planes"][i]["x"], backup_db["planes"][i]["y"])

                this.PlaneDatabase.add_record(plane, monit_type)
            }

            //send reloaded plane database to all windows
            this.broadcast_planes(this.PlaneDatabase.DB, this.PlaneDatabase.monitor_DB, this.PlaneDatabase.plane_paths_DB)
            //controllerWindow.send_message("init-info", ["window-info", map_name, JSON.stringify(workers), map_config, JSON.stringify(app_settings)])
        }
    }

    public async exit_app(){
        //spawning info window
        let coords = utils.get_window_info(this.app_settings, this.displays, -1, "normal", exit_dict)[0]

        this.exitWindow = new Window(this.app_status, this.dev_panel, exit_dict, PATH_TO_EXIT_HTML, coords, EvLogger, main_app)
        this.exitWindow.show()

        this.app_status["app-running"] = false; //stopping all Interval events from firing

        if (this.enviro != undefined){
            EvLogger.log("DEBUG", "terminating environment")
            this.enviro.kill_enviro()
        }

        if (this.app_status["turn-on-backend"]){
            //disable voice recognition and ACAI backend
            EvLogger.log("DEBUG", "stopping SEDAS modules")
            

            this.msc_wrapper.send_message("module", "ai_backend", "unregister-all")
            await utils.sleep(1000) // TODO: find better way than this
            this.msc_wrapper.send_message("action", "stop")
            await utils.sleep(1000) // TODO: find better way than this

            //stop backend worker
            EvLogger.log("DEBUG", "terminating backend worker")
            this.msc_wrapper.terminate()
        }
        EvLogger.log("DEBUG", "terminating database worker")
        this.backup_worker.terminate()

        EvLogger.log("DEBUG", "exit")
        EvLogger.end()
        app.exit(0)
    }
}

function parse_args(){
    let proc_args: string[] = process.argv
    let args: string[] = []
    if (proc_args[0].includes("electron")) args = proc_args.slice(2) // Development mode
    else args = proc_args.slice(1) // Production

    let processed_args: Record<string, string> = {}
    args.forEach(elem => {
        let name = elem.split("=")[0].substring(2)
        let value = elem.split("=")[1]

        processed_args[name] = value
    })
    
    return processed_args
}

//app predef
var EvLogger: EventLogger;
var main_app: MainApp;

//read app settings
const app_settings = utils.readJSON(PATH_TO_SETTINGS)

//app main code
app.on("ready", async () => {

    // setup app event logger
    await utils.delete_logs()
    EvLogger = new EventLogger(app_settings["logging"], "app_log", "system", "v1.0.0")
    await EvLogger.init_logger()

    // test that C++ addons loaded successfully
    main.test_modules()
    EvLogger.log("DEBUG", "Addons loaded successfully")

    main_app = new MainApp(app_settings, EvLogger)

    //check internet connectivity & run independent updater
    main_app.app_status["internet-connection"] = await utils.run_updater(PATH_TO_INSTALLER, process.env.ABS_PATH)

    await main_app.init_app() //initializing backend for app
    
    main_app.init_gui() //initializing gui for app

    //initializing all listeners for app
    main_app.add_listener_backend()
    main_app.add_listener_IPC()
    main_app.add_listener_intervals()
    main_app.add_listener_backup()
})