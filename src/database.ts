import {parentPort} from "worker_threads"
import path from "path"
import fs from "fs"

const ABS_PATH = path.resolve("")
const DATABASE_PATH = path.join(ABS_PATH, "/src/res/data/tmp/backup.json")

//
// worker part
//

parentPort.on("message", async (message) => {
    if (Array.isArray(message)){
        switch(message[0]){
            case "save-to-db":
                fs.writeFileSync(DATABASE_PATH, message[1])
                break
            case "read-db":
                let data = fs.readFileSync(DATABASE_PATH, "utf-8")
                parentPort.postMessage(["db-data", data])
                break
        }
    }
})