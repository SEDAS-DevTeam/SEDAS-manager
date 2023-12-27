export class EventLogger{
    /*
    data will be processed in format:
    data = [{
        time: "HH:MM:SS", //time of init
        cat: "ACAI"/"DEBUG"/"DEBUG-GUI", //class for preprocess
        content: "1 object logged" //content for more info
    }]
    */

    private data = []
    private debug_mode: boolean = undefined
    public constructor(debug: boolean){
        this.debug_mode = debug
    }

    public add_record(cat_name: string, content: string){
        let date_obj = new Date()
        let time = `${date_obj.getHours()}:${date_obj.getMinutes()}:${date_obj.getSeconds()}`
        
        this.data.push({
            time: time,
            cat: cat_name,
            content: content
        })

        //log to terminal if debug mode
        if (this.debug_mode){
            console.log(`[${time}]`, `(${cat_name})`, `${content}`)
        }
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