/*
    Main file for SEDAC app
*/

//glob imports
import fs from "fs";
import { Worker } from "worker_threads"
import { spawn } from "node:child_process"
import path from "path"
import { app, ipcMain, screen, Tray, nativeImage, Menu } from "electron";

//relative imports
import { Plane, PlaneDB } from "./plane_functions"
import { update_models, update_plugins } from "./fetch"
import { EventLogger } from "./logger"

import * as utils from "./utils"
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
    PATH_TO_WORKER_HTML,
    PATH_TO_POPUP_HTML,

    ABS_PATH,
    PATH_TO_AUDIO_UPDATE,
    PATH_TO_MAPS,
    PATH_TO_COMMANDS,
    PATH_TO_AIRCRAFTS,

    PATH_TO_SPEECH_CONFIG,
    PATH_TO_TEXT_CONFIG,
    PATH_TO_VOICE_CONFIG,

    PATH_TO_IN_DEVICES,
    PATH_TO_OUT_DEVICES,

    PATH_TO_SETTINGS_LAYOUT

} from "./app_config"
import {
    Environment
} from "./environment"

//C++ (N-API) imports
import { main } from "./bind";

//window variable declarations
var mainMenuWindow: Window;
var settingsWindow: Window;
var controllerWindow: Window;
var workerWindow: Window;
var exitWindow: Window;

class MainApp{
    //all variables that contain "low-level" functionalities of the app
    public app_settings: any;
    private dev_panel: boolean;
    private displays = [];
    private workers: any[] = [];
    private widget_workers: any[] = []
    private enviro: Environment;

    //all variables related to frontend
    private frontend_vars = {
        "controller_mon": {},
        "controller_set": {},
        "controller_sim": {},
        "wiki": {},
        "glob": {} //variables used across windows
    } //used to save variables that are then used on redirect between windows

    //all variables related to environment/map
    private map_configs_list: any = [];
    private map_data: any;
    private map_name: string;
    private enviro_logger: EventLogger;

    private scale: number;
    private longitude: number = undefined;
    private latitude: number = undefined;
    private zoom: number = undefined;

    //all variables related to aircrafts
    private aircraft_presets_list: any = []
    private aircraft_preset_data: any = undefined;
    private aircraft_preset_name: string = ""

    //all variables related to commands
    private command_presets_list: any = []
    private command_preset_data: any = undefined;
    private command_preset_name: string = ""

    //app status (consists of switches/booleans for different functions 
    //  => written in dict for better arg passing to funcs + better readibility
    private app_status: Record<string, boolean> = {
        "internet-connection": false, //switch for internet connectivity and how to handle it in code
        "turn-on-backend": true,      //
        "backup-db-on": true,         //
        "app-running": true,          //
        "sim-running": false,         //
        "redir-to-main": false        //
    }

    //worker files
    public backend_worker: Worker;
    public backup_worker: Worker;
    public PlaneDatabase: PlaneDB;

    //temporary variables
    private selected_plugin_id: string;
    private sender_win_name: string;
    private current_popup_window: PopupWindow; //For now, app only permits one popup window at the time (TODO)

    //other variables
    private loader: utils.ProgressiveLoader
    public backupdb_saving_frequency: number = 1000; //defaultly set to 1 second
    private local_plugin_list: any[]

    public constructor(app_settings: any){
        this.app_settings = app_settings
        this.dev_panel = app_settings["debug_panel"]
    }

    //
    //Built-in functions
    //

    private get_screen_info(){
        //get screen info
        var displays_info: any = screen.getAllDisplays()
        var displays_mod = []
        for(let i: number = 0; i < displays_info.length; i++){
            displays_mod.push(displays_info[i].bounds)
        }
        displays_mod.sort((a, b) => a.x - b.x);
        this.displays = displays_mod
    }

    private send_to_all(planes: any, plane_monitor_data: any, plane_paths_data: any){
        if (controllerWindow != undefined && this.workers.length != 0){
            //update planes on controller window
            controllerWindow.send_message("update-plane-db", planes)
    
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
            this.backend_worker.on("message", (message: string) => {
                //processing from backend.js
                let arg = message.split(":")[0]
                let content = message.split(":")[1]

                switch(arg){
                    case "command":
                        let command_args = content.split(" ")

                        //TODO: add args to set command
                        this.PlaneDatabase.set_command(command_args[0], command_args[1], parseInt(command_args[2]))
                        break
                    case "debug":
                        //used for debug logging
                        EvLogger.log("DEBUG", content)
                        break
                }
            })
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
        ipcMain.handle("message", async (event, data) => {
            switch(data[1][0]){
                //generic message channels
                case "redirect-to-menu": {
                    this.app_status["redir-to-main"] = false

                    //message call to redirect to main menu
                    EvLogger.log("DEBUG", "redirect-to-menu event")
                    
                    if (data[0] == "settings"){
                        settingsWindow.close()
                    }
                    else if (data[0] == "controller"){
                        controllerWindow.close()
                        for (let i = 0; i < this.workers.length; i++){
                            this.workers[i]["win"].close()
                        }

                        for (let i = 0; i < this.widget_workers.length; i++){
                            this.widget_workers[i]["win"].close()
                        }
                        this.widget_workers = []
                    }

                    //calculate x, y
                    let win_info = utils.get_window_info(app_settings, this.displays, -1, "normal", main_menu_dict)
                    let coords = win_info.slice(0, 2)

                    EvLogger.log("DEBUG", "main-menu show")
                    mainMenuWindow = new Window(this.app_status, this.dev_panel, main_menu_dict, 
                        PATH_TO_MAIN_HTML, coords, EvLogger, main_app)
                    mainMenuWindow.show()
                    
                    this.workers = []
                    this.widget_workers = []
                    controllerWindow = undefined
                    this.PlaneDatabase = undefined
                    break
                }
                case "save-settings": {
                    //save settings
                    EvLogger.log("DEBUG", "saving settings")

                    fs.writeFileSync(path.join(ABS_PATH, "/src/res/data/app/settings.json"), data[1][1])
                    break
                }
                case "redirect-to-settings": {
                    //message call to redirect to settings
                    this.app_status["redir-to-main"] = true

                    EvLogger.log("DEBUG", "redirect-to-settings event")

                    mainMenuWindow.close()

                    //calculate x, y
                    let win_info = utils.get_window_info(app_settings, this.displays, -1, "normal")
                    let coords = win_info.slice(0, 2)
                    let display_info = win_info.slice(2, 4)

                    EvLogger.log("DEBUG", "settings show")
                    settingsWindow = new Window(this.app_status, this.dev_panel, settings_dict, PATH_TO_SETTINGS_HTML, coords, EvLogger, main_app, "settings", display_info)
                    settingsWindow.show()
                    break
                }
                case "redirect-to-main": {
                    //message call to redirect to main program (start)
                    this.app_status["redir-to-main"] = true
                    if (this.app_status["turn-on-backend"]){
                        this.backend_worker.postMessage(["action", "start-neural"])
                    }
                    this.main_app()
                    break
                }
                case "exit": {
                    //spawning info window
                    EvLogger.log("DEBUG", "Closing app... Bye Bye")
                    this.exit_app()
                }
                case "invoke": {
                    //TODO: find out why I have this written here
                    if (this.app_status["turn-on-backend"]){
                        this.backend_worker.postMessage(data[1][1])
                    }
                    break
                }
                //info retrival to Controller
                case "send-info": {
                    //this part of function is utilised both for controller window and settings window
                    //|settings window| uses this to acquire saved .json settings
                    //|controller window| uses this to acquire current worker/window data
                    
                    if (data[0] == "settings"){

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
                        settingsWindow.send_message("app-data", [app_settings, voice_config, text_config, speech_config, in_devices, out_devices, settings_layout])
                    }
                    else if (data[0] == "controller"){
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
                        controllerWindow.send_message("init-info", ["window-info", JSON.stringify(this.workers), this.map_configs_list, 
                                                                    JSON.stringify(app_settings), [this.map_name, this.command_preset_name, this.aircraft_preset_name], this.aircraft_presets_list, 
                                                                    this.command_presets_list, this.frontend_vars, this.app_status])
                    }
                    else if (data[0] == "worker"){
                        //send to all workers
                        for (let i = 0; i < this.workers.length; i++){
                            this.workers[i]["win"].send_message("init-info", ["window-info", JSON.stringify(app_settings)])
                        }
                    }
                    break
                }
                case "send-scenario-list": {
                    let selected_map_data = utils.read_file_content(PATH_TO_MAPS, data[1][1])
                    let scenarios = selected_map_data["scenarios"]
                    controllerWindow.send_message("scenario-list", scenarios)
                    break
                }
                case "set-environment": {
                    //getting map info, command preset info, aircraft preset info from user
                    let filename_map = data[1][1]
                    let filename_command = data[1][2]
                    let filename_aircraft = data[1][3]

                    /*
                        Reading all info for map setup
                    */

                    //save map data to variable
                    this.map_data = utils.read_file_content(PATH_TO_MAPS, filename_map)
            
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

                    EvLogger.log("DEBUG", `Selected presets: ${[this.map_name, this.command_preset_name, this.aircraft_preset_name]}`)
                    
                    /*
                        Setting up environment
                    */
                    this.loader = new utils.ProgressiveLoader(app_settings, this.displays, load_dict, EvLogger)
                    this.loader.setup_loader(5, "Setting up simulation, please wait...", "Initializing simulation setup")
                    
                    this.enviro_logger = new EventLogger(true, "enviro_log", "environment")

                    this.loader.send_progress("Setting up environment")
                    this.enviro = new Environment(EvLogger, ABS_PATH, this.PlaneDatabase,
                        this.command_preset_data, this.aircraft_preset_data, this.map_data)

                    this.enviro.setup_enviro(this.loader)

                    this.loader.destroy_loaders()
                    this.loader = undefined
                    
                    //everything is set up, time to load
                    for (let i = 0; i < this.workers.length; i++){
                        this.workers[i]["win"].send_message("ask-for-render") //send workers command to fire "render-map" event
                    }
                    
                    //rendering widget workers
                    for (let i = 0; i < this.widget_workers.length; i++){
                        this.widget_workers[i]["win"].show()
                        this.widget_workers[i]["win"].wait_for_load(() => {
                            this.widget_workers[i]["win"].send_message("register", ["id", this.widget_workers[i]["id"]])
                        })
                    }

                    break
                }
                case "render-map": {
                    //rendering map data for user (invoked from worker)
                    for (let i = 0; i < this.workers.length; i++){
                        this.workers[i]["win"].send_message("map-data", [this.map_data, this.workers[i]["win"].win_type])
                    }

                    for (let i = 0; i < this.workers.length; i++){
                        if (this.workers[i]["win"]["win_type"] == "weather"){
                            this.workers[i]["win"].send_message("geo-data", [this.latitude, this.longitude, this.zoom])
                        }
                    }
                    break
                }
                case "get-points": {
                    let spec_data: any;
                    if (data[1][1].includes("ACC")){
                        //selected monitor is in ACC mode
                        spec_data = this.map_data["ACC"]
                    }
                    else if (data[1][1].includes("APP")){
                        //selected monitor is in APP mode
                        spec_data = this.map_data["APP"]
                    }
                    else if (data[1][1].includes("TWR")){
                        //selected monitor is in TWR mode
                        spec_data = this.map_data["TWR"]
                    }
                    let out_data = {}
                    for (const [key, value] of Object.entries(spec_data)) {
                        if (key == "POINTS" || key == "ARP" || key == "SID" || key == "STAR" || key == "RUNWAY"){
                            out_data[key] = value
                        }
                    }
                    controllerWindow.send_message("map-points", JSON.stringify(out_data))
                    break
                }
                case "map-check": {
                    if (this.map_data == undefined){
                        EvLogger.log("WARN", "user did not check any map")
                        controllerWindow.send_message("map-checked", JSON.stringify({"user-check": false}))
                    }
                    else {
                        EvLogger.log("DEBUG", "user checked a map")
                        controllerWindow.send_message("map-checked", JSON.stringify({"user-check": true}))
                    }
                    break
                }
                case "monitor-change-info": {
                    //whenever controller decides to change monitor type
                    let mon_data = data[1][1]
                    for (let i = 0; i < this.workers.length; i++){
                        if (this.workers[i]["win"].win_type != mon_data[i]["type"]){
                            //rewrite current window type and render to another one
                            let path_to_render = "";


                            switch(mon_data[i]["type"]){
                                case "ACC":
                                    //rewrite to Area control
                                    path_to_render = "./res/worker.html"
                                    //TODO: add rendering
                                    break
                                case "APP":
                                    //rewrite to Approach control
                                    path_to_render = "./res/worker.html"
                                    //TODO: add rendering
                                    break
                                case "TWR":
                                    //rewrite to tower
                                    path_to_render = "./res/worker.html"
                                    //TODO: add rendering
                                    break
                                case "weather":
                                    //rewrite to weather forecast
                                    path_to_render = "./res/weather.html"
                                    break
                                case "dep_arr":
                                    //rewrite to departure/arrival list
                                    path_to_render = "./res/dep_arr.html"
                                    break
                            }

                            this.workers[i]["win"].win_type = mon_data[i]["type"]
                            this.workers[i]["win"].show(path_to_render)


                        }
                        //change worker data in monitor_data DB
                        this.PlaneDatabase.update_worker_data(this.workers)
                    }
                    break
                }
                case "send-location-data": {
                    for (let i = 0; i < this.workers.length; i++){
                        if (this.workers[i]["win"]["win_type"] == "weather"){
                            this.workers[i]["win"].send_message("geo-data", [this.latitude, this.longitude, this.zoom])
                        }
                    }
                    break
                }
                //plane control
                case "spawn-plane": {
                    let plane_data = data[1][1]

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

                    this.send_to_all(this.PlaneDatabase.DB, this.PlaneDatabase.monitor_DB, this.PlaneDatabase.plane_paths_DB)
                    break
                }
                case "plane-value-change": {
                    console.log(data)
                    //TODO: add args to set command
                    this.PlaneDatabase.set_command(data[1][3], data[1][1], parseInt(data[1][2]))      
                    this.send_to_all(this.PlaneDatabase.DB, this.PlaneDatabase.monitor_DB, this.PlaneDatabase.plane_paths_DB)
                    controllerWindow.send_message("terminal-add", data[1].slice(1))
                    break
                }
                case "plane-delete-record": {
                    this.PlaneDatabase.delete_record(data[1][1])
                    this.send_to_all(this.PlaneDatabase.DB, this.PlaneDatabase.monitor_DB, this.PlaneDatabase.plane_paths_DB)
                    break
                }
                case "send-plane-data": {
                    //send plane data (works for all windows)
                    for (let i = 0; i < this.workers.length; i++){
                        if (this.workers[i]["win"].win_type.includes(data[0])){
                            this.workers[i]["win"].send_message("update-plane-db", this.PlaneDatabase.DB)
                        }
                    }
                    break
                }
                case "stop-sim": {
                    this.app_status["sim-running"] = false

                    //send stop event to all workers
                    for (let i = 0; i < this.workers.length; i++){
                        this.workers[i]["win"].send_message("sim-event", "stopsim")
                    }
                    controllerWindow.send_message("sim-event", "stopsim")
                    break
                }
                case "start-sim": {
                    this.app_status["sim-running"] = true

                    //send stop event to all workers
                    for (let i = 0; i < this.workers.length; i++){
                        this.workers[i]["win"].send_message("sim-event", "startsim")
                    }
                    controllerWindow.send_message("sim-event", "startsim")
                    break
                }
                case "regenerate-map": {
                    if (this.app_status["turn-on-backend"]){
                        this.backend_worker.postMessage(["action", "terrain"])
                    }
                    break
                }
                case "restore-sim": {
                    this.backup_worker.postMessage(["read-db"])
                    break
                }
                //messages from wiki tab
                case "get-path": {
                    console.log(ABS_PATH)
                    break
                }
                case "rewrite-frontend-vars": {
                    this.frontend_vars = data[1][1]
                    console.log(this.frontend_vars)
                    break
                }
                //getting all preset configuration directly from json file
                case "json-description": {
                    if (data[1][2] == "command"){
                        controllerWindow.send_message("description-data", this.command_presets_list[data[1][1]])
                    }
                    else if (data[1][2] == "aircraft"){
                        controllerWindow.send_message("description-data", this.aircraft_presets_list[data[1][1]])
                    }
                    break
                }
                /*Worker widget listeners*/
                case "min-widget": {
                    for (let i = 0; i < this.widget_workers.length; i++){
                        if (this.widget_workers[i]["id"] == data[1][1]){
                            this.widget_workers[i]["win"].minimize()
                        }
                    }
                    break
                }
                case "max-widget": {
                    for (let i = 0; i < this.widget_workers.length; i++){
                        if (this.widget_workers[i]["id"] == data[1][1]){
                            this.widget_workers[i]["win"].maximize()
                        }
                    }
                    break
                }
                case "exit-widget": {
                    for (let i = 0; i < this.widget_workers.length; i++){
                        if (this.widget_workers[i]["id"] == data[1][1]){
                            this.widget_workers[i]["win"].close()
                            this.widget_workers.splice(i, 1)
                        }
                    }
                    break
                }
                //plugin installation
                case "install-plugin": {
                    this.selected_plugin_id = data[1][1]
                    let plugin_name = data[1][2]

                    //create popup window for user confirmation
                    let win_info = utils.get_window_info(app_settings, this.displays, -1, "normal", popup_widget_dict)
                    let coords = win_info.slice(0, 2)
                    this.current_popup_window = new PopupWindow(popup_widget_dict, PATH_TO_POPUP_HTML, coords, 
                                                    EvLogger, `Do you want to install plugin: ${plugin_name}?`)
                    
                    this.current_popup_window.load_popup()
                    break
                }
                case "get-plugin-list": {
                    controllerWindow.send_message("plugin-list", this.local_plugin_list)
                    break
                }
                case "confirm-install": {
                    if (data[1][1]){
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
            }
        })

        //TODO: check if code is actually usable in scenario => for now, its unused
        ipcMain.on("message-redirect", (event, data) => {
            if (data[0] == "controller"){
                console.log("from worker")
                controllerWindow.send_message("message-redirect", data[1][0])
                this.sender_win_name = "worker"
            }
            else if (data[0].includes("worker")){
                console.log("from controller")
                
                let idx = parseInt(data[0].substring(6, 7))
                this.workers[idx]["win"].send_message("message-redirect", data[1][0])
                this.sender_win_name = "controller"
            }
        })
    }

    public add_listener_intervals(){
        //disable intervals on app exit
        try {
            if (this.app_status["app-running"]){
                //update all planes on one second
                setInterval(() => {
                    if (this.PlaneDatabase != undefined && this.map_data != undefined && this.workers.length != 0){
                        if (this.app_status["sim-running"]){
                            this.PlaneDatabase.update_planes(this.scale, app_settings["std_bank_angle"], parseInt(app_settings["standard_pitch_up"]), parseInt(app_settings["standard_pitch_down"]),
                                                    parseInt(app_settings["standard_accel"]), parseInt(app_settings["plane_path_limit"]))
                        }
                        if (this.app_status["app-running"]){
                            //send updated plane database to all
                            this.send_to_all(this.PlaneDatabase.DB, this.PlaneDatabase.monitor_DB, this.PlaneDatabase.plane_paths_DB)
                        }
                    }
                }, 1000)
    
                //send updated time to all workers
                setInterval(() => {
                    if (this.enviro != undefined && this.app_status["sim-running"]){
                        //send date & time to frontend
                        for (let i = 0; i < this.workers.length; i++){
                            this.workers[i]["win"].send_message("time", [this.enviro.current_time])
                        }
                    }
                }, 1000)
    
                //send plane data to backend
                setInterval(() => {
                    if (this.app_status["turn-on-backend"]){
                        if (this.PlaneDatabase == undefined){
                            this.backend_worker.postMessage(["data", []]) //send empty array so the backend can still function without any problems
                        }
                        else{
                            this.backend_worker.postMessage(["data", this.PlaneDatabase.DB])
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

    //
    //App phase functions (init/main/exit)
    //
    public async init_app(){
        this.get_screen_info() //getting screen info for all displays

        //set progressive loader object on loaders
        this.loader = new utils.ProgressiveLoader(app_settings, this.displays, load_dict, EvLogger)
        this.loader.setup_loader(10, "SEDAS is loading, please wait...", "Initializing app")

        /*
            Loader segment 1
        */
        this.loader.send_progress("Reading app configuration")

        //read JSON
        const app_settings_raw = fs.readFileSync(path.join(ABS_PATH, "/src/res/data/app/settings.json"), "utf-8")
        this.app_settings = JSON.parse(app_settings_raw);

        EvLogger.log("DEBUG", "APP-INIT")

        /*
            Loader segment 2
        */
        this.loader.send_progress("Checking internet connectivity")

        //check internet connectivity
        this.app_status["internet-connection"] = Boolean(await utils.checkInternet(EvLogger))

        if (this.app_status["internet-connection"] && this.app_settings["fetch_alg"]){
            await update_models(EvLogger, this.loader)
        }

        /*
            Loader segment 7 (rest of segments are in update_all)
        */
        this.loader.send_progress("Setting all backend processes")

        //workers
        if (this.app_settings["backend_init"]){
            this.backend_worker = new Worker(path.join(ABS_PATH, "/src/backend.js"))
            EvLogger.log("DEBUG", "Starting Backend because flag backend_init is=true")

            var backend_settings = {
                "noise": this.app_settings["noise"]
            }
            this.backend_worker.postMessage(["action", "settings", JSON.stringify(backend_settings)])
        }
        else{
            this.app_status["turn-on-backend"] = false
            EvLogger.log("DEBUG", "Starting Backend because backend_init is set to false")
        }
        this.backup_worker = new Worker(path.join(ABS_PATH, "/src/database.js"))
        
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
        
        /*
            Loader segment 8
        */
        this.loader.send_progress("Updating audio devices")

        //update audio devices
        EvLogger.log("DEBUG", "Updating audio device list using get_info.py")
        const update_devices = spawn("python3", [PATH_TO_AUDIO_UPDATE])
        //TODO: add fallback logger to update_devices subprocess

        /*
            Loader segment 9
        */
        this.loader.send_progress("Fetching new plugin list")

        EvLogger.log("DEBUG", "Fetching new plugin list")
        this.local_plugin_list = update_plugins()
    }

    public init_gui(){
        /*
            Loader segment 9
        */
        this.loader.send_progress("Initializing GUI")

        EvLogger.log("DEBUG", "Get display coords info for better window positioning")
        
        //calculate x, y
        let win_info = utils.get_window_info(app_settings, this.displays, -1, "normal", main_menu_dict)
        let coords = win_info.slice(0, 2)

        //delete loaders
        this.loader.destroy_loaders()
        this.loader = undefined

        EvLogger.log("DEBUG", "main-menu show")
        mainMenuWindow = new Window(this.app_status, this.dev_panel, main_menu_dict, PATH_TO_MAIN_HTML, coords, EvLogger, main_app)
        mainMenuWindow.show()
    }

    public async main_app(backup_db: any = undefined){
        mainMenuWindow.close()
        this.workers = []

        //calculate x, y
        //leftmost or rightmost tactic
        //spawning worker windows
        for(let i = 0; i < this.displays.length; i++){
            let win_info = utils.get_window_info(this.app_settings, this.displays, i, "normal")
            let coords = win_info.slice(0, 2)
            let display_info = win_info.slice(2, 4)
            
            //stop sequence (display limit reached)
            if (coords[0] == -2){
                break
            }
            if (coords[0] == -3){
                continue
            }
            
            EvLogger.log("DEBUG", "worker show")
            if (backup_db){
                //backup was created, reload workers
                workerWindow = new Window(this.app_status, this.dev_panel, worker_dict, backup_db["monitor-data"][i]["path_load"], backup_db["monitor-data"][i]["win_coordinates"], backup_db["monitor-data"][i]["win_type"], display_info)
                workerWindow.isClosed = backup_db["monitor-planes"][i]["isClosed"]
            }
            else{
                //backup was not created, create new workers
                workerWindow = new Window(this.app_status, this.dev_panel, worker_dict, PATH_TO_WORKER_HTML, coords, EvLogger, main_app, "ACC", display_info)
            }
        
            //setting up all layer widgets (overlaying whole map)
            //utils.create_widget_window(basic_worker_widget_dict, "./res/html/widget/worker_widget.html", EvLogger, coords, this.widget_workers)

            let worker_id = utils.generate_id()
            this.workers.push({
                "id": worker_id,
                "win": workerWindow
            })
        }

        //spawning controller window
        let win_info = utils.get_window_info(this.app_settings, this.displays, -1, "normal")
        let coords = win_info.slice(0, 2)
        let display_info = win_info.slice(2, 4)

        EvLogger.log("DEBUG", "controller show")
        controllerWindow = new Window(this.app_status, this.dev_panel, controller_dict, PATH_TO_CONTROLLER_HTML, coords, EvLogger, main_app, "controller", display_info)
        controllerWindow.checkClose(() => {
            if (this.app_status["app-running"] && this.app_status["redir-to-main"]){
                //app is running and is redirected to main => close by tray button
                this.exit_app()
            }
        })
        
        //setting up workers
        for (let i = 0; i < this.workers.length; i++){
            this.workers[i]["win"].show()
            this.workers[i]["win"].checkClose()
        }

        controllerWindow.show()

        if (this.app_status["turn-on-backend"]){
            //setup voice recognition and ACAI backend
            this.backend_worker.postMessage(["debug", app_settings["logging"]]) 
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
            this.send_to_all(this.PlaneDatabase.DB, this.PlaneDatabase.monitor_DB, this.PlaneDatabase.plane_paths_DB)
            //controllerWindow.send_message("init-info", ["window-info", map_name, JSON.stringify(workers), map_config, JSON.stringify(app_settings)])
        }
    }

    public async exit_app(){
        //spawning info window
        let win_info = utils.get_window_info(this.app_settings, this.displays, -1, "normal", exit_dict)
        let coords = win_info.slice(0, 2)

        exitWindow = new Window(this.app_status, this.dev_panel, exit_dict, PATH_TO_EXIT_HTML, coords, EvLogger, main_app)
        exitWindow.show()

        this.app_status["app-running"] = false; //stopping all Interval events from firing
        
        if (this.enviro != undefined){
            EvLogger.log("DEBUG", "terminating environment")
            this.enviro.kill_enviro()
        }

        if (this.app_status["turn-on-backend"]){
            //disable voice recognition and ACAI backend
            EvLogger.log("DEBUG", "stopping voice-recognition")
            this.backend_worker.postMessage(["action", "stop-neural"])

            await utils.sleep(1000) //TODO: do much better way

            //kill voice recognition
            EvLogger.log("DEBUG", "killing core.py")
            this.backend_worker.postMessage(["action", "interrupt"])

            await utils.sleep(1000) //TODO: do much better way

            //stop backend worker
            EvLogger.log("DEBUG", "terminating backend worker")
            this.backend_worker.terminate()
        }
        EvLogger.log("DEBUG", "terminating database worker")
        this.backup_worker.terminate()

        EvLogger.log("DEBUG", "exit")
        app.exit(0)
    }
}

//app predef
var EvLogger: EventLogger;
var main_app: MainApp;

//read JSON
const app_settings_raw = fs.readFileSync(path.join(ABS_PATH, "/src/res/data/app/settings.json"), "utf-8")
const app_settings = JSON.parse(app_settings_raw);

//app main code
app.on("ready", async () => {
    //setup app event logger
    utils.delete_logs()
    EvLogger = new EventLogger(app_settings["logging"], "app_log", "system", "v1.0.0")

    main_app = new MainApp(app_settings)

    await main_app.init_app() //initializing backend for app
    
    main_app.init_gui() //initializing gui for app

    //initializing all listeners for app
    main_app.add_listener_backend()
    main_app.add_listener_IPC()
    main_app.add_listener_intervals()
    main_app.add_listener_backup()
})