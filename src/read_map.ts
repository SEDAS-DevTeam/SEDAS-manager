//file for reading .smmr (sedac manager map resource) extensions which contain map data

import * as fs from "fs";

const PATH_TO_FILES = __dirname.substring(0, __dirname.indexOf("SEDAC") + "SEDAC".length) + "/src/res/maps/"

export function read_map_from_file(file_name){
    let map_raw = fs.readFileSync(PATH_TO_FILES + file_name, "utf-8")
    return JSON.parse(map_raw);
}

export function list_map_files(){
    var files = fs.readdirSync(PATH_TO_FILES)

    let idx_gitkeep = files.indexOf(".gitkeep")
    if (idx_gitkeep != -1){
        files.splice(idx_gitkeep, 1)
    }
    let idx_readme = files.indexOf("README.md")
    if (idx_readme != -1){
        files.splice(idx_readme, 1)
    }
    return files
}