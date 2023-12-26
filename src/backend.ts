import {parentPort} from "worker_threads"
import {spawn} from "node:child_process"
import { createClient } from 'redis';

//variables
var last_value_voice: string = "";
var last_value_command: string = "";
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
const client = createClient()
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

/*CLASSES*/
class Acai {
    private name: string;

    public constructor(name: string){
        this.name = name;
    }
}

class TerrainGeneration {
    public gen_terrain(seed: string): void{
        const generation_process = spawn("python3", [`${PATH_TO_TERRAIN}`])
        client.set("in-terrain", seed)
    }
}

/*OBJECTS*/
const event_gen = new Acai("balls")
const terrain_gen = new TerrainGeneration()

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

        client.set("out-terrain", "") //reset to default value
    }

    //check if voice change
    if (value_voice != last_value_voice){
        //process voice data
        client.set("proc-voice", value_voice)

        last_value_voice = value_voice
    }

    //check if command change
    if (value_command != last_value_command){
        //process command data & generate speech
        var message: string = command_processor(value_command)
        client.set("gen-speech", message)

        parentPort.postMessage(value_command) //post to main process for updates
        last_value_command = value_command
    }
}

parentPort.on("message", async (message) => {
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
            core_process.kill("SIGINT")
            break
        case "terrain":
            //for test

            let seed = gen_random_nums(16)
            terrain_gen.gen_terrain(seed) //generate terrain 
            //parentPort.postMessage(out)
            break
        case "acai":
            break
    }
})

client.on('error', err => console.log('Redis Client Error', err));

setInterval(db_check, 1000)