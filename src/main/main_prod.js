"use strict";
/*
    Main file for SEDAS app (production version)
*/
Object.defineProperty(exports, "__esModule", { value: true });
const main_preload_1 = require("./main_preload");
const path_1 = require("path");
//read runtime args (first thing that needs to be done on app start)
const runtime_args = (0, main_preload_1.parse_args)();
process.env.ABS_PATH = (0, path_1.resolve)("");
process.env.DEV_MODE = "false";
// TODO:
// process.env.ABS_PATH = (runtime_args["devel_path"] != undefined) ? runtime_args["devel_path"] : resolve("")
//# sourceMappingURL=main_prod.js.map