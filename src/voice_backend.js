"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const worker_threads_1 = require("worker_threads");
const node_child_process_1 = require("node:child_process");
const redis_1 = require("redis");
//redis for communication
const client = (0, redis_1.createClient)();
client.connect();
client.set("start-voice", "false"); //set default on start
var process;
var start = false;
var PATH_TO_PROCESS = __dirname.substring(0, __dirname.indexOf("SEDAC") + "SEDAC".length) + "/src/res/neural/test.py";
process = (0, node_child_process_1.spawn)("python3", [`${PATH_TO_PROCESS}`]);
async function db_check() {
    let value = await client.get("out-voice");
    console.log(value);
}
worker_threads_1.parentPort.on("message", async (message) => {
    switch (message) {
        case "start":
            //going to start recognition
            client.set("start-voice", "true");
            console.log("recognition start");
            break;
        case "stop":
            //going to stop recognition
            client.set("start-voice", "false");
            break;
    }
});
client.on('error', err => console.log('Redis Client Error', err));
setInterval(db_check, 1000);
//# sourceMappingURL=voice_backend.js.map