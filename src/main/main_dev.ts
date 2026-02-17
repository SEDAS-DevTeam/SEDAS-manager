/*
    Main file for SEDAS app (development version)
*/

import { parse_args } from "./main_preload";

// read runtime args (first thing that needs to be done on app start)
const runtime_args: Record<string, string> = parse_args()

// redefining runtime args into process
process.env.ABS_PATH = runtime_args["devel-path"]
process.env.DEV_MODE = "true"
process.env.SUPPRESS_OS_BRIDGE = runtime_args["suppress-os-bridge"]

console.log("Loaded ENV ARGS:")
console.log(`
    ABS_PATH: ${process.env.ABS_PATH}
    DEV_MODE: ${process.env.DEV_MODE}
    SUPPRESS_OS_BRIDGE: ${process.env.SUPPRESS_OS_BRIDGE}
`)

import { MainApp } from "./main_lib";

var main_app = new MainApp(process.env.ABS_PATH)

main_app.app_instance.commandLine.appendSwitch('remote-debugging-port', '9223');
main_app.app_instance.commandLine.appendSwitch('remote-debugging-address', '127.0.0.1');