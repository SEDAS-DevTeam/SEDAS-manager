"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var worker_threads_1 = require("worker_threads");
var node_child_process_1 = require("node:child_process");
var process;
var start = false;
var PATH_TO_PROCESS = __dirname.substring(0, __dirname.indexOf("SEDAC") + "SEDAC".length) + "/src/res/neural/test.py";
//recognition script init
process = (0, node_child_process_1.spawn)("python3", ["".concat(PATH_TO_PROCESS)]);
worker_threads_1.parentPort.on("message", function (message) {
    switch (message) {
        case "start":
            //going to start recognition
            process.stdin.write("start\n");
            console.log("recognition start");
            break;
        case "stop":
            //going to stop recognition
            process.stdin.write("stop\n");
            break;
    }
});
process.stdout.on("data", function (data) {
    console.log("data " + data.toString());
});
process.stderr.on('data', function (data) {
    console.error("stderr: ".concat(data));
});
