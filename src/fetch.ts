import {get} from 'https'
import { createWriteStream, unlinkSync, readdirSync, lstatSync } from 'fs'
import {join} from "path"

const PATH_TO_CACHE: string = __dirname.substring(0, __dirname.indexOf("SEDAC") + "SEDAC".length) + "/src/res/neural/cache"
const URL: string = "https://raw.githubusercontent.com/HelloWorld7894/SEDAC-networks/main/src/"

function delete_all(){
    let files: any = readdirSync(PATH_TO_CACHE)
    files.forEach(file => {
        let abs_path: string = join(PATH_TO_CACHE, file)

        if (lstatSync(abs_path).isFile() && file != ".gitkeep" && file != "__pycache__"){
            //remove cached file
            unlinkSync(abs_path)
        }
    })
}

function fetch_file(header: string, filename: string){
    var des_url: string = URL + header

    var file = createWriteStream(join(PATH_TO_CACHE, filename))
    console.log(join(des_url, filename))
    var request = get(join(des_url, filename), (response) => {
        response.pipe(file)

        file.on("finish", () => file.close())
    })
}

export function update_all(){
    delete_all()

    //PlaneResponse
    fetch_file("PlaneResponse", "voice_models.py")
    fetch_file("PlaneResponse", "speech_models.py")
    fetch_file("PlaneResponse", "text_models.py")

    //ACAI
    fetch_file("ACAI", "main_control.py")

    //gen_map
    fetch_file("gen_map", "main_terrain.py")

}