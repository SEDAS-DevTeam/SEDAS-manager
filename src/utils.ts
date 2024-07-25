/*
    File for utilites (functions) used by main.ts, logger.ts, plane_function.ts
*/

import fs from "fs";
import { join } from "path"
import { v4 } from "uuid"
import md5 from "md5"
import http from "http"
import { EventLogger } from "./logger"
import path from "path"
import dns from "dns"
import { 
    //Window defs
    LoaderWindow, 
    WidgetWindow,
    PopupWindow,
    Window,

    popup_widget_dict,
    basic_worker_widget_dict,

    //paths
    PATH_TO_LOADER_HTML,
    PATH_TO_POPUP_HTML,
    PATH_TO_LOGS
 } from "./app_config";
import { desktopCapturer, ipcMain } from "electron";

// variables
const alphabet: string[] = 'abcdefghijklmnopqrstuvwxyz'.split('');

export class IPCwrapper{
    /*
        Class that handles the IPC communication
    */
    public window_communication_configuration: object[] = [];
    private channel_communication_configuration: object[] = [];
    private open: boolean = true;
    
    private hash_message(message: any[] | string){
        return md5(JSON.stringify(message))
    }

    private send_message_to_window(destination: string, channel: string, data: any){
        for (let i = 0; i < this.window_communication_configuration.length; i++){
            if (destination == this.window_communication_configuration[i]["win_name"]){
                this.window_communication_configuration[i]["win"].send_message(channel, data)
            }
        }
    }

    // window registering
    public register_window(window: Window, window_name: string){
        this.window_communication_configuration.push({
            "id": window.window_id,
            "win_name": window_name,
            "win": window
        })
    }

    public unregister_window(window_id: string){
        for (let i = 0; i < this.window_communication_configuration.length; i++){
            if (this.window_communication_configuration[i]["id"] == window_id){
                this.window_communication_configuration.splice(i, 1)
                break
            }
        }
    }

    // channel registering
    public register_channel(channel_name: string, sender: string[], type: string, callback: Function){
        this.channel_communication_configuration.push({
            "channel": channel_name,
            "sender": sender,
            "type": type, //accepts unidirectional or bidirectional
            "callback": callback
        })
    }

    public set_all_listeners(){
        ipcMain.handle("message", async (event, data: any[]) => {
            if (!this.open){
                return
            }

            //incoming data from windows
            var sender: string = data[0]
            var channel: string = data[1][0]
            var message_data: any = data[1].slice(1, data[1].length - 1)
            var hash: string = data[1][data[1].length - 1]

            for(let i = 0; i < this.channel_communication_configuration.length; i++){
                //data in configuration
                let desired_sender: string = this.channel_communication_configuration[i]["sender"]
                let desired_channel: string = this.channel_communication_configuration[i]["channel"]

                let desired_hash: string = "";
                if (message_data.length == 0){
                    desired_hash = this.hash_message(desired_channel)
                }
                else{desired_hash = this.hash_message(message_data)}

                for(let i_sender = 0; i_sender < desired_sender.length; i_sender++){
                    if(desired_sender[i_sender].includes(sender) && channel == desired_channel){
                        //credentials are correct
                        if (hash == desired_hash){
                            let callback: Function = this.channel_communication_configuration[i]["callback"]
                            //message is correct
                            
                            //send back acknowledge and call callback
                            this.send_ack(sender, channel)
                            callback(message_data)
                        }
                        else{
                            //message not correct -> writing into log & resend
                            this.send_nack(sender, channel)
                            console.log("not acknowledged")
                        }
                    }
                }
            }
        })
    }

    public open_channels(){this.open = true}
    public close_channels(){this.open = false}

    public send_message(destination: string, channel: string, data: any){
        this.send_message_to_window(destination, channel, data)
    }

    public broadcast(type: string, channel: string, data: any){
        //broadcast to all windows
        if (type == "all"){
            for (let i = 0; i < this.window_communication_configuration.length; i++){
                this.window_communication_configuration[i]["win"].send_message(channel, data)
            }
        }
        else if (type == "workers"){
            for (let i = 0; i < this.window_communication_configuration.length; i++){
                let win_name: string = this.window_communication_configuration[i]["win_name"]
                if (win_name.includes("worker")){
                    this.window_communication_configuration[i]["win"].send_message(channel, data)
                }
            }
        }
    }

    private send_ack(destination: string, channel: string){
        this.send_message_to_window(destination, channel + "-ack", ["ACK"])
    }

    private send_nack(destination: string, channel: string){
        this.send_message_to_window(destination, channel + "-ack", ["NACK"])
    }
}

export class ProgressiveLoader{
    /*
        Loader class used for loading any stuff in GUI (involves spawning windows too)
    */
    private loaders: any[] = [];
    private app_settings: any;
    private displays: any[]
    private load_dict: any;
    private ev_logger: EventLogger;
    public num_segments: number = 0;
    public curr_n_segments: number = 0;

    public async setup_loader(n_segments: number, loader_header: string,
        first_message: string
    ){
        this.set_loader_win()
        await this.show_loader_win()
        this.initial_set(n_segments, loader_header, first_message)
    }

    private set_loader_win(){
        //getting window info to spawn load on all monitors && initialize all loaders
        for(let i = 0; i < this.displays.length; i++){
            const [coords, display_info] = get_window_info(this.app_settings, this.displays, i, "load", this.load_dict)

            //creating loading window
            let LoadingWindow = new LoaderWindow(this.load_dict, PATH_TO_LOADER_HTML, coords, this.ev_logger, display_info)
            this.loaders.push(LoadingWindow)
        }
    }

    private async show_loader_win(){
        //showing all loaders, going to progressively send them data
        for(let i = 0; i < this.loaders.length; i++){
            this.loaders[i].show()
            await this.loaders[i].wait_for_load(() => {
                this.ev_logger.log("DEBUG", `loader${i} loaded`)
            })
        }
    }

    private initial_set(n_segments: number, loader_header: string, first_message: string){
        this.num_segments = n_segments
        for (let i = 0; i < this.loaders.length; i++){
            this.loaders[i].send_message("setup", [this.num_segments, loader_header, first_message])
        }
    }

    public send_progress(message: string){
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

function read_file_content(path: string, file_name: string){
    let map_raw = fs.readFileSync(join(path, file_name), "utf-8")
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

function generate_name(airline_names: object[], type: string): string{
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

//Main functions
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

function calculate_window_info(app_settings: object, 
                               displays: any[], 
                               idx: number, 
                               mode: string, 
                               window_dict: any = undefined){
    let x: number;
    let y: number;
    let width: number;
    let height: number;

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

function get_window_info(app_settings: object, 
                         displays: any[], 
                         idx: number, 
                         mode: string, 
                         window_dict: any = undefined){
    let win_info = calculate_window_info(app_settings,
                                         displays,
                                         idx,
                                         mode,
                                         window_dict)
    let coords = win_info.slice(0, 2)
    let display_info = win_info.slice(2, 4)
    return [coords, display_info]
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function parse_scale(scale){
    //parse scale (constant, that describes how many units is one pixel)
    let val: number = 0
    if(scale.includes("m")){
        val = parseFloat(scale.substring(0, scale.indexOf("m"))) //value is in nautical miles
    }

    return val
}

//currently not used (TODO)
function create_widget_window(path_load: string, 
                                    event_logger: EventLogger, 
                                    coords: number[], widget_workers: any[]){
    let datetimeWidgetWindow = new WidgetWindow(basic_worker_widget_dict, path_load, coords, event_logger)
    let datetime_id = generate_id()
    widget_workers.push({
        "id": datetime_id,
        "win": datetimeWidgetWindow
    })
}

function create_popup_window(app_settings: any,
                                    event_logger: EventLogger,
                                    displays: any[],
                                    type: string,
                                    channel: string,
                                    header: string,
                                    text: string){

    const [coords, display_info] = get_window_info(app_settings, displays, -1, "normal", popup_widget_dict)
    let temp_popup_window: PopupWindow = new PopupWindow(popup_widget_dict,
                                                        PATH_TO_POPUP_HTML,
                                                        coords,
                                                        event_logger,
                                                        type,
                                                        channel)
    temp_popup_window.load_popup(header, text)
    return temp_popup_window
}

function delete_logs(){
    fs.readdir(PATH_TO_LOGS, (err, files) => {
        if (err){
            console.error(err)
        }

        files.forEach((file) => {
            let abs_path = path.join(PATH_TO_LOGS, file)
            
            if (file != ".gitkeep"){
                fs.rmSync(abs_path)
            }

        })
    })
}

function readJSON(path: string){
    let file_raw = fs.readFileSync(path, "utf-8")
    let file_content = JSON.parse(file_raw)
    return file_content
}

async function ping(address: string): Promise<boolean>{
    return new Promise((resolve, reject) => {
        let url: URL;
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

// exports
const utils = {
    read_file_content,
    list_files,
    generate_hash,
    generate_id,
    generate_win_id,
    generateRandomInteger,
    generate_name,
    get_random_element,
    checkInternet,
    calculate_window_info,
    get_window_info,
    sleep,
    parse_scale,
    create_widget_window,
    create_popup_window,
    delete_logs,
    readJSON,
    ping
}

export default utils