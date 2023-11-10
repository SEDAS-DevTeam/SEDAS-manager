//file for reading .smmr (sedac manager map resource) extensions which contain map data

import * as fs from "fs";

const PATH_TO_PROCESS = __dirname.substring(0, __dirname.indexOf("SEDAC") + "SEDAC".length) + "/src/res/maps/"

export function read_map_from_file(file_name){
    const map_encoded = fs.readFileSync(PATH_TO_PROCESS + file_name, 'utf-8');
    console.log(map_encoded);
}

export function generate_map(){
    console.log("TODO")
}