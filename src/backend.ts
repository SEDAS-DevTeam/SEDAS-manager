import {parentPort} from "worker_threads"
import {spawn} from "node:child_process"
import { createClient } from 'redis';
import fs from "fs";
import path from "path";

const ABS_PATH = path.resolve("")

const QUERY_TIMEOUT: number = 10

//read JSON
const app_settings_raw = fs.readFileSync(path.join(ABS_PATH, "/src/res/data/settings.json"), "utf-8")
const app_settings = JSON.parse(app_settings_raw);

//variables
var last_value_voice: string = "";
var last_value_command: string = "";

//debug messages: core, text, voice, speech
var last_debug_messages: string[] = ["", "", "", ""]

var plane_data = []
var logging: boolean = undefined
var current_query_timeout: number = 0

const NATO_ALPHA = {
    "A": "alpha",
    "B": "beta",
    "C": "charlie",
    "D": "delta",
    "E": "echo",
    "F": "foxtrot",
    "G": "golf",
    "H": "hotel",
    "I": "india",
    "J": "juliet",
    "K": "kilo",
    "L": "lima",
    "M": "mike",
    "N": "november",
    "O": "oscar",
    "P": "papa",
    "Q": "quebec",
    "R": "romeo",
    "S": "sierra",
    "T": "tango",
    "U": "uniform",
    "V": "victor",
    "W": "whiskey",
    "X": "x-ray",
    "Y": "yankee",
    "Z": "zulu"
}
const NUMS = {
    "0": "zero",
    "1": "one",
    "2": "two",
    "3": "three",
    "4": "four",
    "5": "five",
    "6": "six",
    "7": "seven",
    "8": "eight",
    "9": "niner"
}

//redis for communication
const client = createClient({
    socket: {
        host: "127.0.0.1",
        port: app_settings["port"]
    }
})
client.connect()

//set default on start
client.set("start-voice", "false")
client.set("terminate", "false") //used by core.py when terminating all threads
client.set("gen-speech", "")
client.set("proc-voice", "")
client.set("out-voice", "")
client.set("in-terrain", "")
client.set("out-terrain", "")
client.set("proc-voice-out", "")

const PATH_TO_TERRAIN = __dirname.substring(0, __dirname.indexOf("SEDAC") + "SEDAC".length) + "/src/res/neural/generate_terrain.py"
const PATH_TO_CORE = __dirname.substring(0, __dirname.indexOf("SEDAC") + "SEDAC".length) + "/src/res/neural/core.py"

client.on('error', err => console.log('Redis Client Error', err));

setInterval(db_check, 1000)
setInterval(debug_check, 100)

const core_process = spawn("python3", [PATH_TO_CORE])

function gen_random_nums(n: number): string{
    let nums: string[] = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"]
    let out = ""

    for (let i = 0; i < n; i++){
        let choice: number = Math.floor(Math.random() * nums.length)
        out += nums[choice]
    }
    return out
}

function delay(ms: number) {
    return new Promise( resolve => setTimeout(resolve, ms) );
}

function command_processor(command_text: string){
    let command_args = command_text.split(" ")
    let response: string = ""

    //translate plane name back from nato
    let trans_plane_name: string = ""
    for (let i = 0; i < command_args[0].length; i++){
        if (NATO_ALPHA[command_args[0][i]] == undefined){
            trans_plane_name += `${NUMS[command_args[0][i]]} `
        }
        else{
            trans_plane_name += `${NATO_ALPHA[command_args[0][i]]} `
        }
    }

    //check commands
    switch (command_args[1]){
        case "change-heading":
            if (command_args[2].length == 2){
                command_args[2] = "0" + command_args[2]
            }

            //translate updated heading
            let trans_heading: string = ""
            for (let i = 0; i < command_args[2].length; i++){
                trans_heading += `${NUMS[command_args[2][i]]} `
            }

            response = `Fly heading ${trans_heading}, ${trans_plane_name}`
            break
    }

    return response
}

async function db_check(){
    let value_voice: string = await client.get("out-voice")
    let value_terrain: string = await client.get("out-terrain")
    let value_command: string = await client.get("proc-voice-out")

    if (value_terrain.length != 0){
        //send to main loop
        parentPort.postMessage(value_terrain)
        parentPort.postMessage("debug: Generated terrain seed")

        client.set("out-terrain", "") //reset to default value
    }

    //check if voice change
    if (value_voice != last_value_voice){
        parentPort.postMessage(`debug: voice change, got: ${value_voice}`)

        //process voice data
        client.set("proc-voice", value_voice)
        parentPort.postMessage("debug: set voice for processing")

        last_value_voice = value_voice
    }

    //check if command change
    if (value_command != last_value_command){
        //process command data & generate speech

        if (current_query_timeout == QUERY_TIMEOUT){
            value_command = last_value_command
            parentPort.postMessage("debug: QUERY TIMEOUT")
        }

        if (current_query_timeout == 0){ //only once
            parentPort.postMessage("debug: command change, processing command")
        }

        //check if plane exists
        let exists: boolean = false
        var callsign = value_command.split(" ")[0]
        for (let i = 0; i < plane_data.length; i++){
            if (plane_data[i].callsign == callsign){
                exists = true
                break
            }
        }
        
        if (exists){
            var message: string = command_processor(value_command)
            client.set("gen-speech", message)

            parentPort.postMessage("command: " + value_command) //post to main process for updates
            last_value_command = value_command
        }
        else{
            current_query_timeout += 1
        }
    }
}

async function debug_check(){
    let debug_core: string = await client.get("debug-core")
    let debug_text: string = await client.get("debug-text-model")
    let debug_speech: string = await client.get("debug-speech-model")
    let debug_voice: string = await client.get("debug-voice-model")

    let all_debug_messages: string[] = [debug_core, debug_text, debug_speech, debug_voice]
    for (let i = 0; i < all_debug_messages.length; i++){
        if (all_debug_messages[i] != null && all_debug_messages[i] != last_debug_messages[i]){
            parentPort.postMessage("debug: " + all_debug_messages[i])
            last_debug_messages[i] = all_debug_messages[i]
        }
    }
}


parentPort.on("message", async (message) => {
    if (Array.isArray(message)){
        switch(message[0]){
            //command messages with args
            case "debug":
                logging = message[1]
                break
            //data messages
            default:
                plane_data = message[1]
                break
        }
    }

    //command messages without args
    switch(message){
        case "start":
            //going to start recognition
            client.set("start-voice", "true")
            break
        case "stop":
            //going to stop recognition
            client.set("start-voice", "false")

            //reset all values
            client.set("out-voice", "test")
            break
        case "interrupt":
            client.set("terminate", "true")

            parentPort.postMessage("debug: SIGINT for core.py")

            delay(5000)

            core_process.kill("SIGINT") //killing core.py

            break
        case "terrain":
            //for test

            let seed = gen_random_nums(16)
            break
        case "acai":
            break
    }
})