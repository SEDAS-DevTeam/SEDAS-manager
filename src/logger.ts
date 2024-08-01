import { readdirSync, unlinkSync, createWriteStream, WriteStream } from "fs"
import path from "path"
import os from "os"
import {
    ABS_PATH
} from "./app_config"
import utils from "./utils"

export class EventLogger{
    /*
    data will be processed in format:
    data = [{
        time: "HH:MM:SS", //time of init
        cat: "ACAI"/"DEBUG"/"ERROR"/"DEBUG-GUI"/"SCENE", //category for preprocess
        content: "1 object logged" //content for more info
    }]
    */

    private data = []
    private debug_mode: boolean = undefined
    private LOG_PATH: string = ""
    public log_header: string = ""
    private app_version: string = ""
    private header_type: string = ""
    private stream: WriteStream;

    public constructor(debug: boolean, log_header: string, header_type: string, app_ver: string = ""){
        this.debug_mode = debug
        this.LOG_PATH = path.join(ABS_PATH, `/src/logs/${log_header}.txt`)
        this.log_header = log_header
        this.app_version = app_ver
        this.header_type = header_type
    }
    public async init_logger(){
        if(this.debug_mode){
            let time: string = this.get_time()
            console.log(`[${time}]`, "(DEBUG)", "Initialized event logger with DEBUGGING=TRUE")
        }
        
        //create log file
        this.stream = createWriteStream(this.LOG_PATH)

        //write information header
        await this.create_header(this.header_type)
    }

    private get_time(){
        let date_obj = new Date()
        
        let hours: string = date_obj.getHours().toString()
        let mins: string = date_obj.getMinutes().toString()
        let seconds: string = date_obj.getSeconds().toString()

        if (hours.length != 2){
            hours = "0" + date_obj.getHours().toString()
        }
        if (mins.length != 2){
            mins = "0" + date_obj.getMinutes().toString()
        }
        if (seconds.length != 2){
            seconds = "0" + date_obj.getSeconds().toString()
        }


        return `${hours}:${mins}:${seconds}`
    }

    public log(cat_name: string, message: string){
        //messages is an array where first element is standard logging message followed by non-standard
        //debug mode message

        let time: string = this.get_time()
        
        this.data.push({
            time: time,
            cat: cat_name,
            content: message
        })

        let output: string = `[${time}] (${cat_name}) ${message}`
        if (this.debug_mode){
            console.log(output)
        }

        //log to main log file
        this.stream.write(output + "\n")
    }

    public end(){
        this.stream.end()
    }

    private async create_header(header_type: string){
        return new Promise<void>((resolve) => {
            this.stream.write("#########################################\n")

            switch (header_type){
                case "system":
                    let os_type: string = os.type()
                    let os_release: string = os.release()
                    let os_platform: string = os.platform()

                    this.stream.write(`SEDAC manager ${this.app_version} ${os_type} ${os_platform} ${os_release}\n`)
                    break
                case "environment":
                    this.stream.write("SEDAC environment\n")
                    break
            }

            this.stream.write("#########################################\n")
            resolve()
        })
    }
}