/*
    File for utilites (functions) used by main.ts, logger.ts, plane_function.ts
*/

import fs from "fs";
import { join } from "path"
import { v4 } from "uuid"
import http from "http"
import { EventLogger } from "./logger"

//Logger functions
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

//Main functions
export function checkInternet(EvLogger: EventLogger){
    EvLogger.log("DEBUG", ["Internet connectivity check...", "Performing HTTP GET on google servers for internet check"])
    return new Promise((resolve, reject) => {
        http.get("http://www.google.com", async (res) => {
            EvLogger.add_record("DEBUG", "Lookup successful, fetching algorithm files...")
            resolve(true)
        }).on("error", (err) => {
            EvLogger.add_record("ERROR", "Lookup unsuccessful")
            EvLogger.add_record("ERROR", err.message)
            reject(false)
        })
    })
}

export function get_window_coords(app_settings: any, displays: any[], idx: number, window_dict: any = undefined){
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