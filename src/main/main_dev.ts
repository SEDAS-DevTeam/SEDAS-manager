/*
    Main file for SEDAS app (development version)
*/

import { parse_args } from "./main_preload";

//read runtime args (first thing that needs to be done on app start)
const runtime_args: Record<string, string> = parse_args()
process.env.ABS_PATH = runtime_args["devel_path"]
process.env.DEV_MODE = "true"

import { MainApp } from "./main_lib";

console.log(process.env.ABS_PATH)
var main_app = new MainApp(process.env.ABS_PATH)

main_app.app_instance.commandLine.appendSwitch('remote-debugging-port', '9223');
main_app.app_instance.commandLine.appendSwitch('remote-debugging-address', '127.0.0.1');