/*
    Main file for SEDAS app (production version)
*/

//read runtime args (first thing that needs to be done on app start)
const runtime_args: Record<string, string> = parse_args()
process.env.ABS_PATH = resolve("")

// TODO: check if this would work
import { parse_args } from "./main_lib";
import { resolve } from "path";

// TODO:
// process.env.ABS_PATH = (runtime_args["devel_path"] != undefined) ? runtime_args["devel_path"] : resolve("")