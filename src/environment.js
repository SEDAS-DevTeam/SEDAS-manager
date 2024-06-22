"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Environment = void 0;
const worker_threads_1 = require("worker_threads");
const path_1 = __importDefault(require("path"));
const utils_1 = require("./utils");
class Environment {
    logger;
    abs_path;
    sim_time_worker;
    current_time;
    plane_schedules;
    command_data;
    aircraft_data;
    map_data;
    scenario_data;
    plane_database;
    plane_conditions;
    constructor(logger, abs_path, plane_database, command_data, aircraft_data, map_data, scenario_data) {
        this.logger = logger;
        this.abs_path = abs_path;
        this.command_data = command_data;
        this.aircraft_data = aircraft_data["all_planes"]; //get only planes resource
        this.map_data = map_data;
        this.scenario_data = scenario_data;
        this.plane_database = plane_database;
        //create fake simulation time (TODO: pass time into main)
        this.sim_time_worker = new worker_threads_1.Worker(path_1.default.join(abs_path, "/src/sim_time.js"));
        this.sim_time_worker.postMessage(["start-measure", "random"]);
        //simulation time handlers
        this.sim_time_worker.on("message", (message) => {
            switch (message[0]) {
                case "time": {
                    this.current_time = message[1];
                }
            }
        });
    }
    /*
        Enviro functions exposed to main
    */
    async setup_enviro(loader) {
        loader.send_progress("Setting plane schedules");
        this.set_plane_schedules();
        loader.send_progress("Calculating plane trajectories");
        this.set_plane_trajectories();
        loader.send_progress("Spawning PlaneSpawner process");
        this.set_plane_spawner();
        //everything done, just validate everything
        loader.send_progress("Done! Validating output...");
        await (0, utils_1.sleep)(1000);
        this.validate();
    }
    kill_enviro() {
        this.sim_time_worker.terminate();
    }
    /*
        Private enviro functions
    */
    set_plane_schedules() {
        this.plane_schedules = this.map_data["scenarios"][0]["flight_schedules"];
        this.plane_conditions = this.get_conditions();
        let preprocessed_planes = this.get_processed_plane_list(this.plane_conditions, this.aircraft_data);
        if (preprocessed_planes.length == 0) {
            console.log("TODO: add cusom error popup");
            return;
        }
        for (let i = 0; i < this.plane_schedules.length; i++) {
            this.get_plane(preprocessed_planes, this.plane_schedules[i]);
            //preprocessed_planes.push(this.get_plane())
        }
    }
    set_plane_trajectories() {
    }
    set_plane_spawner() {
    }
    validate() {
    }
    /*Inner functions*/
    get_processed_plane_list(conditions, aircraft_data) {
        let accepted_planes = [];
        for (let i = 0; i < aircraft_data.length; i++) {
            for (let i_man = 0; i_man < aircraft_data[i]["planes"].length; i_man++) {
                let spec_plane = aircraft_data[i]["planes"][i_man];
                let plane_args = {
                    "wtc_category": spec_plane["wtc_category"],
                    "category": spec_plane["category"]
                };
                let passing = true;
                for (let key in conditions) {
                    if (!conditions[key].includes(plane_args[key])) {
                        passing = false;
                        break;
                    }
                }
                if (passing) {
                    accepted_planes.push({
                        "manufacturer": aircraft_data[i]["manufacturer"],
                        "properties": spec_plane
                    });
                }
            }
            //let plane = new Plane(...plane_parameters)
        }
        return accepted_planes;
    }
    get_conditions() {
        let condition_list = {};
        //TODO: rework with frontend (+ add APC)
        let weight_conditions = this.scenario_data["wtc_category"];
        let cat_conditions = this.scenario_data["category"];
        condition_list["wtc_category"] = weight_conditions;
        condition_list["category"] = cat_conditions;
        return condition_list;
    }
    get_plane(plane_list, plane_schedule) {
        //perform final selection to get right plane type
        let category = plane_schedule["category"];
        let wtc_category = plane_schedule["wtc"];
        let spec_condition_list = { "wtc_category": wtc_category, "category": category };
        let final_plane_list = [];
        for (let i_plane = 0; i_plane < plane_list.length; i_plane++) {
            let passing = true;
            for (let key in spec_condition_list) {
                if (plane_list[i_plane]["properties"][key] != spec_condition_list[key]) {
                    passing = false;
                    break;
                }
            }
            if (passing) {
                final_plane_list.push(plane_list[i_plane]);
            }
        }
        //random choose plane
        let random_plane = (0, utils_1.get_random_element)(final_plane_list);
        //generate the plane for planeDB
        console.log(random_plane);
        console.log(plane_schedule);
    }
}
exports.Environment = Environment;
//# sourceMappingURL=environment.js.map