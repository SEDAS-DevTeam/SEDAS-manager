import {get} from 'https'
import { promisify } from "util"

import { createWriteStream, readdir, lstat, unlink } from 'fs'
import {join} from "path"

const readdir_async = promisify(readdir)
const lstat_async = promisify(lstat)
const unlink_async = promisify(unlink)

const PATH_TO_CACHE: string = __dirname.substring(0, __dirname.indexOf("SEDAC") + "SEDAC".length) + "/src/res/neural/alg_cache"
const PATH_TO_CONFIG: string = __dirname.substring(0, __dirname.indexOf("SEDAC") + "SEDAC".length) + "/src/res/alg_data"

const URL: string = "https://raw.githubusercontent.com/HelloWorld7894/SEDAC-networks/main/src/"

async function delete_src(){
    let files: any = await readdir_async(PATH_TO_CACHE)
    files.forEach(async file => {
        let abs_path: string = join(PATH_TO_CACHE, file)

        let spec_file: any = await lstat_async(abs_path)
        if (await spec_file.isFile() && file != ".gitkeep" && file != "__pycache__"){
            //remove cached file
            await unlink_async(abs_path)
        }
    })
}

async function fetch_file_src(header: string, filename: string){
    var des_url: string = URL + header

    var file = createWriteStream(join(PATH_TO_CACHE, filename))
    console.log(join(PATH_TO_CACHE, filename))
    var request = get(join(des_url, filename), (response) => {
        response.pipe(file)

        file.on("finish", () => file.close())
    })
}

/*
############################################################
*/

async function delete_conf(){
    let files: any = await readdir_async(PATH_TO_CONFIG)

    files.forEach(async file => {
        let abs_path: string = join(PATH_TO_CONFIG, file)

        let spec_file: any = await lstat_async(abs_path)
        if (spec_file.isFile() && file != ".gitkeep"){
            //remove cached file
            await unlink_async(abs_path)
        }
    })
}

async function fetch_file_conf(header: string, filename: string){
    var des_url: string = URL + header

    var file = createWriteStream(join(PATH_TO_CONFIG, filename), { 
        flags: 'w'
    })
    var request = get(join(des_url, filename), (response) => {
        response.pipe(file)

        file.on("finish", () => file.close())
    })
}

export async function update_all(event_logger: any){
    /*
    fetching for source files
    */
    await delete_src()
    event_logger.add_record("DEBUG", "Deleted cached files")

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
    await delete_conf()

    await fetch_file_conf("PlaneResponse", "speech_config.json")
    await fetch_file_conf("PlaneResponse", "text_config.json")
    await fetch_file_conf("PlaneResponse", "voice_config.json")
}