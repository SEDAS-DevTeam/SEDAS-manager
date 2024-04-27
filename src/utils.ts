/*
    File for utilites (functions) used by main.ts, logger.ts, plane_function.ts
*/

import fs from "fs";
import { join } from "path"
import { v4 } from "uuid"
import http from "http"
import { EventLogger } from "./logger"
import { LoaderWindow } from "./app_config";

export class ProgressiveLoader{
    private loaders: any[] = [];
    private app_settings: any;
    private displays: any[]
    private load_dict: any;
    private ev_logger: EventLogger;
    public num_segments: number = 0;
    public curr_n_segments: number = 0;

    public set_loader_win(){
        //getting window info to spawn load on all monitors && initialize all loaders
        for(let i = 0; i < this.displays.length; i++){
            let win_info = get_window_info(this.app_settings, this.displays, i, "load", this.load_dict)
            let coords = win_info.slice(0, 2)
            let display_info = win_info.slice(2, 4)

            //creating loading window
            let LoadingWindow = new LoaderWindow(this.load_dict, "./res/load.html", coords, this.ev_logger, display_info)
            this.loaders.push(LoadingWindow)
        }
    }

    public async show_loader_win(){
        //showing all loaders, going to progressively send them data
        for(let i = 0; i < this.loaders.length; i++){
            this.loaders[i].show()
            await this.loaders[i].wait_for_load(() => {
                this.ev_logger.log("DEBUG", `loader${i} loaded`)
            })
        }
    }

    public set_segments(n_segments: number){
        this.num_segments = n_segments
        for (let i = 0; i < this.loaders.length; i++){
            this.loaders[i].send_message("n_segments", this.num_segments)
        }
    }

    public send_progresss(message: string){
        for (let i = 0; i < this.loaders.length; i++){
            this.loaders[i].send_message("progress", [message])
        }
    }

    public destroy_loaders(){
        for (let i = 0; i < this.loaders.length; i++){
            this.loaders[i].close()
        }
        this.loaders = []
    }

    public constructor(app_settings: any, displays: any[], load_dict: any, event_logger: EventLogger){
        this.app_settings = app_settings
        this.displays = displays
        this.load_dict = load_dict
        this.ev_logger = event_logger
    }
}

export function read_file_content(path: string, file_name: string){
    let map_raw = fs.readFileSync(join(path, file_name), "utf-8")
    return JSON.parse(map_raw);
}

export function list_files(path: string){
    var files = fs.readdirSync(path)

    let idx_gitkeep = files.indexOf(".gitkeep")
    if (idx_gitkeep != -1){
        files.splice(idx_gitkeep, 1)
    }
    return files
}

export function generate_hash(){
    return v4()
}

export function generate_id(){
    var alphabet = 'abcdefghijklmnopqrstuvwxyz'.split('');

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

//Main functions
export function checkInternet(EvLogger: EventLogger){
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

export function get_window_info(app_settings: any, displays: any[], idx: number, mode: string, window_dict: any = undefined){
    //TODO: rework
    let x: number;
    let y: number;
    let width: number;
    let height: number;

    let last_display: any;

    //for loader just center
    if (mode == "load"){
        let display = displays[idx]
        console.log(display)

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
                x = x + (last_display.width / 2) - (window_dict.width / 2)
                y = y + (last_display.height / 2) - (window_dict.height / 2)
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
            x = x + (last_display.width / 2) - (window_dict.width / 2)
            y = y + (last_display.height / 2) - (window_dict.height / 2)
        }
    }

    return [x, y, width, height]
}

export function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

export function parse_scale(scale){
    //parse scale (constant, that describes how many units is one pixel)
    let val: number = 0
    if(scale.includes("m")){
        val = parseFloat(scale.substring(0, scale.indexOf("m"))) //value is in nautical miles
    }

    return val
}