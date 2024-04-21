"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EventLogger = void 0;
const fs_1 = require("fs");
const path_1 = __importDefault(require("path"));
const ABS_PATH = path_1.default.resolve("");
class EventLogger {
    /*
    data will be processed in format:
    data = [{
        time: "HH:MM:SS", //time of init
        cat: "ACAI"/"DEBUG"/"ERROR"/"DEBUG-GUI"/"SCENE", //category for preprocess
        content: "1 object logged" //content for more info
    }]
    */
    data = [];
    debug_mode = undefined;
    LOG_PATH = "";
    constructor(debug) {
        this.debug_mode = debug;
        this.LOG_PATH = path_1.default.join(ABS_PATH, "/src/logs/app_log.txt");
        if (this.debug_mode) {
            let time = this.get_time();
            console.log(`[${time}]`, "(DEBUG)", "Initialized event logger with DEBUGGING=TRUE");
        }
        //create log file
        let files = (0, fs_1.readdirSync)(path_1.default.join(ABS_PATH, "/src/logs"));
        if (files.includes("app_log.txt")) {
            (0, fs_1.unlinkSync)(this.LOG_PATH);
        }
        (0, fs_1.openSync)(this.LOG_PATH, "w");
        (0, fs_1.appendFileSync)(this.LOG_PATH, "#########################################\n");
        (0, fs_1.appendFileSync)(this.LOG_PATH, "SEDAC manager v1.0.0 Linux 64-bit version\n"); //TODO: different outputs for different OSes!
        (0, fs_1.appendFileSync)(this.LOG_PATH, "#########################################\n");
    }
    get_time() {
        let date_obj = new Date();
        let hours = date_obj.getHours().toString();
        let mins = date_obj.getMinutes().toString();
        let seconds = date_obj.getSeconds().toString();
        if (hours.length != 2) {
            hours = "0" + date_obj.getHours().toString();
        }
        if (mins.length != 2) {
            mins = "0" + date_obj.getMinutes().toString();
        }
        if (seconds.length != 2) {
            seconds = "0" + date_obj.getSeconds().toString();
        }
        return `${hours}:${mins}:${seconds}`;
    }
    log(cat_name, message) {
        //messages is an array where first element is standard logging message followed by non-standard
        //debug mode message
        let time = this.get_time();
        this.data.push({
            time: time,
            cat: cat_name,
            content: message
        });
        let output = `[${time}] (${cat_name}) ${message}`;
        if (this.debug_mode) {
            console.log(output);
        }
        //log to main log file
        (0, fs_1.appendFileSync)(this.LOG_PATH, output + "\n");
    }
}
exports.EventLogger = EventLogger;
//# sourceMappingURL=logger.js.map