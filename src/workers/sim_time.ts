import { parentPort, isMainThread } from 'worker_threads';
import utils from '../utils';

//TODO Better time measurement

class SimTime {
    public date_object = new Date();
    public measure: boolean = false;

    public constructor(mode: string = "current",
                        year: number = undefined, 
                        month: number = undefined, 
                        date: number = undefined,
                        hours: number = undefined,
                        mins: number = undefined,
                        secs: number = undefined){
        if (mode == "current"){
            setInterval(() => {
                this.date_object = new Date()
                if (this.measure){
                    parentPort.postMessage(["time", this.date_object])
                }
            }, 1)
        }
        else {
            if (mode == "random"){
                //logger.log("DEBUG", "Time not specified, generating own simulation time")
    
                this.date_object.setFullYear(utils.generateRandomInteger(1980, 2020), utils.generateRandomInteger(0, 11), utils.generateRandomInteger(1, 31))
                
                this.date_object.setHours(utils.generateRandomInteger(0, 23))
                this.date_object.setMinutes(utils.generateRandomInteger(0, 59))
                this.date_object.setSeconds(0)
            }
            else if (mode == "custom"){
                this.date_object.setFullYear(year, month, date)
                
                this.date_object.setHours(hours)
                this.date_object.setMinutes(mins)
                this.date_object.setSeconds(secs)
            }

            setInterval(() => {
                //for updating the time (every millis)
                this.date_object.setMilliseconds(this.date_object.getMilliseconds() + 1)
                if (this.measure){
                    parentPort.postMessage(["time", this.date_object])
                }
            }, 1)
        }
    }
}

if (!isMainThread){
    var simulation_time: SimTime;

    parentPort.on("message", (message) => {
        switch(message[0]){
            case "start-measure": {
                simulation_time = new SimTime(message[1])
                simulation_time.measure = true
                
                parentPort.postMessage(["start-time", simulation_time.date_object])
                break
            }
            case "get-time": {
                parentPort.postMessage(["time", simulation_time.date_object])
            }
        }
    })
}