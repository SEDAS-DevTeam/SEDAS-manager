import { readdirSync, unlinkSync, openSync, appendFileSync} from "fs"
import path from "path"

const ABS_PATH = path.resolve("")

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
    public constructor(debug: boolean){
        this.debug_mode = debug
        this.LOG_PATH = path.join(ABS_PATH, "/src/logs/app_log.txt")

        if(this.debug_mode){
            let time: string = this.get_time()
            console.log(`[${time}]`, "(DEBUG)", "Initialized event logger with DEBUGGING=TRUE")
        }

        //create log file
        let files: string[] = readdirSync(path.join(ABS_PATH, "/src/logs"))
        if (files.includes("app_log.txt")){
            unlinkSync(this.LOG_PATH)
        }
        openSync(this.LOG_PATH, "w")

        appendFileSync(this.LOG_PATH, "#########################################\n")
        appendFileSync(this.LOG_PATH, "SEDAC manager v1.0.0 Linux 64-bit version\n") //TODO: different outputs for different OSes!
        appendFileSync(this.LOG_PATH, "#########################################\n")
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

    public log(cat_name: string, messages: string[]){
        //messages is an array where first element is standard logging message followed by non-standard
        //debug mode message

        if (!this.debug_mode){
            console.log(messages[0]) //for standard logging without debug mode
        }
        this.add_record(cat_name, messages[1])
    }

    public add_record(cat_name: string, content: string){
        let time: string = this.get_time()

        this.data.push({
            time: time,
            cat: cat_name,
            content: content
        })

        let output: string = `[${time}] (${cat_name}) ${content}`
        //log to terminal if debug mode
        if (this.debug_mode){
            console.log(output)
        }

        //log to main log file
        appendFileSync(this.LOG_PATH, output + "\n")
    }

    public filter(cat_name: string){
        let out_data = []
        for (let i = 0; i < this.data.length; i++){
            if (this.data[i].cat == cat_name){
                out_data.push(this.data[i])
            }
        }
        return out_data
    }
}