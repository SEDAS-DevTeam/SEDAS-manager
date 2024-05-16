"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Environment = void 0;
function getRandomInteger(min, max) {
    return Math.random() * (max - min) + min;
}
class SimTime {
    date_object = new Date();
    constructor(logger, year = undefined, month = undefined, date = undefined, hours = undefined, mins = undefined, secs = undefined) {
        if (year == undefined) {
            logger.log("DEBUG", "Time not specified, generating own simulation time");
            this.date_object.setFullYear(getRandomInteger(1980, 2020), getRandomInteger(0, 11), getRandomInteger(1, 31));
            this.date_object.setHours(getRandomInteger(0, 23));
            this.date_object.setMinutes(getRandomInteger(0, 59));
            this.date_object.setSeconds(getRandomInteger(0, 59));
            console.log(this.date_object.toLocaleDateString("en-US"));
        }
        else {
        }
    }
}
class Environment {
    logger;
    sim_time;
    constructor(logger, command_data, aircraft_data, map_data) {
        this.logger = logger;
        //create fake simulation time
        this.sim_time = new SimTime(this.logger);
        console.log(command_data);
        console.log(aircraft_data);
    }
}
exports.Environment = Environment;
//# sourceMappingURL=environment.js.map