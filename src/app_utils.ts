/*
  File having the most low-level utilities known to mankind (or atleast this project), basically every part of the project uses function written here
*/

import fs from "fs";
import { join } from "path"
import { v4 } from "uuid"
import http from "http"
import { EventLogger } from "./logger.js"
import dns from "dns"
import { 
    Window,
    WorkerWindow,
    worker_dict,
    PATH_TO_WORKER_HTML,
    controller_dict,
    PATH_TO_CONTROLLER_HTML,
    
    PyMonitor_object,
    JsonData
 } from "./app_config.js";
import { desktopCapturer, ipcMain, screen, Display } from "electron";
import { Rectangle } from "electron";

//
// Variables & Variable types
// 

const alphabet: string[] = 'abcdefghijklmnopqrstuvwxyz'.split(''); // TODO: Check usage and move to atc_config.ts

//
// File manipulation
// 

function read_file_content(path: string){
    let map_raw = fs.readFileSync(join(path), "utf-8")
    return JSON.parse(map_raw);
}

function list_files(path: string){
    var files = fs.readdirSync(path)

    let idx_gitkeep = files.indexOf(".gitkeep")
    if (idx_gitkeep != -1){
        files.splice(idx_gitkeep, 1)
    }
    return files
}

//
// Random-stuff generation
// 

function generate_hash(){
    return v4()
}

function generate_win_id(){
    var res_str: string = "win-"
    var n_pos: number = 4;


    for (let i = 0; i < n_pos; i++){
        res_str += Math.floor(Math.random() * 9).toString()
    }
    return res_str
}

function generate_id(){
    var n_pos: number = 5;
    var res_str: string = ""

    for (let i = 0; i < n_pos; i++){
        let rand_choice = Math.random() < 0.5;
        let elem: string;
        if (rand_choice){ //alphabet
            elem = alphabet[(Math.floor(Math.random() * alphabet.length))]
        }
        else{ //number
            elem = Math.floor(Math.random() * 11).toString()
        }
        res_str += elem
    }
    return res_str
}

function generateRandomInteger(min: number, max: number) {
    return Math.random() * (max - min) + min;
}

function generate_name(airline_names: any[], type: string): string{ // TODO: move to ATC config
    /*
    CALLSIGN GENERATION RULES & RECOMMENDATIONS (TODO: Validate)
    * must not exceed 7 characters (by FAA)
    * scheduled aircraft operators may use a letter or two as the final character of identification, otherwise not permited (FAA does not permit two letters)
    * Must have 3 letters reserved for airline identification
    * The last 3 to 4 letters are reserved for flight identification
    * On non-airline/not-scheduled flights/private-owner typically 5 alphabet charaters are used (NATO-alphabet when pronouncing)
    */

    function get_random_char(char_str: string): string{
        return char_str.charAt(Math.floor(Math.random() * char_str.length))
    }
    
    let chars: string = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
    let nums: string = "0123456789"

    let out: string = ""

    if (type == "airliner"){
        //airliner flight
        
        //get airliner name
        let airline_abbrs: string[] = []
        for (let i = 0; i < airline_names.length; i++){
            airline_abbrs.push(airline_names[0]["abbr"])
        }
        out += get_random_element(airline_abbrs)

        let rand_len: number = Math.floor(Math.random() * 3) + 1
        for (let i = 0; i < rand_len; i++){
            out += get_random_char(nums)
        }
        for (let i = 0; i < 4 - rand_len; i++){
            out += get_random_char(chars)
        }

    }
    else if (type == "other"){
        //others
        for (let i = 0; i < 5; i++){
            out += get_random_char(chars)
        }
    }

    return out
}

function get_random_element(array: string[] | number[] | object[]){
    if(array.length == 1){
        return array[0]
    }

    let random_index: number = Math.floor(Math.random() * array.length)
    return array[random_index]
}

//
// Internet checking 
//

function checkInternet(EvLogger: EventLogger){
    EvLogger.log("DEBUG", "Performing HTTP GET on google servers for internet check")
    return new Promise((resolve, reject) => {
        http.get("http://www.google.com", async (res) => {
            EvLogger.log("DEBUG", "Lookup successful")
            resolve(true)
        }).on("error", (err) => {
            EvLogger.log("ERROR", "Lookup unsuccessful")
            EvLogger.log("ERROR", err.message)
            resolve(false)
        })
    })
}

async function ping(address: string): Promise<boolean>{
    return new Promise((resolve, reject) => {
        let url!: URL;
        try{
            url = new URL(address)
        }
        catch(e){ //invalid URL
            resolve(false)
        }
        let parsed_address: string = url.hostname + url.pathname

        dns.lookup(parsed_address, (error, address, family) => {
            if (error) resolve(false)
            else resolve(true)
        })
    })
}

//
// TODO: this absolutely does not work, it is combined Python monitor config + electron monitor config and both of them do not work the way I would like to
// 

function align_windows(
                // actual variables used for alignment
                monitor_objects_1: PyMonitor_object[], // output from python updater script
                monitor_objects_2: Rectangle[], // output from electron screen utility
                environment_config: JsonData,
                controller_loc: string,
                
                // rest of variables used for monitor spawning
                app_object: MainApp,
                EvLogger: EventLogger
            ){
    
    function set_win_position_vars(i: number){
        let coords: number[] = [monitor_objects_1[i].pos_x, monitor_objects_1[i].pos_y]
        let display_res: number[] = [monitor_objects_1[i].width, monitor_objects_1[i].height]

        return [display_res, coords]
    }
    

    // sort by pos_x and x
    monitor_objects_1.sort((a, b) => a.pos_x - b.pos_x)
    monitor_objects_2.sort((a, b) => a.x - b.x)

    for (let i = 0; i < monitor_objects_1.length; i++){
        // rewrite according to electron so that the script will be following electron screen.getAllDisplays (this sucks)

        monitor_objects_1[i].width = monitor_objects_2[i].width
        monitor_objects_1[i].height = monitor_objects_2[i].height
        monitor_objects_1[i].pos_x = monitor_objects_2[i].x
        monitor_objects_1[i].pos_y = monitor_objects_2[i].y
    }

    for (let i = 0; i < monitor_objects_1.length; i++){
        // iterating from left to right
        if ((i == 0 && controller_loc == "leftmost") || (i == monitor_objects_1.length - 1 && controller_loc == "rightmost")){
            // spawn controller window on the left or on the right
            const [display_res, coords] = set_win_position_vars(i)

            EvLogger.log("DEBUG", "controller show")
            app_object.controllerWindow = new Window(
                app_object.app_status,
                app_object.dev_panel,
                controller_dict,
                PATH_TO_CONTROLLER_HTML,
                coords,
                EvLogger,
                app_object,
                "controller",
                display_res
            )
            app_object.wrapper.register_window(app_object.controllerWindow, "controller")

            app_object.controllerWindow.checkClose(() => {
                if (app_object.app_status["app-running"] && app_object.app_status["redir-to-main"]){
                    //app is running and is redirected to main => close by tray button
                    app_object.exit_app()
                }
            })

        }
        else {
            // just spawn a worker window with ACC mode on
            let win_type: string = "ACC" // default option when spawning windows
            const [display_res, coords] = set_win_position_vars(i)
            
            EvLogger.log("DEBUG", "worker show")
            let workerWindow = new WorkerWindow(
                app_object.app_status,
                app_object.dev_panel,
                worker_dict,
                PATH_TO_WORKER_HTML,
                coords,
                EvLogger,
                app_object,
                win_type,
                environment_config["bar_height"],
                display_res
            )
            app_object.wrapper.register_window(workerWindow, "worker-" + win_type)
            app_object.worker_coords.push(coords)

            let worker_id = generate_id()
            app_object.workers.push({
                "id": worker_id,
                "win": workerWindow
            })
        }

    }

    return monitor_objects_1
}

//
// TODO: same here lol
// 

function calculate_window_info(app_settings: any, 
                               displays: any[], 
                               idx: number, 
                               mode: string, 
                               window_dict: any = undefined): (number | undefined)[]{
    let x: number | undefined = undefined;
    let y: number | undefined = undefined;
    let width: number | undefined = undefined;
    let height: number | undefined = undefined;

    let last_display: any;

    //for loader just center
    if (mode == "load"){
        let display = displays[idx]

        x = display.x + (display.width / 2) - (window_dict.width / 2)
        y = display.y + (display.height / 2) - (window_dict.height / 2)
    }
    //for every other window
    else if (mode == "normal"){
        if (app_settings["alignment"] == "free"){
            x = undefined
            y = undefined
            width = undefined
            height = undefined
    
            return [x, y, width, height]
        }
    
        if (displays.length == 1){
            x = displays[0].x
            y = displays[0].y
    
            width = displays[0].width
            height = displays[0].height
    
            last_display = displays[0]
    
            if (window_dict){
                x = x! + (last_display.width / 2) - (window_dict.width / 2)
                y = y! + (last_display.height / 2) - (window_dict.height / 2)
            }
            return [x, y, width, height]
        }
    
        if (idx == -1){
            if (app_settings["controller_loc"] == "leftmost"){
                x = displays[0].x
                y = displays[0].y
    
                width = displays[0].width
                height = displays[0].height
    
                last_display = displays[0]
            }
            else if (app_settings["controller_loc"] == "rightmost"){
                x = displays[displays.length - 1].x
                y = displays[displays.length - 1].y
    
                width = displays[displays.length - 1].width
                height = displays[displays.length - 1].height
    
                last_display = displays[displays.length - 1]
            }
        }
        else{ //idx != -1: other worker windows
            if (app_settings["controller_loc"] == "leftmost"){
                if (displays.length == idx + 1){
                    return [-2, -2] //signalizes "break"
                }
                x = displays[idx + 1].x
                y = displays[idx + 1].y
    
                width = displays[idx + 1].width
                height = displays[idx + 1].height
    
                last_display = displays[idx + 1]
            }
            else if (app_settings["controller_loc"] == "rightmost"){
                if (displays.length == idx){
                    return [-2, -2] //signalizes "break"
                }
                if(idx == 0){
                    return [-3, -3] //signalizes "skip"
                }
    
                x = displays[idx - 1].x
                y = displays[idx - 1].y
    
                x = displays[idx - 1].x
                y = displays[idx - 1].y
    
                last_display = displays[idx - 1]
            }
        }
        //align to center on some windows
        if (window_dict){
            x = x! + (last_display.width / 2) - (window_dict.width / 2)
            y = y! + (last_display.height / 2) - (window_dict.height / 2)
        }
    }

    return [x, y, width, height]
}

//
// TODO: I really do not know why i needed 3 functions for this...
// 

function get_window_info(app_settings: object, 
                         displays: any[], 
                         idx: number, 
                         mode: string, 
                         window_dict: any = undefined): [number[], number[]]{
    let win_info = calculate_window_info(app_settings,
                                         displays,
                                         idx,
                                         mode,
                                         window_dict)
    let coords: [number, number] = [
        win_info[0] ?? 0,
        win_info[1] ?? 0
    ];
    let display_info: [number, number] = [
        win_info[2] ?? 800,
        win_info[3] ?? 600
    ];
    return [coords, display_info];
}

//
// TODO: Nice, fourth one right now :D.
// 

function get_screen_info(){
    //get screen info
    var displays_info: Display[] = screen.getAllDisplays()
    var displays_mod = []
    for(let i: number = 0; i < displays_info.length; i++){
        displays_mod.push(displays_info[i].bounds)
    }
    displays_mod.sort((a, b) => a.x - b.x);
    return displays_mod
}

//
// Sleep function (yes, javascript does not have one)
// 

function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// exports
const utils = {
  alphabet,
  read_file_content,
  list_files,
  generate_hash,
  generate_win_id,
  generate_id,
  generateRandomInteger,
  generate_name,
  get_random_element,
  checkInternet,
  ping,
  align_windows,
  calculate_window_info,
  get_window_info,
  get_screen_info,
  sleep
}

export default utils