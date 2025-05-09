import { EventLogger } from "./logger"
import { Worker } from 'worker_threads';
import path from "path"
import utils, { ProgressiveLoader, MSCwrapper } from "./utils";

//C++ (N-API) imports
import { enviro_calculations } from "./bind";
import { Plane, PlaneDB } from "./plane_functions";

export class Environment {
    private logger: EventLogger;
    private abs_path: string;
    private sim_time_worker: Worker;
    private app: any;
    private msc_wrapper: MSCwrapper;

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
    private std_bank_angle: number;

    private plane_database: PlaneDB;
    private plane_spawner_config: object[] = [];
    private plane_commander_config: object[] = []
    
    public plane_conditions: object;

    public constructor(logger: EventLogger, app: any, abs_path: string, plane_database: PlaneDB,
                        command_data: object, 
                        aircraft_data: object, 
                        map_data: object, 
                        scenario_data: object,
                        std_bank_angle: number,
                        msc_wrapper: MSCwrapper){
        this.logger = logger
        this.msc_wrapper = msc_wrapper
        this.abs_path = abs_path
        this.std_bank_angle = std_bank_angle

        this.command_data = command_data
        this.aircraft_data = aircraft_data["all_planes"] //get only planes resource
        this.map_data = map_data
        this.scenario_data = scenario_data

        this.plane_database = plane_database

        this.app = app

        //create fake simulation time (TODO: pass time into main)
        this.sim_time_worker = new Worker(path.join(abs_path, "/src/workers/sim_time.js"))
        this.sim_time_worker.postMessage(["start-measure", "random"]) //TODO: change to specific user setup


        //simulation time handlers
        this.sim_time_worker.on("message", (message) => {
            switch(message[0]){
                case "time": { //updating time for whole environment
                    this.current_time = message[1]
                    this.plane_modifier_check()
                    //this function checks for following:
                    //1. plane spawns
                    //2. Plane heading change

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
        this.set_plane_modifiers()

        //everything done, just validate everything
        logger.log("INFO", "Successfully created environment scenario")
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
            let dep_point: string = this.plane_objects[i]["schedule"]["departure"]
            let arr_point: string = this.plane_objects[i]["schedule"]["arrival"]
            let trans_points: string = this.plane_objects[i]["schedule"]["transport_points"]
            
            let napi_arguments = {
                "map_data": this.map_data,
                "plane": this.plane_objects[i],
                "dep_point": dep_point,
                "trans_points": trans_points,
                "arr_point": arr_point,
                "bank_angle": this.std_bank_angle
            }
            
            let plane_trajectory: any[] = enviro_calculations.compute_plane_trajectory(napi_arguments)
            this.plane_objects[i]["trajectory"] = plane_trajectory
        }
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
        }
        return accepted_planes
    }

    private get_conditions(){
        let condition_list = {}
        
        //TODO: rework with frontend (+ add APC) (WHAT IS APC???)
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

    /*
        Sim time sets
    */

    private set_plane_modifiers(){
        for (let i = 0; i < this.plane_objects.length; i++){

            //Plane spawner set
            let sch_time: string = this.plane_objects[i]["schedule"]["time"]
            let conv_h: number = parseInt(sch_time.split(":")[0]) * 3600000
            let conv_m: number = parseInt(sch_time.split(":")[1]) * 60000
            let conv_s: number = parseInt(sch_time.split(":")[2])

            this.plane_spawner_config.push({
                "id": this.plane_objects[i]["hash"],
                "time": new Date(this.start_time.getTime() + (conv_h + conv_m + conv_s))
            })

            //Plane commander set

            this.plane_commander_config.push({
                "id": this.plane_objects[i]["hash"],
                "content": this.plane_objects[i]["trajectory"]
            })
        }
    }

    /*
        Sim time checks
    */

    private plane_modifier_check(){
        function convert_time(time_obj: Date){
            return `${time_obj.getHours()}:${time_obj.getMinutes()}`
        }

        if (!this.app.app_status["sim-running"]){
            return;
        }

        for (let i = this.plane_spawner_config.length - 1; i >= 0; i--){

            //Plane spawner check
            let spawn_time: Date = this.plane_spawner_config[i]["time"]
            if (convert_time(spawn_time) == convert_time(this.current_time)){
                console.log("Time to spawn!")
                
                //Spawn plane
                let plane_data: object;
                for (let i_plane = 0; i_plane < this.plane_objects.length; i_plane++){
                    if (this.plane_objects[i_plane]["hash"] == this.plane_spawner_config[i]["id"]){
                        plane_data = this.plane_objects[i_plane]
                    }
                }

                let id = utils.generate_hash()
                let name: string = plane_data["properties"]["name"]
                let heading: number = plane_data["trajectory"][0][1]
                let heading_up: number = heading
                let level: number = 1000 // TODO
                let level_up: number = level
                let speed: number = plane_data["properties"]["min_kias"] // TODO
                let speed_up: number = speed
                let departure: string = plane_data["schedule"]["departure"]
                let arrival: string = plane_data["schedule"]["arrival"]
                let arrival_time: string = "01:00:00" // TODO
                let x: number = plane_data["trajectory"][0][0][0]
                let y: number = plane_data["trajectory"][0][0][1]

                console.log(
                    id,
                    name,
                    heading,
                    heading_up,
                    level,
                    level_up,
                    speed,
                    speed_up,
                    departure,
                    arrival,
                    arrival_time,
                    x,
                    y
                )

                let plane = new Plane(
                    id,
                    name,
                    heading,
                    heading_up,
                    level,
                    level_up,
                    speed,
                    speed_up,
                    departure,
                    arrival,
                    arrival_time,
                    x,
                    y
                )
                this.app.PlaneDatabase.add_record(plane, "ACC")

                this.app.broadcast_planes(this.app.PlaneDatabase.DB, this.app.PlaneDatabase.monitor_DB, this.app.PlaneDatabase.plane_paths_DB)

                //delete from plane spawner (already moved to PlaneDB)
                this.plane_spawner_config.splice(i, 1)
                
            }

            //Plane commander check
            //TODO: Going to revisit this soon, because in ATC some excercises prefer vectoring
            //TODO: Finish plane commander
        }
    }
}