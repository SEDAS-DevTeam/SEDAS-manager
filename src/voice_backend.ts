import {parentPort} from "worker_threads"
import {spawn} from "node:child_process"

var process;
var PATH_TO_PROCESS = __dirname.substring(0, __dirname.indexOf("SEDAC") + "SEDAC".length) + "/src/res/neural/test.py"
console.log(PATH_TO_PROCESS)

parentPort.on("message", (message) => {
    console.log(message)

    switch(message){
        case "start":
            //going to start recognition
            process = spawn("python3", [`${PATH_TO_PROCESS}`])
            process.stdout.on('data', (data) => {
                console.log(`stdout: ${data}`);
            });
            break
        case "stop":
            break
    }

    //parentPort.postMessage("I am alive")
})