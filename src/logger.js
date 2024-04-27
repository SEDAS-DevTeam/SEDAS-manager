import { readdirSync, unlinkSync, openSync, appendFileSync } from "fs";
import path from "path";
const ABS_PATH = path.resolve("");
export class EventLogger {
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
        this.LOG_PATH = path.join(ABS_PATH, "/src/logs/app_log.txt");
        if (this.debug_mode) {
            let time = this.get_time();
            console.log(`[${time}]`, "(DEBUG)", "Initialized event logger with DEBUGGING=TRUE");
        }
        //create log file
        let files = readdirSync(path.join(ABS_PATH, "/src/logs"));
        if (files.includes("app_log.txt")) {
            unlinkSync(this.LOG_PATH);
        }
        openSync(this.LOG_PATH, "w");
        appendFileSync(this.LOG_PATH, "#########################################\n");
        appendFileSync(this.LOG_PATH, "SEDAC manager v1.0.0 Linux 64-bit version\n"); //TODO: different outputs for different OSes!
        appendFileSync(this.LOG_PATH, "#########################################\n");
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
        appendFileSync(this.LOG_PATH, output + "\n");
    }
}
//# sourceMappingURL=logger.js.map