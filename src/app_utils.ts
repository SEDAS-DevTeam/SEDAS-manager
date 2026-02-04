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
  
  Coords,
  DisplayObject,
  MainAppInterface,
  EventLoggerInterface,
  MonitorInfo,
    
  generate_id,
  generate_win_id
} from "./app_config.js";
import { screen, Display } from "electron";
import { Rectangle } from "electron";

//
// File manipulation
// 

function read_file_content(path: string, path2: string | undefined = undefined) {
  let fin_path: string;
  if (path2 === undefined) fin_path = path
  else fin_path = join(path, path2)
  let map_raw = fs.readFileSync(fin_path, "utf-8")
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

// Getting system monitor info
function get_monitor_info(controller_loc: string) {
  function display_sort(a: DisplayObject, b: DisplayObject) {
    if (a.center[0] == b.center[0]) return 0;
    else return (a.center[0] < b.center[0]) ? -1 : 1;
  }
  
  // Getting display data
  let displays: Display[] | Rectangle[] = screen.getAllDisplays()
  displays = displays.map((display) => display.bounds)
  
  // Transforming display data
  let display_bounds: DisplayObject[] = []
  displays.forEach((display) => {
    display_bounds.push({
      center: [display.x + Math.round(display.width / 2), display.y + Math.round(display.height / 2)],
      size: [display.width, display.height]
    })
  })
  
  // Sorting
  display_bounds.sort(display_sort)
  
  let main_monitor!: DisplayObject;
  if (controller_loc == "leftmost") main_monitor = display_bounds[0];
  else if (controller_loc == "rightmost") main_monitor = display_bounds[display_bounds.length - 1]
  else return // If this happens, the settings are invalid anyways ...
  
  let monitor_info: MonitorInfo<DisplayObject[], DisplayObject> = [display_bounds, main_monitor]
  return monitor_info
}

// Helper func to calculate widget coord on monitor
function calculate_center(w: number, h: number, x: number, y: number) {
  let coords: Coords<number, number> = [x - Math.round(w / 2), y - Math.round(h / 2)]
  return coords
}

function align_windows(
  monitor_info: MonitorInfo<DisplayObject[], DisplayObject>,
  app_object: MainAppInterface,
  event_logger: EventLoggerInterface,
  controller_loc: string,
) {
  
  let monitors: DisplayObject[] = monitor_info[0]
  for (let i = 0; i < monitors.length; i++){
    let bound = monitors[i]
    let coords: Coords<number, number> = calculate_center(...bound.size, ...bound.center)
    
    if ((controller_loc == "leftmost" && i == 0) ||
        (controller_loc == "rightmost" && i == monitors.length - 1)) {
      
      event_logger.log("DEBUG", "controller show")
      app_object.controllerWindow = new Window(
        app_object.app_status,
        app_object.dev_panel,
        controller_dict,
        PATH_TO_CONTROLLER_HTML,
        coords,
        event_logger,
        app_object,
        "controller",
        bound.size
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
      let win_type: string = "ACC" // default option when spawning windows (TODO)
      event_logger.log("DEBUG", "worker show")
      let workerWindow = new WorkerWindow(
          app_object.app_status,
          app_object.dev_panel,
          worker_dict,
          PATH_TO_WORKER_HTML,
          coords,
          event_logger,
          app_object,
          win_type,
          bound.size
      )
      app_object.wrapper.register_window(workerWindow, "worker-" + win_type)
      app_object.worker_coords.push(coords)
      
      // ID generation to identify workers better
      let worker_id = generate_id()
      app_object.workers.push({
          "id": worker_id,
          "win": workerWindow
      })
    }
  }
}

//
// Sleep function (yes, javascript does not have one)
// 

function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// exports
const utils = {
  read_file_content,
  list_files,
  generate_hash,
  generateRandomInteger,
  generate_name,
  get_random_element,
  checkInternet,
  ping,
  calculate_center,
  get_monitor_info,
  align_windows,
  sleep
}

export default utils