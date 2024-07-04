import {get} from "https"
import path from "path"
import { EventLogger } from "./logger"
import { ProgressiveLoader } from "./utils"

import { createWriteStream } from 'fs'
import {
    PATH_TO_CACHE,
    PATH_TO_CONFIG
} from "./app_config"

const URL: string = "https://raw.githubusercontent.com/SEDAS-DevTeam/SEDAS-networks/main/src/"

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

export async function update_models(event_logger: EventLogger, loader: ProgressiveLoader){
    /*
    fetching for source files
    */

    //PlaneResponse (loader segment 3)
    loader.send_progress("Fetched all pilot models")

    await fetch_file_src("PlaneResponse", "voice_models.py")
    event_logger.log("DEBUG", "Fetched voice models")

    await fetch_file_src("PlaneResponse", "speech_models.py")
    event_logger.log("DEBUG", "Fetched speech models")

    await fetch_file_src("PlaneResponse", "text_models.py")
    event_logger.log("DEBUG", "Fetched text models")

    //ACAI (loader segment 4)
    loader.send_progress("Fetching ACAI models")
    
    await fetch_file_src("ACAI", "main_control.py")

    //gen_map (loader segment 5)
    loader.send_progress("Fetching terrain generation models")

    await fetch_file_src("gen_map", "main_terrain.py")

    /*
    fetching for configs (loader segment 6)
    */
    loader.send_progress("Fetching all model configurations")

    await fetch_file_conf("PlaneResponse", "speech_config.json")
    await fetch_file_conf("PlaneResponse", "text_config.json")
    await fetch_file_conf("PlaneResponse", "voice_config.json")
}