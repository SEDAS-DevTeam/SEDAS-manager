//file for reading .smmr (sedac manager map resource) extensions which contain map data

import * as fs from "fs";

const PATH_TO_PROCESS = __dirname.substring(0, __dirname.indexOf("SEDAC") + "SEDAC".length) + "/src/res/maps/"

export function read_map_from_file(file_name){
    const map = fs.readFileSync(PATH_TO_PROCESS + file_name, 'utf-8');
    var newline_arr = map.split("\r\n")
    for (let i = 0; i < newline_arr.length; i++){
        console.log(newline_arr[i])
    }
}

export function generate_map(){
    console.log("TODO")
}