import { EventLogger } from "./logger"

function getRandomInteger(min: number, max: number) {
    return Math.random() * (max - min) + min;
}

class SimTime {
    public date_object = new Date();

    public constructor(logger: EventLogger,
                        mode: string = "current",
                        year: number = undefined, 
                        month: number = undefined, 
                        date: number = undefined,
                        hours: number = undefined,
                        mins: number = undefined,
                        secs: number = undefined){
        if (mode == "current"){

        }
        else {
            if (mode == "fake"){
                logger.log("DEBUG", "Time not specified, generating own simulation time")
    
                this.date_object.setFullYear(getRandomInteger(1980, 2020), getRandomInteger(0, 11), getRandomInteger(1, 31))
                
                this.date_object.setHours(getRandomInteger(0, 23))
                this.date_object.setMinutes(getRandomInteger(0, 59))
                this.date_object.setSeconds(getRandomInteger(0, 59))
            }
            else if (mode == "custom"){
                this.date_object.setFullYear(year, month, date)
                
                this.date_object.setHours(hours)
                this.date_object.setMinutes(mins)
                this.date_object.setSeconds(secs)
            }

            setTimeout
        }
    }
}

export class Environment {
    private logger: EventLogger;
    public sim_time: SimTime;

    public constructor(logger: EventLogger, command_data: any[], aircraft_data: any[], map_data: any[]){
        this.logger = logger

        //create fake simulation time
        this.sim_time = new SimTime(this.logger)

        console.log(command_data)
        console.log(aircraft_data)
    }
}