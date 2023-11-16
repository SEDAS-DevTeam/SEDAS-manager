//system imports
import {app, BrowserWindow, ipcMain, screen} from "electron";
import * as fs from "fs";
import {Worker} from "worker_threads"
import {spawn} from "node:child_process"
import * as path from "path"
import * as read_map from "./read_map"
import { BackupDB, PlaneDB } from "./database";

//own imports
//import * as comm from "./res/communication" //importing communication module 

//window variable declarations
var mainMenu: Window;
var settings: Window;
var controllerWindow: Window;
var workerWindow: Window;

//other declarations
var sender_win_name: string = "";
var displays = [];
var workers = [];
var map_config = []


const PATH_TO_PROCESS = __dirname.substring(0, __dirname.indexOf("SEDAC") + "SEDAC".length) + "/src/res/neural/fetch.py"

//read JSON
const app_settings_raw = fs.readFileSync("./res/data/settings.json", "utf-8")
const app_settings = JSON.parse(app_settings_raw);

const acai_settings_raw = fs.readFileSync("./res/data/acai_settings.json", "utf-8")
const acai_settings = JSON.parse(acai_settings_raw);

const voice_settings_raw = fs.readFileSync("./res/data/voice_settings.json", "utf-8")
const voice_settings = JSON.parse(voice_settings_raw);

//run RedisDB
const database = spawn("redis-server")

//run SQLite DB
var BackupDatabase = new BackupDB();
BackupDatabase.create_database()

//run local plane DB
var PlaneDatabase = new PlaneDB();

//fetch all python backend files
const fetch_process = spawn("python3", [`${PATH_TO_PROCESS}`])

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
    focusable: true,
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
    frame: false,
    focusable: false,
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

class Window{
    public window: BrowserWindow;
    public win_type: string = "none";
    private path_load: string;

    public close(){
        this.window.close()
    }

    public show(){
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
        this.window.webContents.openDevTools()

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
const worker = new Worker("./controller_backend.js")
const voice_worker = new Worker("./voice_backend.js")

//worker listeners
worker.on("message", (message) => {
    console.log("backend output: " + message)
})

voice_worker.on("message", (message) => { //messages from microphone
    console.log("voice output: " + message)
})

//IPC listeners
ipcMain.handle("message", (event, data) => {
    let coords = [0, 0]

    switch(data[1][0]){
        case "redirect-to-menu":
            //message call to redirect to main menu
            settings.close()

            //calculate x, y
            coords = get_window_coords(-1)

            mainMenu = new Window(main_menu_dict, "./res/main.html", coords)
            mainMenu.show()

            break
        case "save-settings":
            fs.writeFileSync("./res/data/settings.json", JSON.parse(data[1][1]))
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
            voice_worker.postMessage("start")
            worker.postMessage("terrain") //generate terrain
            break
        case "exit":
            //disable voice recognition and ACAI backend
            voice_worker.postMessage("stop")
            //kill voice recognition
            voice_worker.postMessage("interrupt")
            
            //close windows
            controllerWindow.close()
            for(let i = 0; i < workers.length; i++){
                workers[i].close()
            }

            //stop redis database
            database.kill("SIGINT")

            //stop SQLite database
            CloseDatabase()

            break
        case "invoke":
            worker.postMessage(data[1][1])
            break
        case "send-info":
            //send initial info to controller

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

            controllerWindow.send_message("init-info", ["window-info", worker_data_message, map_config])
            break
        case "render-map":
            //retrieve all airport data
            let filename = data[1][1]
            let map_data = read_map.read_map_from_file(filename)

            //render to workers
            console.log(map_data)
            //set map data to all workers
            for (let i = 0; i < workers.length; i++){
                workers[i].send_message("map-data", [map_data])
            }
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