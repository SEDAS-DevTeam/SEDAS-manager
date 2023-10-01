"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.terrain_gen = exports.event_gen = exports.speech_rec = void 0;
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
exports.speech_rec = speech_rec;
var event_gen = new Acai("balls");
exports.event_gen = event_gen;
var terrain_gen = new TerrainGeneration("balls");
exports.terrain_gen = terrain_gen;
