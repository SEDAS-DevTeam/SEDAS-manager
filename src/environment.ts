import { EventLogger } from "./logger"
import { Worker } from 'worker_threads';
import path from "path"

export class Environment {
    private logger: EventLogger;
    private abs_path: string;
    private sim_time_worker: Worker;
    public current_time: Date

    public constructor(logger: EventLogger, abs_path: string,
                    command_data: any[], aircraft_data: any[], map_data: any[]){
        this.logger = logger
        this.abs_path = abs_path

        //create fake simulation time (TODO: pass time into main)
        this.sim_time_worker = new Worker(path.join(abs_path, "/src/sim_time.js"))
        this.sim_time_worker.postMessage(["start-measure", "random"])

        //simulation time handlers
        this.sim_time_worker.on("message", (message) => {
            switch(message[0]){
                case "time": {
                    this.current_time = message[1]
                }
            }
        })

    }

    public set_plane_schedules(){

    }

    public set_plane_trajectories(){

    }

    public set_plane_spawner(){

    }

    public validate(){
        
    }

    public kill_enviro(){
        this.sim_time_worker.terminate()
    }
}