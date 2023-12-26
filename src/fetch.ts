import {get} from 'https'
import { createWriteStream, unlinkSync, readdirSync, lstatSync } from 'fs'
import {join} from "path"

const PATH_TO_CACHE: string = __dirname.substring(0, __dirname.indexOf("SEDAC") + "SEDAC".length) + "/src/res/neural/cache"
const PATH_TO_CONFIG: string = __dirname.substring(0, __dirname.indexOf("SEDAC") + "SEDAC".length) + "/src/res/alg_data"

const URL: string = "https://raw.githubusercontent.com/HelloWorld7894/SEDAC-networks/main/src/"

function delete_src(){
    let files: any = readdirSync(PATH_TO_CACHE)
    files.forEach(file => {
        let abs_path: string = join(PATH_TO_CACHE, file)

        if (lstatSync(abs_path).isFile() && file != ".gitkeep" && file != "__pycache__"){
            //remove cached file
            unlinkSync(abs_path)
        }
    })
}

function fetch_file_src(header: string, filename: string){
    var des_url: string = URL + header

    var file = createWriteStream(join(PATH_TO_CACHE, filename))
    console.log(join(des_url, filename))
    var request = get(join(des_url, filename), (response) => {
        response.pipe(file)

        file.on("finish", () => file.close())
    })
}

/*
############################################################
*/

function delete_conf(){
    let files: any = readdirSync(PATH_TO_CONFIG)
    files.forEach(file => {
        let abs_path: string = join(PATH_TO_CACHE, file)

        if (lstatSync(abs_path).isFile() && file != ".gitkeep"){
            //remove cached file
            unlinkSync(abs_path)
        }
    })
}

function fetch_file_conf(header: string, filename: string){
    var des_url: string = URL + header

    var file = createWriteStream(join(PATH_TO_CONFIG, filename))
    console.log(join(des_url, filename))
    var request = get(join(des_url, filename), (response) => {
        response.pipe(file)

        file.on("finish", () => file.close())
    })
}

export function update_all(){
    /*
    fetching for source files
    */
    delete_src()

    //PlaneResponse
    fetch_file_src("PlaneResponse", "voice_models.py")
    fetch_file_src("PlaneResponse", "speech_models.py")
    fetch_file_src("PlaneResponse", "text_models.py")

    //ACAI
    fetch_file_src("ACAI", "main_control.py")

    //gen_map
    fetch_file_src("gen_map", "main_terrain.py")

    /*
    fetching for configs
    */
    delete_conf()

    fetch_file_conf("PlaneResponse", "speech_config.json")
    fetch_file_conf("PlaneResponse", "text_config.json")
    fetch_file_conf("PlaneResponse", "voice_config.json")
}