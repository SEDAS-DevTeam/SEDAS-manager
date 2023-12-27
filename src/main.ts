//system imports
import {app, BrowserWindow, ipcMain, screen} from "electron";
import * as fs from "fs";
import {Worker} from "worker_threads"
import {spawn} from "node:child_process"
import * as path from "path"
import {lookup} from "dns"
import * as read_map from "./read_map"
import { BackupDB } from "./database";
import { Plane, PlaneDB } from "./plane_functions";
import { update_all } from "./fetch";

//window variable declarations
var mainMenu: Window;
var settings: Window;
var controllerWindow: Window;
var workerWindow: Window;

//other declarations
var sender_win_name: string = "";
var displays = [];
var workers = [];
var map_config = [];
var map_data: any;
var curr_plane_id: number = 0;
var PlaneDatabase: any;
var backupdb_saving_frequency: number = 0;
var backup_db_on: boolean = true
var scale: number = 0;
var running: boolean = false

/*
APP INIT 1
*/

const PATH_TO_PROCESS = __dirname.substring(0, __dirname.indexOf("SEDAC") + "SEDAC".length) + "/src/res/neural/fetch.py"

//read JSON
const app_settings_raw = fs.readFileSync("./res/data/settings.json", "utf-8")
const app_settings = JSON.parse(app_settings_raw);

const acai_settings_raw = fs.readFileSync("./res/data/acai_settings.json", "utf-8")
const acai_settings = JSON.parse(acai_settings_raw);

const voice_settings_raw = fs.readFileSync("./res/data/voice_settings.json", "utf-8")
const voice_settings = JSON.parse(voice_settings_raw);

//run RedisDB
const database = spawn(`redis-server --port ${app_settings["port"]}`)

//run SQLite DB
var BackupDatabase = new BackupDB();
BackupDatabase.create_database()

//check internet connectivity
lookup("8.8.8.8", (err) => {
    if(err){
        console.log("error fetching files")
        console.log(err)
    }
    else {
        console.log("fetching files...")

        //fetch all python backend files
        update_all()
    }
})

if (app_settings["saving_frequency"].includes("min")){
    backupdb_saving_frequency = parseInt(app_settings["saving_frequency"].charAt(0)) * 60 * 1000
}
else if (app_settings["saving_frequency"].includes("hour")){
    backupdb_saving_frequency = parseInt(app_settings["saving_frequency"].charAt(0)) * 3600 * 1000
}
else if (app_settings["saving_frequency"].includes("never")){
    backup_db_on = false
    //defaultly set to 5 mins
    backupdb_saving_frequency = 5 * 60 * 1000
}
console.log(backupdb_saving_frequency)

const main_menu_dict = {
    width: 800,
    height: 600,
    title: "SEDAC manager",
    resizable: false,
    icon: "./res/img/sedac-manager-logo.png",
    webPreferences: {
        preload: path.join(__dirname, "res/preload.js")
    }
}

const settings_dict = {
    width: 1920,
    height: 1080,
    title: "SEDAC manager - settings",
    resizable: true,
    icon: "./res/img/sedac-manager-logo.png",
    webPreferences: {
        preload: path.join(__dirname, "res/preload.js")
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
        preload: path.join(__dirname, "res/preload.js")
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
        preload: path.join(__dirname, "res/preload.js")
    }
}

/*
DATABASE FUNCTIONS (READY TO IMPLEMENT)
async function run(){
    CreateDatabase()
    InsertRecord(5, "amogus", 180, 180, 180, "vepot", "afis")
    InsertRecord(3, "fix", 180, 180, 180, "vepot", "afis")
    let out = await SelectRecord(5)
    DeleteRecord(5)
    console.log(out)

    setTimeout(() => console.log("timeout"), 5000)
    CloseDatabase()
}
*/


function get_window_coords(idx: number){
    let x: number
    let y: number

    if (app_settings["alignment"] == "free"){
        x = undefined
        y = undefined
        return [x, y]
    }

    if (displays.length == 1){
        x = displays[0].x
        y = displays[0].y
        return [x, y]
    }

    if (idx == -1){
        if (app_settings["controller-loc"] == "leftmost"){
            x = displays[0].x
            y = displays[0].y
        }
        else if (app_settings["controller-loc"] == "rightmost"){
            x = displays[displays.length - 1].x
            y = displays[displays.length - 1].y
        }
    }
    else{ //idx != -1: other worker windows
        if (app_settings["controller-loc"] == "leftmost"){
            if (displays.length == idx + 1){
                return [-2, -2]
            }

            x = displays[idx + 1].x
            y = displays[idx + 1].y
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
        }
    }
    return [x, y]
}

function exit_app(){
    //disable voice recognition and ACAI backend
    worker.postMessage("stop")
    //kill voice recognition
    worker.postMessage("interrupt")
    
    //close windows
    if (controllerWindow != undefined){
        controllerWindow.close()
    }
    for(let i = 0; i < workers.length; i++){
        workers[i].close()
    }

    //stop redis database
    database.kill("SIGINT")

    //stop SQLite database
    //BackupDatabase.close_database() //TODO

    app.exit(0)
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

function save_to_local_db(){
    console.log("saved to local db!")
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
    private path_load: string;

    public close(){
        this.window.close()
    }

    public show(path: string = ""){
        if (path.length != 0){
            //rewrite path_load (used for controller window_manipulation
            this.path_load = path
        }
        this.window.loadFile(this.path_load);
    }

    public send_message(channel: string, message: any){
        this.window.webContents.postMessage(channel, message)
    }

    public constructor(config: any, path: string, coords: number[], window_type: string = "none"){
        config.x = coords[0]
        config.y = coords[1]

        //retype window_type
        this.win_type = window_type

        this.window = new BrowserWindow(config);
        this.window.setMenu(null);
        //this.window.webContents.openDevTools()

        this.path_load = path
        this.window.maximize()
    }
}

app.on("ready", () => {

    //get screen info
    var displays_info: any = screen.getAllDisplays()
    var displays_mod = []
    for(let i: number = 0; i < displays_info.length; i++){
        displays_mod.push(displays_info[i].bounds)
    }
    displays_mod.sort((a, b) => a.x - b.x);
    displays = displays_mod

    //calculate x, y
    let [x, y] = get_window_coords(-1)

    mainMenu = new Window(main_menu_dict, "./res/main.html", [x, y])
    mainMenu.show()

    worker.postMessage("terrain")

})

//communication workers
const worker = new Worker("./backend.js")

//worker listeners
worker.on("message", (message) => {
    console.log("output: " + message)
})

//IPC listeners
ipcMain.handle("message", (event, data) => {
    let coords = [0, 0]

    switch(data[1][0]){
        //generic message channels
        case "redirect-to-menu":
            //message call to redirect to main menu
            settings.close()

            //calculate x, y
            coords = get_window_coords(-1)

            mainMenu = new Window(main_menu_dict, "./res/main.html", coords)
            mainMenu.show()

            break
        case "save-settings":
            console.log(data[1][1])
            fs.writeFileSync("./res/data/settings.json", data[1][1])
            break
        case "redirect-to-settings":
            //message call to redirect to settings

            mainMenu.close()

            //calculate x, y
            coords = get_window_coords(-1)

            settings = new Window(settings_dict, "./res/settings.html", coords)
            settings.show()
            break
        case "redirect-to-main":
            //message call to redirect to main program (start)

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
                
                workerWindow = new Window(worker_dict, "./res/worker.html", coords, "ACC")
                workers.push(workerWindow)
            }

            coords = get_window_coords(-1)

            controllerWindow = new Window(controller_dict, "./res/controller_gen.html", coords, "controller")
            
            for (let i = 0; i < workers.length; i++){
                workers[i].show()
            }
            controllerWindow.show()

            //setup voice recognition and ACAI backend
            worker.postMessage("start")
            worker.postMessage("terrain") //generate terrain

            //run local plane DB
            PlaneDatabase = new PlaneDB(workers);
            break
        case "exit":
            exit_app()

        case "invoke":
            worker.postMessage(data[1][1])
            break
        //info retrival to Controller
        case "send-info":
            //this part of function is utilised both for controller window and settings window
            //|settings window| uses this to acquire saved .json settings
            //|controller window| uses this to acquire current worker/window data
            
            if (data[0] == "settings"){
                //sending saved .json app data
                settings.send_message("app-data", JSON.stringify(app_settings))
            }
            else if (data[0] == "controller"){
                //sending monitor data
                let worker_data_message = JSON.stringify(workers)

                //sending airport map data
                map_config = []
                var map_files = read_map.list_map_files()
                for (let i = 0; i < map_files.length; i++){
                    console.log(map_files[i])
                    let map = read_map.read_map_from_file(map_files[i])
                    if (map_files[i].includes("config")){
                        map_config.push(map)
                    }
                }

                controllerWindow.send_message("init-info", ["window-info", worker_data_message, map_config, JSON.stringify(app_settings)])
            }
            else if (data[0] == "worker"){
                //send to all workers
                for (let i = 0; i < workers.length; i++){
                    workers[i].send_message("init-info", ["window-info", JSON.stringify(app_settings)])
                }
            }
            break
        case "set-map":
            //retrieve all airport data
            let filename = data[1][1]

            //save map data to variable
            map_data = read_map.read_map_from_file(filename)
            //read scale, parse it and save it to another variable
            scale = parse_scale(map_data["scale"])

            //set map data to all workers
            for (let i = 0; i < workers.length; i++){
                workers[i].send_message("map-data", [map_data, workers[i].win_type])
            }
            break
        case "render-map":
            //set map data to all workers
            for (let i = 0; i < workers.length; i++){
                workers[i].send_message("map-data", [map_data, workers[i].win_type])
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
                console.log("user did not check")
                controllerWindow.send_message("map-checked", JSON.stringify({"user-check": false}))
            }
            else {
                console.log("user checked")
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
            //for weather to align latitude, longtitude and zoom (https://www.maptiler.com/google-maps-coordinates-tile-bounds-projection/#1/131.42/4.37)
            let longitude = map_data["long"]
            let latitude = map_data["lat"]
            let zoom = map_data["zoom"]

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
            
            let plane = new Plane(curr_plane_id, plane_data["name"], 
                            plane_data["heading"], plane_data["heading"],
                            plane_data["level"], plane_data["level"],
                            plane_data["speed"], plane_data["speed"],
                            plane_data["departure"], plane_data["arrival"], 
                            plane_data["arrival_time"],
                            x, y)
            PlaneDatabase.add_record(plane, plane_data["monitor"])
            curr_plane_id += 1

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

//channel for sending created plane data
ipcMain.on("plane-info", (event, data) => {
    console.log("got data from process")
    console.log(data)
})


//update all planes on one second
setInterval(() => {
    if (PlaneDatabase != undefined && map_data != undefined && running){
        PlaneDatabase.update_planes(scale, app_settings["std_bank_angle"], parseInt(app_settings["standard_pitch_up"]), parseInt(app_settings["standard_pitch_down"]),
                                    parseInt(app_settings["standard_accel"]), parseInt(app_settings["plane_path_limit"]))
        //send updated plane database to all
        send_to_all(PlaneDatabase.DB, PlaneDatabase.monitor_DB, PlaneDatabase.plane_paths_DB)
    }
}, 1000)


//on every n minutes, save to local DB if app crashes
setInterval(() => {
    if (backup_db_on){
        save_to_local_db()
    }
}, backupdb_saving_frequency)


//when app dies, it should die in peace
app.on("window-all-closed", () => {
    console.log("win-close")
    exit_app()
})

//TODO: add SIGINT functionality