import {parentPort} from "worker_threads"
import {spawn} from "node:child_process"
import { createClient } from 'redis';

//variables
let last_value: string = "";

//redis for communication
const client = createClient()
client.connect()

//set default on start
client.set("start-voice", "false")
client.set("out-voice", "test")
client.set("in-terrain", "")
client.set("out-terrain", "")

const PATH_TO_RECOG = __dirname.substring(0, __dirname.indexOf("SEDAC") + "SEDAC".length) + "/src/res/neural/voice_recognition.py"
const PATH_TO_TERRAIN = __dirname.substring(0, __dirname.indexOf("SEDAC") + "SEDAC".length) + "/src/res/neural/generate_terrain.py"

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

const voice_process = spawn("python3", [`${PATH_TO_RECOG}`])

function gen_random_nums(n: number): string{
    let nums: string[] = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"]
    let out = ""

    for (let i = 0; i < n; i++){
        let choice: number = Math.floor(Math.random() * nums.length)
        out += nums[choice]
    }
    return out
}

async function db_check(){
    let value_voice: string = await client.get("out-voice")
    let value_terrain: string = await client.get("out-terrain")


    if (value_terrain.length != 0){
        //send to main loop
        parentPort.postMessage(value_terrain)

        client.set("out-terrain", "") //reset to default value
    }

    //check if change
    if (value_voice != last_value){
        //
        //main code for plane responses
        //
        client.set("proc-voice", value_voice)

        let message: string = "fly heading 090"
        client.set("gen-speech", message)
        //TODO:

        parentPort.postMessage(value_voice)

        last_value = value_voice
    }
    parentPort.postMessage(value_voice)
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
            voice_process.kill("SIGINT")
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