import { EventLogger } from "./logger"
import { Worker } from 'worker_threads';
import path from "path"
import { ProgressiveLoader, sleep } from "./utils";

//C++ (N-API) imports
import { enviro_calculations } from "./bind";
import { Plane, PlaneDB } from "./plane_functions";

export class Environment {
    private logger: EventLogger;
    private abs_path: string;
    private sim_time_worker: Worker;
    public current_time: Date;
    public plane_schedules: any;

    private command_data: any;
    private aircraft_data: any;
    private map_data: any;

    public constructor(logger: EventLogger, abs_path: string, plane_database: PlaneDB,
                    command_data: any[], aircraft_data: any[], map_data: any[]){
        this.logger = logger
        this.abs_path = abs_path

        this.command_data = command_data
        this.aircraft_data = aircraft_data
        this.map_data = map_data

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

    /*
        Enviro functions exposed to main
    */
    public async setup_enviro(loader: ProgressiveLoader){
        loader.send_progress("Setting plane schedules")
        this.set_plane_schedules()
        loader.send_progress("Calculating plane trajectories")
        this.set_plane_trajectories()
        loader.send_progress("Spawning PlaneSpawner process")
        this.set_plane_spawner()

        //everything done, just validate everything
        loader.send_progress("Done! Validating output...")
        await sleep(1000)
        this.validate()
    }

    public kill_enviro(){
        this.sim_time_worker.terminate()
    }

    /*
        Private enviro functions
    */
    private set_plane_schedules(){
        //TODO
        this.plane_schedules = this.map_data["scenarios"][0]["flight_schedules"]
        console.log(this.plane_schedules)
        for (let i = 0; i < this.plane_schedules.length; i++){
            console.log(this.plane_schedules[i])
        }
    }

    private set_plane_trajectories(){

    }

    private set_plane_spawner(){

    }

    private validate(){
        
    }
}