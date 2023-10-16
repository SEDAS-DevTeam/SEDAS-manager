import {parentPort} from "worker_threads"
import {spawn} from "node:child_process"
import { createClient } from 'redis';

//redis for communication
const client = createClient()
client.connect()

const PATH_TO_PROCESS = __dirname.substring(0, __dirname.indexOf("SEDAC") + "SEDAC".length) + "/src/res/neural/generate_terrain.py"

async function db_check(){
    let value: string = await client.get("out-terrain")
    if (value.length != 0){
        //send to main loop
        parentPort.postMessage(value)

        client.set("out-terrain", "") //reset to default value
    }
}

function gen_random_nums(n: number): string{
    let nums: string[] = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"]
    let out = ""

    for (let i = 0; i < n; i++){
        let choice: number = Math.floor(Math.random() * nums.length)
        out += nums[choice]
    }
    return out
}

class Acai {
    private name: string;

    public constructor(name: string){
        this.name = name;
    }
}

class TerrainGeneration {
    public gen_terrain(seed: string): string{
        const generation_process = spawn("python3", [`${PATH_TO_PROCESS}`])
        client.set("in-terrain", seed)

        return "balls"
    }
}

/*OBJECTS*/
const event_gen = new Acai("balls")
const terrain_gen = new TerrainGeneration()

parentPort.on("message", (message) => {
    switch(message){
        case "terrain":
            //for test

            let seed = gen_random_nums(16)
            let out = terrain_gen.gen_terrain(seed) //generate terrain 
            //parentPort.postMessage(out)
            break
        case "acai":
            break
    }
})

client.on('error', err => console.log('Redis Client Error', err));

setInterval(db_check, 1000)