"use strict";
/*
    Main file for SEDAS app (production version)
*/
Object.defineProperty(exports, "__esModule", { value: true });
//read runtime args (first thing that needs to be done on app start)
const runtime_args = (0, main_lib_1.parse_args)();
process.env.ABS_PATH = (0, path_1.resolve)("");
// TODO: check if this would work
const main_lib_1 = require("./main_lib");
const path_1 = require("path");
// TODO:
// process.env.ABS_PATH = (runtime_args["devel_path"] != undefined) ? runtime_args["devel_path"] : resolve("")
