"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var worker_threads_1 = require("worker_threads");
var node_child_process_1 = require("node:child_process");
var process;
var PATH_TO_PROCESS = __dirname.substring(0, __dirname.indexOf("SEDAC") + "SEDAC".length) + "/src/res/neural/test.py";
console.log(PATH_TO_PROCESS);
worker_threads_1.parentPort.on("message", function (message) {
    console.log(message);
    switch (message) {
        case "start":
            //going to start recognition
            process = (0, node_child_process_1.spawn)("python3", ["".concat(PATH_TO_PROCESS)]);
            process.stdout.on('data', function (data) {
                console.log("stdout: ".concat(data));
            });
            break;
        case "stop":
            break;
    }
    //parentPort.postMessage("I am alive")
});
