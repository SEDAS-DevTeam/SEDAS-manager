"use strict";
/*
    Main file for SEDAS app (development version)
*/
Object.defineProperty(exports, "__esModule", { value: true });
const main_preload_1 = require("./main_preload");
//read runtime args (first thing that needs to be done on app start)
const runtime_args = (0, main_preload_1.parse_args)();
process.env.ABS_PATH = runtime_args["devel_path"];
const main_lib_1 = require("./main_lib");
console.log(process.env.ABS_PATH);
var main_app = new main_lib_1.MainApp(process.env.ABS_PATH);
main_app.app_instance.commandLine.appendSwitch('remote-debugging-port', '9223');
main_app.app_instance.commandLine.appendSwitch('remote-debugging-address', '127.0.0.1');
//# sourceMappingURL=main_dev.js.map