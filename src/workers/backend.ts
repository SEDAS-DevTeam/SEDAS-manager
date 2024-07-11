import {parentPort} from "worker_threads"
import {spawn} from "node:child_process"
import net from "net"
import fs from "fs";
import path from "path";
import {
    ABS_PATH,
    PATH_TO_SETTINGS
} from "../app_config"

const PORT = 36000

const QUERY_TIMEOUT: number = 10

//read JSON
const app_settings_raw = fs.readFileSync(PATH_TO_SETTINGS, "utf-8")
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

function command_processor(command_args: string[]){
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

const PATH_TO_TERRAIN: string = path.join(ABS_PATH, "/src/res/neural/generate_terrain.py")
const PATH_TO_CORE: string = path.join(ABS_PATH, "/src/res/neural/core.py")

const core_server = net.createServer((socket) => {
    console.log('Client connected');

    // Handle data received from the client
    socket.on('data', (data: Buffer) => {
        let data_str: string = data.toString()
        console.log(data_str)
    
        let value_command = data_str.split(":");
        switch(value_command[0]){
            case "data":
                //check if plane exists
                let exists: boolean = false
                var args = value_command[1].split(" ")
                for (let i = 0; i < args.length; i++){
                    //strip input string of useless spaces
                    if (args[i].length == 0){
                        args.splice(i, 1)
                    }
                }
                var callsign = args[0]

                for (let i = 0; i < plane_data.length; i++){
                    if (plane_data[i].callsign == callsign){
                        exists = true
                        break
                    }
                }
                
                if (exists){
                    var message: string = command_processor(args)

                    //send message to generate speech
                    socket.write(`data-for-speech: ${message}\n`)
    
                    parentPort.postMessage("command:" + args.join(" ")) //post to main process for updates
                }
                break
            case "debug":
                console.log(value_command[1])
                break
        }
    });

    parentPort.on("message", async (message) => {
        if (Array.isArray(message)){
            switch(message[0]){
                //command messages with args
                case "debug":
                    logging = message[1]
                    break
                case "action":
                    switch(message[1]){
                        case "start-neural":
                            socket.write('action: start-neural\n')
                            break
                        case "stop-neural":
                            socket.write('action: stop-neural\n')
                            break
                        case "terrain":
                            console.log("terrain not working :(")
                            break
                        case "stop":
                            break
                        case "interrupt":
                            parentPort.postMessage("debug: SIGINT for core.py")
                            core_server.close()
                            core_process.kill()

                        //passing settings to backend process
                        case "settings":
                            socket.write(`settings ${message[2]}`)
                            break
                    }
                //data messages
                case "data":
                    plane_data = message[1]
                    break
            }
        }
    })

    // Handle client disconnect
    socket.on('end', () => {
        console.log('Client disconnected');
    });
});

const core_process = spawn("python3", [PATH_TO_CORE])

core_server.listen(PORT, '127.0.0.1', () => {
    console.log('Server listening on 127.0.0.1');
});