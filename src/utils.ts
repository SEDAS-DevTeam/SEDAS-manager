/*
    File for utilites (functions) used by main.ts, logger.ts, plane_function.ts
*/

import fs from "fs";
import { join } from "path"
import { v4 } from "uuid"
import http from "http"
import { EventLogger } from "./logger"

export class ProgressiveLoader{
    
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