import {get} from 'https'
import path from "path"

import { createWriteStream } from 'fs'

const ABS_PATH = path.resolve("")
const PATH_TO_CACHE: string = path.join(ABS_PATH, "/src/res/neural/alg_cache")
const PATH_TO_CONFIG: string = path.join(ABS_PATH, "/src/res/data/alg/")

const URL: string = "https://raw.githubusercontent.com/HelloWorld7894/SEDAC-networks/main/src/"

async function fetch_file_src(header: string, filename: string){
    return new Promise<void>(resolve => {
        var des_url: string = URL + header

        var file = createWriteStream(path.join(PATH_TO_CACHE, filename))
        var request = get(path.join(des_url, filename), (response) => {
            response.pipe(file)

            file.on("finish", () => {
                file.close()
                resolve()
            })
        })
    })
}

async function fetch_file_conf(header: string, filename: string){
    return new Promise<void>(resolve => {
        var des_url: string = URL + header

        var file = createWriteStream(path.join(PATH_TO_CONFIG, filename))
        var request = get(path.join(des_url, filename), (response) => {
            response.pipe(file)

            file.on("finish", () => {
                file.close()
                resolve()
            })
        })
    })
}

export async function update_all(event_logger: any){
    /*
    fetching for source files
    */

    //PlaneResponse
    await fetch_file_src("PlaneResponse", "voice_models.py")
    event_logger.add_record("DEBUG", "Fetched voice models")

    await fetch_file_src("PlaneResponse", "speech_models.py")
    event_logger.add_record("DEBUG", "Fetched speech models")

    await fetch_file_src("PlaneResponse", "text_models.py")
    event_logger.add_record("DEBUG", "Fetched text models")

    //ACAI
    await fetch_file_src("ACAI", "main_control.py")

    //gen_map
    await fetch_file_src("gen_map", "main_terrain.py")

    /*
    fetching for configs
    */

    await fetch_file_conf("PlaneResponse", "speech_config.json")
    await fetch_file_conf("PlaneResponse", "text_config.json")
    await fetch_file_conf("PlaneResponse", "voice_config.json")
}