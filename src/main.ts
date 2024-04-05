/*
    Main file for SEDAC app
*/

//glob imports
import { app, BrowserWindow, ipcMain, screen, Tray, nativeImage, Menu } from "electron";
import fs from "fs";
import { Worker } from "worker_threads"
import { spawn } from "node:child_process"
import path from "path"

//relative imports
import { Plane, PlaneDB } from "./plane_functions"
import { update_all } from "./fetch"
import { EventLogger } from "./logger"

import * as utils from "./utils"
import * as app_config from "./app_config"

//window variable declarations
var mainMenu: Window;
var settings: Window;
var controllerWindow: Window;
var workerWindow: Window;
var exitWindow: Window;

//paths
const ABS_PATH = path.resolve("")

const PATH_TO_AUDIO_UPDATE: string = path.join(ABS_PATH, "/src/res/neural/get_info.py")
const PATH_TO_MAPS: string = path.join(ABS_PATH, "/src/res/data/sim/maps/")
const PATH_TO_COMMANDS: string = path.join(ABS_PATH, "/src/res/data/sim/commands/")
const PATH_TO_AIRCRAFTS: string = path.join(ABS_PATH, "/src/res/data/sim/planes/")

//app defs

class Window{
    public window: BrowserWindow;
    public win_type: string = "none";
    public isClosed: boolean = false;
    public win_coordinates: number[];
    private path_load: string;

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

    public checkClose(callback: any = undefined){
        this.window.on("closed", () => {
            this.isClosed = true
            if (callback != undefined){
                callback()
            }
        })
    }

    public constructor(app_status: Record<string, boolean>, config: any, path: string, coords: number[], window_type: string = "none"){
        this.win_coordinates = coords //store to use later
        
        config.x = coords[0]
        config.y = coords[1]

        //retype window_type
        this.win_type = window_type

        this.window = new BrowserWindow(config);
        this.window.setMenu(null);
        this.window.webContents.openDevTools()

        this.path_load = path
        this.window.maximize()
        
        if (path.includes("main")){
            this.checkClose(() => {
                if (!app_status["redir-to-main"]){
                    EvLogger.log("DEBUG", ["Closing app... Bye Bye", "got close-app request, saving logs and quitting app..."])
                    main_app.exit_app()
                }
            })
        }

        EvLogger.add_record("DEBUG", `Created window object(win_type=${this.win_type},path_load=${this.path_load}, coords=${coords})`)
    }
}

class MainApp{
    public app_settings: any;
    public displays = [];
    public workers: any = [];
    public sender_win_name: string;

    //all variables related to map
    public map_configs_list: any = [];
    public map_data: any;
    public map_name: string;

    public scale: number;
    public longitude: number = undefined;
    public latitude: number = undefined;
    public zoom: number = undefined;

    //all variables related to aircrafts
    public aircraft_presets_list: any = []
    public aircraft_preset_data: any = undefined;
    public aircraft_preset_name: string = ""

    //all variables related to commands
    public command_presets_list: any = []
    public command_preset_data: any = undefined;
    public command_preset_name: string = ""

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
    public backend_worker: Worker;
    public backup_worker: Worker;
    public PlaneDatabase: PlaneDB;

    public backupdb_saving_frequency: number = 1000; //defaultly set to 1 second

    public constructor(app_settings: any){
        this.app_settings = app_settings
    }

    //
    //Built-in functions
    //
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
                this.workers[i].send_message("update-plane-db", temp_planes)
                //send path data to all workers
                this.workers[i].send_message("update-paths", plane_paths_data)
            }
        }
    }

    //
    // event listener init
    //
    public add_listener_backend(){
        //backend-worker events
        if (app_config["turn-on-backend"]){
            this.backend_worker.on("message", (message: string) => {
                //processing from backend.js
                let arg = message.split(":")[0]
                let content = message.split(":")[1]

                switch(arg){
                    case "command":
                        let command_args = content.split(" ")
                        console.log(command_args)

                        //search plane by callsign
                        for(let i = 0; i < this.PlaneDatabase.DB.length; i++){
                            if (command_args[0] == this.PlaneDatabase.DB[i].callsign){
                                if (command_args[1] == "change-heading"){
                                    this.PlaneDatabase.DB[i].updated_heading = parseInt(command_args[2])
                                }
                                else if (command_args[1] == "change-speed"){
                                    this.PlaneDatabase.DB[i].updated_speed = parseInt(command_args[2])
                                }
                                else if (command_args[1] == "change-level"){
                                    this.PlaneDatabase.DB[i].updated_level = parseInt(command_args[2])
                                }
                            }
                        }
                        break
                    case "debug":
                        //used for debug logging
                        EvLogger.log("DEBUG", [content, content])
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
        ipcMain.handle("message", (event, data) => {
            console.log(data)
            switch(data[1][0]){
                //generic message channels
                case "redirect-to-menu": {
                    this.app_status["redir-to-main"] = false

                    //message call to redirect to main menu
                    EvLogger.add_record("DEBUG", "redirect-to-menu event")

                    settings.close()

                    //calculate x, y
                    let coords = utils.get_window_coords(app_settings, this.displays, -1, app_config.main_menu_dict)

                    EvLogger.add_record("DEBUG", "main-menu show")
                    mainMenu = new Window(this.app_status, app_config.main_menu_dict, "./res/main.html", coords)
                    mainMenu.show()

                    break
                }
                case "save-settings": {
                    //save settings
                    EvLogger.add_record("DEBUG", "saving settings")

                    fs.writeFileSync(path.join(ABS_PATH, "/src/res/data/app/settings.json"), data[1][1])
                    break
                }
                case "redirect-to-settings": {
                    //message call to redirect to settings
                    this.app_status["redir-to-main"] = true

                    EvLogger.add_record("DEBUG", "redirect-to-settings event")

                    mainMenu.close()

                    //calculate x, y
                    let coords = utils.get_window_coords(app_settings, this.displays, -1)

                    EvLogger.add_record("DEBUG", "settings show")
                    settings = new Window(this.app_status, app_config.settings_dict, "./res/settings.html", coords)
                    settings.show()
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
                    EvLogger.log("DEBUG", ["Closing app... Bye Bye", "got window-all-closed request, saving logs and quitting app..."])
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

                        //ACAI backend

                        const speech_config_raw = fs.readFileSync(path.join(ABS_PATH, "/src/res/data/alg/speech_config.json"), "utf-8")
                        const speech_config = JSON.parse(speech_config_raw);

                        const text_config_raw = fs.readFileSync(path.join(ABS_PATH, "/src/res/data/alg/text_config.json"), "utf-8")
                        const text_config = JSON.parse(text_config_raw);

                        const voice_config_raw = fs.readFileSync(path.join(ABS_PATH, "/src/res/data/alg/voice_config.json"), "utf-8")
                        const voice_config = JSON.parse(voice_config_raw);

                        //audio devices

                        const in_devices_raw = fs.readFileSync(path.join(ABS_PATH, "/src/res/data/app/in_device_list.json"), "utf-8")
                        const in_devices = JSON.parse(in_devices_raw)

                        const out_devices_raw = fs.readFileSync(path.join(ABS_PATH, "/src/res/data/app/out_device_list.json"), "utf-8")
                        const out_devices = JSON.parse(out_devices_raw)

                        //sending app data and alg configs
                        settings.send_message("app-data", [app_settings, voice_config, text_config, speech_config, in_devices, out_devices])
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
                                                                    JSON.stringify(app_settings), this.map_name, this.aircraft_presets_list, 
                                                                    this.command_presets_list])
                    }
                    else if (data[0] == "worker"){
                        //send to all workers
                        for (let i = 0; i < this.workers.length; i++){
                            this.workers[i].send_message("init-info", ["window-info", JSON.stringify(app_settings)])
                        }
                    }
                    break
                }
                case "set-environment": {
                    //getting map info, command preset info, aircraft preset info from user
                    let filename_map = data[1][1]
                    let filename_command = data[1][2]
                    let filename_aircraft = data[1][3]

                    //save map data to variable
                    this.map_data = utils.read_file_content(PATH_TO_MAPS, filename_map)
                    //read scale
                    this.scale = utils.parse_scale(this.map_data["scale"])
                    //save map name for backup usage
                    let map_config_raw = fs.readFileSync(PATH_TO_MAPS + this.map_data["CONFIG"], "utf-8")
                    this.map_name = JSON.parse(map_config_raw)["AIRPORT_NAME"];

                    this.command_preset_data = utils.read_file_content(PATH_TO_COMMANDS, filename_command)
                    this.command_preset_name = this.command_preset_data["info"]["name"]

                    this.aircraft_preset_data = utils.read_file_content(PATH_TO_AIRCRAFTS, filename_aircraft)
                    this.aircraft_preset_name = this.command_preset_data["info"]["name"]

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

                    for (let i = 0; i < this.workers.length; i++){
                        this.workers[i].send_message("ask-for-render") //send workers command to fire "render-map" event
                    }
                    break
                }
                case "render-map": {
                    //rendering map data for user (invoked from worker)
                    for (let i = 0; i < this.workers.length; i++){
                        this.workers[i].send_message("map-data", [this.map_data, this.workers[i].win_type])
                    }

                    for (let i = 0; i < this.workers.length; i++){
                        if (this.workers[i]["win_type"] == "weather"){
                            this.workers[i].send_message("geo-data", [this.latitude, this.longitude, this.zoom])
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
                        EvLogger.add_record("WARN", "user did not check any map")
                        controllerWindow.send_message("map-checked", JSON.stringify({"user-check": false}))
                    }
                    else {
                        EvLogger.add_record("DEBUG", "user checked a map")
                        controllerWindow.send_message("map-checked", JSON.stringify({"user-check": true}))
                    }
                    break
                }
                case "monitor-change-info": {
                    //whenever controller decides to change monitor type
                    let mon_data = data[1][1]
                    for (let i = 0; i < this.workers.length; i++){
                        if (this.workers[i].win_type != mon_data[i]["type"]){
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

                            this.workers[i].win_type = mon_data[i]["type"]
                            this.workers[i].show(path_to_render)


                        }
                        //change worker data in monitor_data DB
                        this.PlaneDatabase.update_worker_data(this.workers)
                    }
                    break
                }
                case "send-location-data": {
                    for (let i = 0; i < this.workers.length; i++){
                        if (this.workers[i]["win_type"] == "weather"){
                            this.workers[i].send_message("geo-data", [this.latitude, this.longitude, this.zoom])
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
                    for (let i = 0; i < this.PlaneDatabase.DB.length; i++){
                        if(this.PlaneDatabase.DB[i].id == data[1][3]){
                            switch(data[1][1]){
                                case "item0":
                                    //heading change
                                    this.PlaneDatabase.DB[i].updated_heading = data[1][2]
                                    break
                                case "item1":
                                    //level change
                                    this.PlaneDatabase.DB[i].updated_level = data[1][2]
                                    break
                                case "item2":
                                    //speed change
                                    this.PlaneDatabase.DB[i].updated_speed = data[1][2]
                                    break

                                //TODO: do more generally for more variables
                            }
                        }
                    }
                    
                    this.send_to_all(this.PlaneDatabase.DB, this.PlaneDatabase.monitor_DB, this.PlaneDatabase.plane_paths_DB)
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
                        if (this.workers[i].win_type.includes(data[0])){
                            this.workers[i].send_message("update-plane-db", this.PlaneDatabase.DB)
                        }
                    }
                    break
                }
                case "stop-sim": {
                    this.app_status["sim-running"] = false

                    //send stop event to all workers
                    for (let i = 0; i < this.workers.length; i++){
                        this.workers[i].send_message("sim-event", "stopsim")
                    }
                    controllerWindow.send_message("sim-event", "stopsim")
                    break
                }
                case "start-sim": {
                    this.app_status["sim-running"] = true

                    //send stop event to all workers
                    for (let i = 0; i < this.workers.length; i++){
                        this.workers[i].send_message("sim-event", "startsim")
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
                this.workers[idx].send_message("message-redirect", data[1][0])
                this.sender_win_name = "controller"
            }
        })
    }

    public add_listener_intervals(){
        //update all planes on one second
        setInterval(() => {
            if (this.PlaneDatabase != undefined && this.map_data != undefined){
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

        setInterval(() => {
            if (this.app_status["app-running"] && this.app_status["turn-on-backend"]){
                //sending plane status every 500ms for backend
                if (this.PlaneDatabase == undefined){
                    this.backend_worker.postMessage(["data", []]) //send empty array so the backend can still function without any problems
                }
                else{
                    this.backend_worker.postMessage(["data", this.PlaneDatabase.DB])
                }
            }
        }, 1000)

        //on every n minutes, save to local DB if app crashes
        setInterval(() => {
            if (this.app_status["app-running"]){
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
                    EvLogger.log("DEBUG", ["Saving temporary backup...", "Saving temporary backup using database.ts"])
                }
            }
        }, this.backupdb_saving_frequency)
    }

    //
    //App phase functions (init/main/exit)
    //
    public async init_app(){

        //read JSON
        const app_settings_raw = fs.readFileSync(path.join(ABS_PATH, "/src/res/data/app/settings.json"), "utf-8")
        this.app_settings = JSON.parse(app_settings_raw);

        EvLogger.add_record("DEBUG", "APP-INIT")

        //check internet connectivity
        this.app_status["internet-connection"] = Boolean(await utils.checkInternet(EvLogger))

        if (this.app_status["internet-connection"]){
            await update_all(EvLogger)
        }

        //workers
        if (this.app_settings["backend_init"]){
            this.backend_worker = new Worker(path.join(ABS_PATH, "/src/backend.js"))
            EvLogger.log("DEBUG", ["Starting BackendWorker because flag backend_init=true", "Starting Backend because flag backend_init is=true"])

            var backend_settings = {
                "noise": this.app_settings["noise"]
            }
            this.backend_worker.postMessage(["action", "settings", JSON.stringify(backend_settings)])
        }
        else{
            this.app_status["turn-on-backend"] = false
            EvLogger.log("DEBUG", ["Not starting BackendWorker because backend_init is set to false", "Starting Backend because backend_init is set to false"])
        }
        this.backup_worker = new Worker(path.join(ABS_PATH, "/src/database.js"))

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

        EvLogger.add_record("DEBUG", `BackupDB saving frequency is set to ${this.backupdb_saving_frequency / 1000} seconds`)
    }

    public init_gui(){
        EvLogger.add_record("DEBUG", "Get display coords info for better window positioning")
        //get screen info
        var displays_info: any = screen.getAllDisplays()
        var displays_mod = []
        for(let i: number = 0; i < displays_info.length; i++){
            displays_mod.push(displays_info[i].bounds)
        }
        displays_mod.sort((a, b) => a.x - b.x);
        this.displays = displays_mod
        
        //calculate x, y
        let [x, y] = utils.get_window_coords(app_settings, this.displays, -1, app_config.main_menu_dict)

        EvLogger.add_record("DEBUG", "main-menu show")
        mainMenu = new Window(this.app_status, app_config.main_menu_dict, "./res/main.html", [x, y])
        mainMenu.show()
    }

    public async main_app(backup_db: any = undefined){
        mainMenu.close()

        //calculate x, y
        //leftmost or rightmost tactic
        for(let i = 0; i < this.displays.length; i++){
            let coords = utils.get_window_coords(this.app_settings, this.displays, i)
            //stop sequence (display limit reached)
            if (coords[0] == -2){
                break
            }
            if (coords[0] == -3){
                continue
            }
            
            EvLogger.add_record("DEBUG", "worker show")
            if (backup_db){
                //backup was created, reload workers
                workerWindow = new Window(this.app_status, app_config.worker_dict, backup_db["monitor-data"][i]["path_load"], backup_db["monitor-data"][i]["win_coordinates"], backup_db["monitor-data"][i]["win_type"])
                workerWindow.isClosed = backup_db["monitor-planes"][i]["isClosed"]
            }
            else{
                //backup was not created, create new workers
                workerWindow = new Window(this.app_status, app_config.worker_dict, "./res/worker.html", coords, "ACC")
            }
            
            this.workers.push(workerWindow)
        }

        let coords = utils.get_window_coords(this.app_settings, this.displays, -1)

        EvLogger.add_record("DEBUG", "controller show")
        controllerWindow = new Window(this.app_status, app_config.controller_dict, "./res/controller_set.html", coords, "controller")
        controllerWindow.checkClose(() => {
            if (this.app_status["app-running"]){
                //app is running => close by tray button
                this.exit_app()
            }
        })
        
        for (let i = 0; i < this.workers.length; i++){
            this.workers[i].show()
            this.workers[i].checkClose()
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
        let coords = utils.get_window_coords(this.app_settings, this.displays, -1, app_config.exit_dict)
        exitWindow = new Window(this.app_status, app_config.exit_dict, "./res/exit.html", coords)
        exitWindow.show()

        this.app_status["app-running"] = false; //stopping all Interval events from firing

        if (this.app_status["turn-on-backend"]){
            //disable voice recognition and ACAI backend
            EvLogger.add_record("DEBUG", "stopping voice-recognition")
            this.backend_worker.postMessage(["action", "stop-neural"])

            await utils.sleep(1000) //TODO: do much better way

            //kill voice recognition
            EvLogger.add_record("DEBUG", "killing core.py")
            this.backend_worker.postMessage(["action", "interrupt"])

            await utils.sleep(1000) //TODO: do much better way

            //stop backend worker
            EvLogger.add_record("DEBUG", "terminating backend worker")
            this.backend_worker.terminate()
        }
        EvLogger.add_record("DEBUG", "terminating database worker")
        this.backup_worker.terminate()

        EvLogger.add_record("DEBUG", "exit")
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
    EvLogger = new EventLogger(app_settings["logging"])
    main_app = new MainApp(app_settings)
    await main_app.init_app() //initializing backend for app

    //update audio devices
    EvLogger.log("DEBUG", ["Updating audio devices...", "Updating audio device list using get_info.py"])
    const update_devices = spawn("python3", [PATH_TO_AUDIO_UPDATE])
    //TODO: add fallback logger to update_devices subprocess
    
    main_app.init_gui() //initializing gui for app

    //initializing all listeners for app
    main_app.add_listener_backend()
    main_app.add_listener_IPC()
    main_app.add_listener_intervals()
    main_app.add_listener_backup()
})