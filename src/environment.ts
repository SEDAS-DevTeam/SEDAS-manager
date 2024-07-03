import { EventLogger } from "./logger"
import { Worker } from 'worker_threads';
import path from "path"
import { ProgressiveLoader, sleep, generate_hash, generate_name, get_random_element } from "./utils";

//C++ (N-API) imports
import { enviro_calculations } from "./bind";
import { Plane, PlaneDB } from "./plane_functions";
import { PopupWindow } from "./app_config";

export class Environment {
    private logger: EventLogger;
    private abs_path: string;
    private sim_time_worker: Worker;
    public current_time: Date;
    public plane_schedules: any;
    public plane_objects: object[] = [];

    private command_data: any;
    private aircraft_data: any;
    private map_data: any;
    private scenario_data: any;
    private plane_database: PlaneDB

    public plane_conditions: object;

    public constructor(logger: EventLogger, abs_path: string, plane_database: PlaneDB,
                    command_data: any[], aircraft_data: any[], map_data: any[], scenario_data: any){
        this.logger = logger
        this.abs_path = abs_path

        this.command_data = command_data
        this.aircraft_data = aircraft_data["all_planes"] //get only planes resource
        this.map_data = map_data
        this.scenario_data = scenario_data

        this.plane_database = plane_database

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
    public set_plane_schedules(){
        let n_unused_schedules = 0

        this.plane_schedules = this.map_data["scenarios"][0]["flight_schedules"]

        this.plane_conditions = this.get_conditions()
        let preprocessed_planes: any[] = this.get_processed_plane_list(this.plane_conditions, this.aircraft_data)
        if (preprocessed_planes.length == 0){
            return -1 //plane preset is invalid for scenario options
        }

        for (let i = 0; i < this.plane_schedules.length; i++){
            let selected_plane = this.get_plane(preprocessed_planes, this.plane_schedules[i])
            if (selected_plane == 0){
                //no plane found for this schedule
                n_unused_schedules += 1
            }
            else{
                selected_plane["name"] = generate_name()
                selected_plane["hash"] = generate_hash()
                selected_plane["schedule"] = this.plane_schedules[i]

                this.plane_objects.push(selected_plane)
            }
        }

        return n_unused_schedules
    }

    public set_plane_trajectories(){
        for (let i = 0; i < this.plane_objects.length; i++){
            console.log(this.plane_objects[i])
            let dep_point: string = this.plane_objects[i]["departure"]
            let arr_point: string = this.plane_objects[i]["arrival"]
            let trans_points: string = this.plane_objects[i]["transport_points"]



            let out: string = enviro_calculations.compute_heading_up(this.map_data, dep_point, trans_points, arr_point)
            console.log(out)
        }
    }

    public set_plane_spawner(){

    }

    public validate(){
        
    }

    /*Inner functions*/
    private get_processed_plane_list(conditions: object, aircraft_data: any[]){

        let accepted_planes: any[] = []
        for (let i = 0; i < aircraft_data.length; i++){
            for(let i_man = 0; i_man < aircraft_data[i]["planes"].length; i_man++){
                let spec_plane = aircraft_data[i]["planes"][i_man]

                let plane_args: object = {
                    "wtc_category": spec_plane["wtc_category"], 
                    "category": spec_plane["category"]
                }

                let passing: boolean = true
                for (let key in conditions) {
                    if (!conditions[key].includes(plane_args[key])){
                        passing = false
                        break
                    }
                } 
                
                if(passing){
                    accepted_planes.push({
                        "manufacturer": aircraft_data[i]["manufacturer"],
                        "properties": spec_plane
                    })
                }
            }
            //let plane = new Plane(...plane_parameters)
        }
        return accepted_planes
    }

    private get_conditions(){
        let condition_list = {}
        
        //TODO: rework with frontend (+ add APC)
        let weight_conditions = this.scenario_data["wtc_category"]
        let cat_conditions = this.scenario_data["category"]

        condition_list["wtc_category"] = weight_conditions
        condition_list["category"] = cat_conditions

        return condition_list
    }

    private get_plane(plane_list: any[], plane_schedule: any){
        //perform final selection to get right plane type
        let category = plane_schedule["category"]
        let wtc_category = plane_schedule["wtc"]
        let spec_condition_list = {"wtc_category": wtc_category, "category": category}

        let final_plane_list: any[] = []
        for (let i_plane = 0; i_plane < plane_list.length; i_plane++){

            let passing: boolean = true
            for (let key in spec_condition_list) {
                if (plane_list[i_plane]["properties"][key] != spec_condition_list[key]){
                    passing = false
                    break
                }
            } 
            
            if(passing){
                final_plane_list.push(plane_list[i_plane])
            }
        }

        if (final_plane_list.length == 0){
            return 0 //no planes avaliable
        }

        //random choose plane
        return get_random_element(final_plane_list)
    }
}