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
    command_data;
    aircraft_data;
    map_data;
    constructor(logger, abs_path, plane_database, command_data, aircraft_data, map_data) {
        this.logger = logger;
        this.abs_path = abs_path;
        this.command_data = command_data;
        this.aircraft_data = aircraft_data;
        this.map_data = map_data;
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
    }
    set_plane_trajectories() {
    }
    set_plane_spawner() {
    }
    validate() {
    }
}
exports.Environment = Environment;
//# sourceMappingURL=environment.js.map