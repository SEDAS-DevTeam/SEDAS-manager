"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var worker_threads_1 = require("worker_threads");
var SpeechRecognition = /** @class */ (function () {
    function SpeechRecognition(name) {
        this.name = name;
    }
    SpeechRecognition.prototype.test = function () {
        console.log(this.name);
    };
    return SpeechRecognition;
}());
var Acai = /** @class */ (function () {
    function Acai(name) {
        this.name = name;
    }
    return Acai;
}());
var TerrainGeneration = /** @class */ (function () {
    function TerrainGeneration(name) {
        this.name = name;
    }
    return TerrainGeneration;
}());
/*OBJECTS*/
var speech_rec = new SpeechRecognition("balls");
var event_gen = new Acai("balls");
var terrain_gen = new TerrainGeneration("balls");
console.log("Check did not arrive");
worker_threads_1.parentPort.on("message", function (message) {
    console.log(message);
    worker_threads_1.parentPort.postMessage("I am alive");
});
