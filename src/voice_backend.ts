import {parentPort} from "worker_threads"
import {spawn} from "node:child_process"
import { createClient } from 'redis';

//redis for communication
const client = createClient()
client.connect()

client.set("start-voice", "false") //set default on start

var start: boolean = false;
var PATH_TO_PROCESS = __dirname.substring(0, __dirname.indexOf("SEDAC") + "SEDAC".length) + "/src/res/neural/voice_recognition.py"

const voice_process = spawn("python3", [`${PATH_TO_PROCESS}`])

async function db_check(){
    let value: string = await client.get("out-voice")

    //send to main loop
    parentPort.postMessage(value)
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
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
            break
        case "interrupt":
            voice_process.kill("SIGINT")
            break
    }
})

voice_process.stdout.on('data', (data) => {
    console.error(`stdout: ${data}`);
});

client.on('error', err => console.log('Redis Client Error', err));

setInterval(db_check, 1000)