"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Environment = void 0;
const worker_threads_1 = require("worker_threads");
const path_1 = __importDefault(require("path"));
class Environment {
    logger;
    abs_path;
    sim_time_worker;
    current_time;
    constructor(logger, abs_path, command_data, aircraft_data, map_data) {
        this.logger = logger;
        this.abs_path = abs_path;
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
    kill_enviro() {
        this.sim_time_worker.terminate();
    }
}
exports.Environment = Environment;
//# sourceMappingURL=environment.js.map