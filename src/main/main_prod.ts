/*
    Main file for SEDAS app (production version)
*/

import { parse_args } from "./main_preload"
import { resolve } from "path";

//read runtime args (first thing that needs to be done on app start)
const runtime_args: Record<string, string> = parse_args()
process.env.ABS_PATH = resolve("")

import { MainApp } from "./main_lib";

// TODO:
// process.env.ABS_PATH = (runtime_args["devel_path"] != undefined) ? runtime_args["devel_path"] : resolve("")