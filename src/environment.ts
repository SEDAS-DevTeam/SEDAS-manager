import { EventLogger } from "./logger"
import { Worker } from 'worker_threads';
import path from "path"
import utils, { ProgressiveLoader } from "./utils";

//C++ (N-API) imports
import { enviro_calculations } from "./bind";
import { Plane, PlaneDB } from "./plane_functions";
import { PopupWindow } from "./app_config";

export class Environment {
    private logger: EventLogger;
    private abs_path: string;
    private sim_time_worker: Worker;

    // time variables
    public current_time: Date;
    public start_time: Date;

    public plane_schedules: any;
    public plane_objects: object[] = [];

    private command_data: any;
    private aircraft_data: any;
    private map_data: any;
    private scenario_data: any;
    private airlines_data: any;

    private plane_database: PlaneDB;
    private plane_spawner_config: object[] = [];

    public plane_conditions: object;

    public constructor(logger: EventLogger, abs_path: string, plane_database: PlaneDB,
                        command_data: object, 
                        aircraft_data: object, 
                        airlines_data: object,
                        map_data: object, 
                        scenario_data: object){
        this.logger = logger
        this.abs_path = abs_path

        this.command_data = command_data
        this.aircraft_data = aircraft_data["all_planes"] //get only planes resource
        this.airlines_data = airlines_data["airlines"]
        this.map_data = map_data
        this.scenario_data = scenario_data

        this.plane_database = plane_database

        //create fake simulation time (TODO: pass time into main)
        this.sim_time_worker = new Worker(path.join(abs_path, "/src/workers/sim_time.js"))
        this.sim_time_worker.postMessage(["start-measure", "random"]) //TODO: change to specific user setup


        //simulation time handlers
        this.sim_time_worker.on("message", (message) => {
            switch(message[0]){
                case "time": { //updating time for whole environment
                    this.current_time = message[1]
                    this.plane_spawner_check() //check for any scheduled plane to spawn

                    break
                }
                case "start-time": { //getting starting time so the plane spawner can check from initial time
                    this.start_time = message[1]

                    break
                }
            }
        })

    }

    /*
        Enviro functions exposed to main
    */
    public async setup_enviro(loader: ProgressiveLoader, logger: EventLogger){
        loader.send_progress("Calculating plane trajectories")
        logger.log("INFO", "Calculating plane trajectories")
        this.set_plane_trajectories()
        loader.send_progress("Spawning PlaneSpawner process")
        logger.log("INFO", "Setting up PlaneSpawner process")
        this.set_plane_spawner()

        //everything done, just validate everything
        loader.send_progress("Done! Validating output...")
        logger.log("INFO", "Validating output")
        await utils.sleep(1000) //TODO: HUH?
        this.validate()

        logger.log("INFO", "Output succesfully validated")
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
            let selected_plane: any = this.get_plane(preprocessed_planes, this.plane_schedules[i])
            if (selected_plane == 0){
                //no plane found for this schedule
                n_unused_schedules += 1
            }
            else{
                selected_plane["name"] = utils.generate_name(this.airlines_data, "airliner") //TODO
                selected_plane["hash"] = utils.generate_hash()
                selected_plane["schedule"] = this.plane_schedules[i]
                this.plane_objects.push(selected_plane)
            }
        }

        return n_unused_schedules
    }

    public set_plane_trajectories(){
        for (let i = 0; i < this.plane_objects.length; i++){
            console.log(this.plane_objects[i])
            let dep_point: string = this.plane_objects[i]["schedule"]["departure"]
            let arr_point: string = this.plane_objects[i]["schedule"]["arrival"]
            let trans_points: string = this.plane_objects[i]["schedule"]["transport_points"]
            console.log(this.map_data)
            
            let plane_trajectories: any[] = enviro_calculations.compute_heading_up(this.map_data, dep_point, trans_points, arr_point)
            //let plane_trajectories: string = enviro_calculations.compute_heading_up(dep_point, arr_point)
            console.log(plane_trajectories)
            
            //this.plane_objects[i]["trajectories"] = plane_trajectories
        }
    }

    public set_plane_spawner(){
        for (let i = 0; i < this.plane_objects.length; i++){
            let des_time: string = this.plane_objects[i]["schedule"]["time"]
            let conv_h: number = parseInt(des_time.split(":")[0]) * 3600000
            let conv_m: number = parseInt(des_time.split(":")[1]) * 60000
            let conv_s: number = parseInt(des_time.split(":")[2])
            
            let updated_time: Date = new Date(this.start_time.getTime() + (conv_h + conv_m + conv_s))

            this.plane_spawner_config.push({
                "id": this.plane_objects[i]["hash"],
                "time": updated_time
            })
        }
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
        return utils.get_random_element(final_plane_list)
    }

    private plane_spawner_check(){
        function convert_time(time_obj: Date){
            return `${time_obj.getHours()}:${time_obj.getMinutes()}`
        }

        for (let i = this.plane_spawner_config.length - 1; i >= 0; i--){
            let spawn_time: Date = this.plane_spawner_config[i]["time"]
            if (convert_time(spawn_time) == convert_time(this.current_time)){
                console.log("Time to spawn!")
                
                //Spawn plane

                //delete from plane spawner (already moved to PlaneDB)
                this.plane_spawner_config.splice(i, 1)

            }
        }
    }
}