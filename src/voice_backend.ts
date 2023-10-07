import {parentPort} from "worker_threads"
import {spawn} from "node:child_process"

var process: any
var start: boolean = false;
var PATH_TO_PROCESS = __dirname.substring(0, __dirname.indexOf("SEDAC") + "SEDAC".length) + "/src/res/neural/test.py"

//recognition script init
process = spawn("python3", [`${PATH_TO_PROCESS}`])

parentPort.on("message", (message) => {
    switch(message){
        case "start":
            //going to start recognition
            process.stdin.write("start\n")

            console.log("recognition start")
            break
        case "stop":
            //going to stop recognition
            process.stdin.write("stop\n")
            break
    }
})

process.stdout.on("data", (data) => {
    console.log("data " + data.toString())
})

process.stderr.on('data', (data) => {
    console.error(`stderr: ${data}`);
});