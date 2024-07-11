import {parentPort} from "worker_threads"
import path from "path"
import fs from "fs"
import {
    PATH_TO_DATABASE,
    ABS_PATH
} from "../app_config"

//
// worker part
//

parentPort.on("message", async (message) => {
    if (Array.isArray(message)){
        switch(message[0]){
            case "save-to-db":
                fs.writeFileSync(PATH_TO_DATABASE, message[1])
                break
            case "read-db":
                let data = fs.readFileSync(PATH_TO_DATABASE, "utf-8")
                parentPort.postMessage(["db-data", data])
                break
        }
    }
})