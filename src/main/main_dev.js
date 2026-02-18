"use strict";
/*
    Main file for SEDAS app (development version)
*/
Object.defineProperty(exports, "__esModule", { value: true });
const main_preload_1 = require("./main_preload");
// read runtime args (first thing that needs to be done on app start)
const runtime_args = (0, main_preload_1.parse_args)();
// redefining runtime args into process
process.env.ABS_PATH = runtime_args["devel-path"];
process.env.DEV_MODE = "true";
process.env.SUPPRESS_OS_BRIDGE = runtime_args["suppress-os-bridge"];
console.log("Loaded ENV ARGS:");
console.log(`
    ABS_PATH: ${process.env.ABS_PATH}
    DEV_MODE: ${process.env.DEV_MODE}
    SUPPRESS_OS_BRIDGE: ${process.env.SUPPRESS_OS_BRIDGE}
`);
const main_lib_1 = require("./main_lib");
var main_app = new main_lib_1.MainApp(process.env.ABS_PATH, process.env.SUPPRESS_OS_BRIDGE);
main_app.app_instance.commandLine.appendSwitch('remote-debugging-port', '9223');
main_app.app_instance.commandLine.appendSwitch('remote-debugging-address', '127.0.0.1');
//# sourceMappingURL=main_dev.js.map