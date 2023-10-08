"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const worker_threads_1 = require("worker_threads");
class SpeechRecognition {
    constructor(name) {
        this.name = name;
    }
    test() {
        console.log(this.name);
    }
}
class Acai {
    constructor(name) {
        this.name = name;
    }
}
class TerrainGeneration {
    constructor(name) {
        this.name = name;
    }
}
/*OBJECTS*/
const speech_rec = new SpeechRecognition("balls");
const event_gen = new Acai("balls");
const terrain_gen = new TerrainGeneration("balls");
worker_threads_1.parentPort.on("message", (message) => {
    console.log(message);
    worker_threads_1.parentPort.postMessage("I am alive");
});
//# sourceMappingURL=controller_backend.js.map