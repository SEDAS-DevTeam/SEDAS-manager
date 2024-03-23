//system imports
import {app, BrowserWindow, ipcMain, screen, Tray, nativeImage, Menu} from "electron";
import fs from "fs";
import {Worker} from "worker_threads"
import {spawn} from "node:child_process"
import path from "path"
import http from "http"
import * as read_map from "./read_map"
import { Plane, PlaneDB, generate_plane_hash } from "./plane_functions";
import { update_all } from "./fetch";
import {EventLogger} from "./logger"

//window variable declarations
var mainMenu: Window;
var settings: Window;
var controllerWindow: Window;
var workerWindow: Window;
var exitWindow: Window;

//other declarations
var sender_win_name: string = "";
var displays = [];
var workers = [];
var curr_plane_id: string = "";
var PlaneDatabase: any;
var backupdb_saving_frequency: number = 0;
var backup_db_on: boolean = true
var scale: number = 0;
var running: boolean = false
var coords = [0, 0]
var map_name: string = ""
var app_running: boolean = true
var redir_to_main: boolean = false
var EvLogger: EventLogger;
var app_settings: any;
var worker: Worker;
var database_worker: Worker;
var turn_on_backend: boolean = true;

//map variables
var longitude: any;
var latitude: any;
var zoom: any;
var map_config = [];
var map_data: any = undefined;

//simulation-based declarations
var simulation_dict = {
    "planes": null,
    "monitor-planes": null,
    "map": null,
    "map-name": "",
    "monitor-data": null
} //this dictionary is used for saving all necessary simulation data to database (used for recovery)

/*
APP INIT 1
*/
process.env['ELECTRON_DISABLE_SECURITY_WARNINGS'] = 'true';

const ABS_PATH = path.resolve("")
const PATH_TO_AUDIO_UPDATE: string = path.join(ABS_PATH, "/src/res/neural/get_info.py")
const PATH_TO_MAPS: string = path.join(ABS_PATH, "/src/res/maps/")

//read JSON
const app_settings_raw = fs.readFileSync(path.join(ABS_PATH, "/src/res/data/settings.json"), "utf-8")
app_settings = JSON.parse(app_settings_raw);

//initialize EventLogger (first initialization to log other ones)
EvLogger = new EventLogger(app_settings["logging"]);
EvLogger.add_record("DEBUG", "APP-INIT 1")

//check internet connectivity
EvLogger.log("DEBUG", ["Internet connectivity check...", "Performing HTTP GET on google servers for internet check"])
http.get("http://www.google.com", async (res) => {
    EvLogger.add_record("DEBUG", "Lookup successful, fetching algorithm files...")
    //fetch all python backend files
    await update_all(EvLogger)
    sleep(1000)
}).on("error", (err) => {
    EvLogger.add_record("ERROR", "Lookup unsuccessful")
    EvLogger.add_record("ERROR", err.message)
})

//workers
if (app_settings["backend_init"]){
    worker = new Worker(path.join(ABS_PATH, "/src/backend.js"))
    EvLogger.log("DEBUG", ["Starting BackendWorker because flag backend_init=true", "Starting Backend because flag backend_init is=true"])

    var backend_settings = {
        "noise": app_settings["noise"]
    }
    worker.postMessage(["action", "settings", JSON.stringify(backend_settings)])
}
else{
    turn_on_backend = false
    EvLogger.log("DEBUG", ["Not starting BackendWorker because flag backend_init=false", "Starting Backend because flag backend_init=false"])
}
database_worker = new Worker(path.join(ABS_PATH, "/src/database.js"))
EvLogger.log("DEBUG", ["Initialized BackupDB", "Initialized Sqlite3 database for backup"])

if (app_settings["saving_frequency"].includes("min")){
    backupdb_saving_frequency = parseInt(app_settings["saving_frequency"].charAt(0)) * 60 * 1000
}
else if (app_settings["saving_frequency"].includes("hour")){
    backupdb_saving_frequency = parseInt(app_settings["saving_frequency"].charAt(0)) * 3600 * 1000
}
else if (app_settings["saving_frequency"].includes("never")){
    backup_db_on = false
    //by default set to 5 mins
    backupdb_saving_frequency = 5 * 60 * 1000
}

EvLogger.add_record("DEBUG", `BackupDB saving frequency is set to ${backupdb_saving_frequency / 1000} seconds`)

const main_menu_dict = {
    width: 800,
    height: 600,
    title: "SEDAC manager",
    resizable: false,
    icon: "./res/img/sedac-manager-logo.png",
    webPreferences: {
        preload: path.join(__dirname, "res/scripts/preload.js")
    }
}

const settings_dict = {
    width: 1920,
    height: 1080,
    title: "SEDAC manager - settings",
    resizable: true,
    icon: "./res/img/sedac-manager-logo.png",
    webPreferences: {
        preload: path.join(__dirname, "res/scripts/preload.js")
    }
}

const exit_dict = {
    width: 500,
    height: 300,
    title: "SEDAC manager - exit tray",
    resizable: false,
    icon: "./res/img/sedac-manager-logo.png",
    frame: false,
    webPreferences: {
        preload: path.join(__dirname, "res/scripts/preload.js")
    }
}

const controller_dict = {
    width: 1920,
    height: 1080,
    title: "SEDAC manager - control",
    resizable: true,
    icon: "./res/img/sedac-manager-logo.png",
    frame: true,
    //focusable: true,
    webPreferences: {
        preload: path.join(__dirname, "res/scripts/preload.js")
    }
}

const worker_dict = {
    width: 1920,
    height: 1080,
    title: "SEDAC",
    resizable: false,
    icon: "./res/img/sedac-manager-logo.png",
    //frame: false,
    //focusable: false,
    webPreferences: {
        preload: path.join(__dirname, "res/scripts/preload.js")
    }
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function get_window_coords(idx: number, window_dict: any = undefined){
    let x: number
    let y: number

    let last_display: any;

    if (app_settings["alignment"] == "free"){
        x = undefined
        y = undefined
        return [x, y]
    }

    if (displays.length == 1){
        x = displays[0].x
        y = displays[0].y

        last_display = displays[0]

        if (window_dict){
            x = x + (last_display.width / 2) - (window_dict.width / 2)
            y = y + (last_display.height / 2) - (window_dict.height / 2)
        }
        return [x, y]
    }

    if (idx == -1){
        if (app_settings["controller-loc"] == "leftmost"){
            x = displays[0].x
            y = displays[0].y

            last_display = displays[0]
        }
        else if (app_settings["controller-loc"] == "rightmost"){
            x = displays[displays.length - 1].x
            y = displays[displays.length - 1].y

            last_display = displays[displays.length - 1]
        }
    }
    else{ //idx != -1: other worker windows
        if (app_settings["controller-loc"] == "leftmost"){
            if (displays.length == idx + 1){
                return [-2, -2]
            }

            x = displays[idx + 1].x
            y = displays[idx + 1].y

            last_display = displays[idx + 1]
        }
        else if (app_settings["controller-loc"] == "rightmost"){
            if (displays.length == idx){
                return [-2, -2] //signalizes "break"
            }
            if(idx == 0){
                return [-3, -3] //signalizes "skip"
            }

            x = displays[idx - 1].x
            y = displays[idx - 1].y

            last_display = displays[idx - 1]
        }
    }
    //align to center on some windows
    if (window_dict){
        x = x + (last_display.width / 2) - (window_dict.width / 2)
        y = y + (last_display.height / 2) - (window_dict.height / 2)
    }

    return [x, y]
}

async function exit_app(){
    //spawning info window
    coords = get_window_coords(-1, exit_dict)
    exitWindow = new Window(exit_dict, "./res/exit.html", coords)
    exitWindow.show()

    app_running = false; //stopping all Interval events from firing

    if (turn_on_backend){
        //disable voice recognition and ACAI backend
        EvLogger.add_record("DEBUG", "stopping voice-recognition")
        worker.postMessage(["action", "stop-neural"])

        await sleep(1000)

        //kill voice recognition
        EvLogger.add_record("DEBUG", "killing core.py")
        worker.postMessage(["action", "interrupt"])

        await sleep(1000)

        //stop backend worker
        EvLogger.add_record("DEBUG", "terminating backend worker")
        worker.terminate()
    }
    EvLogger.add_record("DEBUG", "terminating database worker")
    database_worker.terminate()

    EvLogger.add_record("DEBUG", "exit")
    app.exit(0)
}

function main_app(backup_db: any = undefined){
    mainMenu.close()

    //calculate x, y
    //leftmost tactic
    for(let i = 0; i < displays.length; i++){
        coords = get_window_coords(i)
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
            workerWindow = new Window(worker_dict, backup_db["monitor-data"][i]["path_load"], backup_db["monitor-data"][i]["win_coordinates"], backup_db["monitor-data"][i]["win_type"])
            workerWindow.isClosed = backup_db["monitor-planes"][i]["isClosed"]
        }
        else{
            //backup was not created, create new workers
            workerWindow = new Window(worker_dict, "./res/worker.html", coords, "ACC")
        }
        
        workers.push(workerWindow)
    }

    coords = get_window_coords(-1)

    EvLogger.add_record("DEBUG", "controller show")
    controllerWindow = new Window(controller_dict, "./res/controller_set.html", coords, "controller")
    controllerWindow.checkClose(() => {
        if (app_running){
            //app is running => close by tray button
            exit_app()
        }
    })
    
    for (let i = 0; i < workers.length; i++){
        workers[i].show()
        workers[i].checkClose()
    }
    controllerWindow.show()

    if (turn_on_backend){
        //setup voice recognition and ACAI backend
        worker.postMessage(["debug", app_settings["logging"]]) 
    }

    if (backup_db){
        //set scale of map
        scale = parse_scale(backup_db["map"]["scale"])

        map_name = backup_db["map-name"]
    }

    //run local plane DB
    PlaneDatabase = new PlaneDB(workers);
    if (backup_db){
        //run if backup db is avaliable
        redir_to_main = true

        for (let i = 0; i < backup_db["planes"].length; i++){
            //get monitor-type spawn
            let monit_type: string;
            for (let i2 = 0; i2 < backup_db["monitor-planes"].length; i2++){
                if (backup_db["monitor-planes"][i2]["planes_id"].includes(backup_db["planes"][i2]["id"])){
                    monit_type = backup_db["monitor-planes"][i2]["type"]
                    break
                }
            }

            curr_plane_id = generate_plane_hash()
            let plane = new Plane(curr_plane_id, backup_db["planes"][i]["callsign"], 
                    backup_db["planes"][i]["heading"], backup_db["planes"][i]["updated_heading"],
                    backup_db["planes"][i]["level"], backup_db["planes"][i]["updated_level"],
                    backup_db["planes"][i]["speed"], backup_db["planes"][i]["updated_speed"],
                    backup_db["planes"][i]["departure"], backup_db["planes"][i]["arrival"], 
                    backup_db["planes"][i]["arrival_time"],
                    backup_db["planes"][i]["x"], backup_db["planes"][i]["y"])

            PlaneDatabase.add_record(plane, monit_type)
        }

        //send reloaded plane database to all windows
        send_to_all(PlaneDatabase.DB, PlaneDatabase.monitor_DB, PlaneDatabase.plane_paths_DB)
        //controllerWindow.send_message("init-info", ["window-info", map_name, JSON.stringify(workers), map_config, JSON.stringify(app_settings)])
    }
}

function send_to_all(planes: any, plane_monitor_data: any, plane_paths_data: any){
    if (controllerWindow != undefined && workers.length != 0){
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
            workers[i].send_message("update-plane-db", temp_planes)
            //send path data to all workers
            workers[i].send_message("update-paths", plane_paths_data)
        }
    }
}

function parse_scale(scale){
    //parse scale (constant, that describes how many units is one pixel)
    let val: number = 0
    if(scale.includes("m")){
        val = parseFloat(scale.substring(0, scale.indexOf("m"))) //value is in nautical miles
    }

    return val
}

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

    public constructor(config: any, path: string, coords: number[], window_type: string = "none"){
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
                if (!redir_to_main){
                    EvLogger.log("DEBUG", ["Closing app... Bye Bye", "got close-app request, saving logs and quitting app..."])
                    exit_app()
                }
            })
        }

        EvLogger.add_record("DEBUG", `Created window object(win_type=${this.win_type},path_load=${this.path_load}, coords=${coords})`)
    }
}

app.on("ready", async () => {
    /*
    APP INIT 2
    */

    //update audio devices
    EvLogger.log("DEBUG", ["Updating audio devices...", "Updating audio device list using get_info.py"])
    const update_devices = spawn("python3", [PATH_TO_AUDIO_UPDATE])

    EvLogger.add_record("DEBUG", "Get display coords info for better window positioning")
    //get screen info
    var displays_info: any = screen.getAllDisplays()
    var displays_mod = []
    for(let i: number = 0; i < displays_info.length; i++){
        displays_mod.push(displays_info[i].bounds)
    }
    displays_mod.sort((a, b) => a.x - b.x);
    displays = displays_mod
    
    //calculate x, y
    let [x, y] = get_window_coords(-1, main_menu_dict)

    EvLogger.add_record("DEBUG", "main-menu show")
    mainMenu = new Window(main_menu_dict, "./res/main.html", [x, y])
    mainMenu.show()
})

//backend-worker events
if (turn_on_backend){
    worker.on("message", (message: string) => {
        //processing from backend.js
        let arg = message.split(":")[0]
        let content = message.split(":")[1]

        switch(arg){
            case "command":
                let command_args = content.split(" ")
                console.log(command_args)

                //search plane by callsign
                for(let i = 0; i < PlaneDatabase.DB.length; i++){
                    if (command_args[0] == PlaneDatabase.DB[i].callsign){
                        if (command_args[1] == "change-heading"){
                            PlaneDatabase.DB[i].updated_heading = parseInt(command_args[2])
                        }
                        else if (command_args[1] == "change-speed"){
                            PlaneDatabase.DB[i].updated_speed = parseInt(command_args[2])
                        }
                        else if (command_args[1] == "change-level"){
                            PlaneDatabase.DB[i].updated_level = parseInt(command_args[2])
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

//database worker events
database_worker.on("message", (message: string) => {
    if (Array.isArray(message)){
        switch(message[0]){
            case "db-data":
                var database_data = JSON.parse(message[1])
                map_data = database_data["map"]

                main_app(database_data) //start main app on backup restore
                break
        }
    }
})

//IPC listeners
ipcMain.handle("message", (event, data) => {
    switch(data[1][0]){
        //generic message channels
        case "redirect-to-menu":
            redir_to_main = false

            //message call to redirect to main menu
            EvLogger.add_record("DEBUG", "redirect-to-menu event")

            settings.close()

            //calculate x, y
            coords = get_window_coords(-1, main_menu_dict)

            EvLogger.add_record("DEBUG", "main-menu show")
            mainMenu = new Window(main_menu_dict, "./res/main.html", coords)
            mainMenu.show()

            break
        case "save-settings":
            //save settings
            EvLogger.add_record("DEBUG", "saving settings")

            fs.writeFileSync(path.join(ABS_PATH, "/src/res/data/settings.json"), data[1][1])
            break
        case "redirect-to-settings":
            //message call to redirect to settings
            redir_to_main = true

            EvLogger.add_record("DEBUG", "redirect-to-settings event")

            mainMenu.close()

            //calculate x, y
            coords = get_window_coords(-1)

            EvLogger.add_record("DEBUG", "settings show")
            settings = new Window(settings_dict, "./res/settings.html", coords)
            settings.show()
            break
        case "redirect-to-main":
            //message call to redirect to main program (start)
            redir_to_main = true
            if (turn_on_backend){
                worker.postMessage(["action", "start-neural"])
            }
            main_app()
            break
        case "exit":
            //spawning info window
            EvLogger.log("DEBUG", ["Closing app... Bye Bye", "got window-all-closed request, saving logs and quitting app..."])
            exit_app()

        case "invoke":
            //TODO: find out why I have this written here
            if (turn_on_backend){
                worker.postMessage(data[1][1])
            }
            break
        //info retrival to Controller
        case "send-info":
            //this part of function is utilised both for controller window and settings window
            //|settings window| uses this to acquire saved .json settings
            //|controller window| uses this to acquire current worker/window data
            
            if (data[0] == "settings"){

                //ACAI backend

                const speech_config_raw = fs.readFileSync(path.join(ABS_PATH, "/src/res/alg_data/speech_config.json"), "utf-8")
                const speech_config = JSON.parse(speech_config_raw);

                const text_config_raw = fs.readFileSync(path.join(ABS_PATH, "/src/res/alg_data/text_config.json"), "utf-8")
                const text_config = JSON.parse(text_config_raw);

                const voice_config_raw = fs.readFileSync(path.join(ABS_PATH, "/src/res/alg_data/voice_config.json"), "utf-8")
                const voice_config = JSON.parse(voice_config_raw);

                //audio devices

                const in_devices_raw = fs.readFileSync(path.join(ABS_PATH, "/src/res/data/in_device_list.json"), "utf-8")
                const in_devices = JSON.parse(in_devices_raw)

                const out_devices_raw = fs.readFileSync(path.join(ABS_PATH, "/src/res/data/out_device_list.json"), "utf-8")
                const out_devices = JSON.parse(out_devices_raw)

                //sending app data and alg configs
                settings.send_message("app-data", [app_settings, voice_config, text_config, speech_config, in_devices, out_devices])
            }
            else if (data[0] == "controller"){
                //sending monitor data

                //sending airport map data
                map_config = []
                var map_files = read_map.list_map_files()
                for (let i = 0; i < map_files.length; i++){
                    let map = read_map.read_map_from_file(map_files[i])
                    if (map_files[i].includes("config")){
                        map_config.push(map)
                    }
                }

                controllerWindow.send_message("init-info", ["window-info", JSON.stringify(workers), map_config, JSON.stringify(app_settings), map_name])
            }
            else if (data[0] == "worker"){
                //send to all workers
                for (let i = 0; i < workers.length; i++){
                    workers[i].send_message("init-info", ["window-info", JSON.stringify(app_settings)])
                }
            }
            break
        case "set-map":
            //getting map info from user input (invoked from controller)
            let filename = data[1][1]

            //save map data to variable
            map_data = read_map.read_map_from_file(filename)
            //read scale, parse it and save it to another variable
            scale = parse_scale(map_data["scale"])
            //save map name for other usage
            let map_config_raw = fs.readFileSync(PATH_TO_MAPS + map_data["CONFIG"], "utf-8")
            map_name = JSON.parse(map_config_raw)["AIRPORT_NAME"];

            //for weather to align latitude, longtitude and zoom (https://www.maptiler.com/google-maps-coordinates-tile-bounds-projection/#1/131.42/4.37)
            if (map_data == undefined){
                //map wasn't selected
                longitude = undefined
                latitude = undefined
                zoom = undefined
            }
            else{
                longitude = map_data["long"]
                latitude = map_data["lat"]
                zoom = map_data["zoom"]
            }

            for (let i = 0; i < workers.length; i++){
                worker[i].send_message("ask-for-render") //send workers command to fire "render-map" event
            }
            break
        case "render-map":
            //rendering map data for user (invoked from worker)
            for (let i = 0; i < workers.length; i++){
                workers[i].send_message("map-data", [map_data, workers[i].win_type])
            }

            for (let i = 0; i < workers.length; i++){
                if (workers[i]["win_type"] == "weather"){
                    workers[i].send_message("geo-data", [latitude, longitude, zoom])
                }
            }
            break
        case "get-points":
            let spec_data: any;
            if (data[1][1].includes("ACC")){
                //selected monitor is in ACC mode
                spec_data = map_data["ACC"]
            }
            else if (data[1][1].includes("APP")){
                //selected monitor is in APP mode
                spec_data = map_data["APP"]
            }
            else if (data[1][1].includes("TWR")){
                //selected monitor is in TWR mode
                spec_data = map_data["TWR"]
            }
            let out_data = {}
            for (const [key, value] of Object.entries(spec_data)) {
                if (key == "POINTS" || key == "ARP" || key == "SID" || key == "STAR" || key == "RUNWAY"){
                    out_data[key] = value
                }
            }
            controllerWindow.send_message("map-points", JSON.stringify(out_data))
            break
        case "map-check":
            if (map_data == undefined){
                EvLogger.add_record("WARN", "user did not check any map")
                controllerWindow.send_message("map-checked", JSON.stringify({"user-check": false}))
            }
            else {
                EvLogger.add_record("DEBUG", "user checked a map")
                controllerWindow.send_message("map-checked", JSON.stringify({"user-check": true}))
            }
            break
        case "monitor-change-info":
            //whenever controller decides to change monitor type
            let mon_data = data[1][1]
            for (let i = 0; i < workers.length; i++){
                if (workers[i].win_type != mon_data[i]["type"]){
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

                    workers[i].win_type = mon_data[i]["type"]
                    workers[i].show(path_to_render)


                }
                //change worker data in monitor_data DB
                PlaneDatabase.update_worker_data(workers)
            }
            break
        case "send-location-data":
            for (let i = 0; i < workers.length; i++){
                if (workers[i]["win_type"] == "weather"){
                    workers[i].send_message("geo-data", [latitude, longitude, zoom])
                }
            }
            break
        //plane control
        case "spawn-plane":
            let plane_data = data[1][1]

            //get current x, y coordinates according to selected points
            let x = 0
            let y = 0
            //get according map data
            let point_data = map_data[plane_data["monitor"].substring(plane_data["monitor"].length - 3, plane_data["monitor"].length)]
            
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
            
            curr_plane_id = generate_plane_hash()
            let plane = new Plane(curr_plane_id, plane_data["name"], 
                            plane_data["heading"], plane_data["heading"],
                            plane_data["level"], plane_data["level"],
                            plane_data["speed"], plane_data["speed"],
                            plane_data["departure"], plane_data["arrival"], 
                            plane_data["arrival_time"],
                            x, y)
            PlaneDatabase.add_record(plane, plane_data["monitor"])

            send_to_all(PlaneDatabase.DB, PlaneDatabase.monitor_DB, PlaneDatabase.plane_paths_DB)
            break
        case "plane-value-change":
            for (let i = 0; i < PlaneDatabase.DB.length; i++){
                if(PlaneDatabase.DB[i].id == data[1][3]){
                    switch(data[1][1]){
                        case "item0":
                            //heading change
                            PlaneDatabase.DB[i].updated_heading = data[1][2]
                            break
                        case "item1":
                            //level change
                            PlaneDatabase.DB[i].updated_level = data[1][2]
                            break
                        case "item2":
                            //speed change
                            PlaneDatabase.DB[i].updated_speed = data[1][2]
                            break
                    }
                }
            }
            
            send_to_all(PlaneDatabase.DB, PlaneDatabase.monitor_DB, PlaneDatabase.plane_paths_DB)
            break
        case "plane-delete-record":
            PlaneDatabase.delete_record(data[1][1])
            send_to_all(PlaneDatabase.DB, PlaneDatabase.monitor_DB, PlaneDatabase.plane_paths_DB)
            break
        case "send-plane-data":
            //send plane data (works for all windows)
            for (let i = 0; i < workers.length; i++){
                if (workers[i].win_type.includes(data[0])){
                    workers[i].send_message("update-plane-db", PlaneDatabase.DB)
                }
            }
            break
        case "stop-sim":
            running = false

            //send stop event to all workers
            for (let i = 0; i < workers.length; i++){
                workers[i].send_message("sim-event", "stopsim")
            }
            controllerWindow.send_message("sim-event", "stopsim")
            break
        case "start-sim":
            running = true

            //send stop event to all workers
            for (let i = 0; i < workers.length; i++){
                workers[i].send_message("sim-event", "startsim")
            }
            controllerWindow.send_message("sim-event", "startsim")
            break
        case "regenerate-map":
            if (turn_on_backend){
                worker.postMessage(["action", "terrain"])
            }
            break
        case "restore-sim":
            database_worker.postMessage(["read-db"])
            break
    }
})

ipcMain.on("message-redirect", (event, data) => {
    if (data[0] == "controller"){
        console.log("from worker")
        controllerWindow.send_message("message-redirect", data[1][0])
        sender_win_name = "worker"
    }
    else if (data[0].includes("worker")){
        console.log("from controller")
        
        let idx = parseInt(data[0].substring(6, 7))
        workers[idx].send_message("message-redirect", data[1][0])
        sender_win_name = "controller"
    }
})

//update all planes on one second
setInterval(() => {
    if (PlaneDatabase != undefined && map_data != undefined){
        if (running){
            PlaneDatabase.update_planes(scale, app_settings["std_bank_angle"], parseInt(app_settings["standard_pitch_up"]), parseInt(app_settings["standard_pitch_down"]),
                                    parseInt(app_settings["standard_accel"]), parseInt(app_settings["plane_path_limit"]))
        }
        if (app_running){
            //send updated plane database to all
            send_to_all(PlaneDatabase.DB, PlaneDatabase.monitor_DB, PlaneDatabase.plane_paths_DB)
        }
    }
}, 1000)

setInterval(() => {
    if (app_running && turn_on_backend){
        //sending plane status every 500ms for backend
        if (PlaneDatabase == undefined){
            worker.postMessage(["data", []]) //send empty array so the backend can still function without any problems
        }
        else{
            worker.postMessage(["data", PlaneDatabase.DB])
        }
    }
}, 1000)

//on every n minutes, save to local DB if app crashes
setInterval(() => {
    if (app_running){
        if (backup_db_on && (PlaneDatabase != undefined) && (map_data != undefined) && (workers.length != 0)){
            simulation_dict = {
                "planes": PlaneDatabase.DB,
                "monitor-planes": PlaneDatabase.monitor_DB,
                "map": map_data,
                "map-name": map_name,
                "monitor-data": workers
            }
    
            //save to local db using database.ts 
            database_worker.postMessage(["save-to-db", JSON.stringify(simulation_dict, null, 2)])
            EvLogger.log("DEBUG", ["Saving temporary backup...", "Saving temporary backup using database.ts"])
        }
    }
}, backupdb_saving_frequency)