"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EventLogger = void 0;
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
    constructor(debug) {
        this.debug_mode = debug;
        if (this.debug_mode) {
            let time = this.get_time();
            console.log(`[${time}]`, "(DEBUG)", "Initialized event logger with DEBUGGING=TRUE");
        }
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
    log(cat_name, messages) {
        //messages is an array where first element is standard logging message followed by non-standard
        //debug mode message
        if (!this.debug_mode) {
            console.log(messages[0]); //for standard logging without debug mode
        }
        this.add_record(cat_name, messages[1]);
    }
    add_record(cat_name, content) {
        let time = this.get_time();
        this.data.push({
            time: time,
            cat: cat_name,
            content: content
        });
        //log to terminal if debug mode
        if (this.debug_mode) {
            console.log(`[${time}]`, `(${cat_name})`, `${content}`);
        }
    }
    filter(cat_name) {
        let out_data = [];
        for (let i = 0; i < this.data.length; i++) {
            if (this.data[i].cat == cat_name) {
                out_data.push(this.data[i]);
            }
        }
        return out_data;
    }
}
exports.EventLogger = EventLogger;
//# sourceMappingURL=logger.js.map