import { EventLogger } from "./logger"
import { Worker } from 'worker_threads';
import path from "path"
import utils from "./app_utils";
import {
  AircraftPreset,
  CommandPreset,
  IPCwrapperInterface,
  MainAppInterface,
  MapPreset,
  MSCwrapperInterface,
  PlaneConditions,
  PlaneDBInterface,
  PlaneLocObject,
  PlaneObject,
  PlaneSpawnerConfiguration,
  PlaneCommanderConfiguration,
  ProgressiveLoaderInterface
} from "./app_config"

//C++ (N-API) imports
import { enviro_calculations } from "./bind";
import { Plane, PlaneDB } from "./plane_functions";

import {
  EnvironmentInterface,
  EventLoggerInterface,
  Window
} from "./app_config"

export class Environment implements EnvironmentInterface{
  private logger: EventLoggerInterface;
  private abs_path: string;
  private sim_time_worker: Worker;
  private main_app: MainAppInterface;
  private msc_wrapper: MSCwrapperInterface;
  private loader: ProgressiveLoaderInterface

  // time variables
  public current_time!: Date;
  public start_time!: Date;

  public plane_schedules: any;
  public plane_objects: PlaneObject[] = [];

  private command_data: any;
  private aircraft_data: any;
  private map_data: any;
  private scenario_data: any;
  private airlines_data: any;
  private std_bank_angle: number;

  private plane_database: PlaneDBInterface;
  private plane_spawner_config: PlaneSpawnerConfiguration = [];
  private plane_commander_config: PlaneCommanderConfiguration = [];
  
  public plane_conditions!: PlaneConditions;

  public constructor(
    logger: EventLoggerInterface,
    app: MainAppInterface,
    abs_path: string,
    plane_database: PlaneDBInterface,
    command_data: CommandPreset, 
    aircraft_data: AircraftPreset, 
    map_data: MapPreset, 
    scenario_data: object,
    std_bank_angle: number,
    msc_wrapper: MSCwrapperInterface,
    progressive_loader: ProgressiveLoaderInterface
  ) {
    this.logger = logger
    this.msc_wrapper = msc_wrapper
    this.loader = progressive_loader
    this.abs_path = abs_path
    this.std_bank_angle = std_bank_angle

    this.command_data = command_data
    this.aircraft_data = aircraft_data["all_planes"] //get only planes resource
    this.map_data = map_data
    this.scenario_data = scenario_data

    this.plane_database = plane_database

    this.main_app = app

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
  public async setup_enviro(){
    this.loader.send_progress("Calculating plane trajectories")
    this.logger.log("INFO", "Calculating plane trajectories")
    this.set_plane_trajectories()
    this.loader.send_progress("Spawning PlaneSpawner process")
    this.logger.log("INFO", "Setting up PlaneSpawner process")
    this.set_plane_modifiers()

    //everything done, just validate everything
    this.logger.log("INFO", "Successfully created environment scenario")
  }

  public kill_enviro(){
    this.sim_time_worker.terminate()
  }

  /*
  Evironment/planes modifier functions
  */
  public set_plane_schedules(){
    let n_unused_schedules: number = 0

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
      
      let plane_trajectory: any[] | undefined = enviro_calculations.compute_plane_trajectory(napi_arguments)
      if (plane_trajectory === undefined) return // Trajectory computation fai
      this.plane_objects[i]["trajectory"] = plane_trajectory
    }
  }
    
  public broadcast_planes(
    planes: Plane[],
    plane_monitor_data: PlaneLocObject[],
    plane_paths_data: object[]
  ) {
    if (this.main_app.controllerWindow != undefined && this.main_app.workers.length != 0) {
      //update planes on controller window
      this.main_app.wrapper.send_message("controller", "update-plane-db", planes)

      for (let i = 0; i < plane_monitor_data.length; i++){
        let temp_planes = []

        for (let i_plane = 0; i_plane < plane_monitor_data[i]["planes_id"].length; i_plane++){
          //loop through all planes on specific monitor

          //retrieve specific plane by id
          for (let i2_plane = 0; i2_plane < planes.length; i2_plane++){
            if (planes[i2_plane]["id"] == plane_monitor_data[i]["planes_id"][i_plane]){
              temp_planes.push(planes[i2_plane])
            }
          }
        }

        //send updated data to all workers
        this.main_app.workers[i]["win"].send_message("update-plane-db", temp_planes)
        //send path data to all workers
        this.main_app.workers[i]["win"].send_message("update-paths", plane_paths_data)
      }
    }
  }

    /*Inner functions*/
    private get_processed_plane_list(conditions: PlaneConditions, aircraft_data: any[]){

      let accepted_planes: any[] = []
      for (let i = 0; i < aircraft_data.length; i++){
        for(let i_man = 0; i_man < aircraft_data[i]["planes"].length; i_man++){
          let spec_plane = aircraft_data[i]["planes"][i_man]

          let plane_args: PlaneConditions = {
            "wtc_category": spec_plane["wtc_category"], 
            "category": spec_plane["category"]
          }

          let passing: boolean = true
          for (let key in conditions) {
            const k = key as keyof PlaneConditions
            
            if (!conditions[k].includes(plane_args[k])){
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
      //TODO: rework with frontend (+ add APC - approach category)
      let weight_conditions = this.scenario_data["wtc_category"]
      let cat_conditions = this.scenario_data["category"]

      let condition_list: PlaneConditions = {
        wtc_category: weight_conditions,
        category: cat_conditions
      }
      return condition_list
    }

    private get_plane(plane_list: any[], plane_schedule: any){
      //perform final selection to get right plane type
      let category = plane_schedule["category"]
      let wtc_category = plane_schedule["wtc"]
      let spec_condition_list: PlaneConditions = {
        "wtc_category": wtc_category,
        "category": category
      }

      let final_plane_list: any[] = []
      for (let i_plane = 0; i_plane < plane_list.length; i_plane++){

          let passing: boolean = true
          for (let key in spec_condition_list) {
              const k = key as keyof PlaneConditions
              if (plane_list[i_plane]["properties"][k] != spec_condition_list[k]){
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

        if (!this.main_app.app_status["sim-running"] || this.main_app.PlaneDatabase === undefined){
            return;
        }

        for (let i = this.plane_spawner_config.length - 1; i >= 0; i--){

            //Plane spawner check
            let spawn_time: Date = this.plane_spawner_config[i]["time"]
            if (convert_time(spawn_time) == convert_time(this.current_time)){
                console.log("Time to spawn!")
                
                //Spawn plane
                let plane_data: PlaneObject | undefined;
                for (let i_plane = 0; i_plane < this.plane_objects.length; i_plane++){
                    if (this.plane_objects[i_plane]["hash"] == this.plane_spawner_config[i]["id"]){
                        plane_data = this.plane_objects[i_plane]
                    }
                }
                if (plane_data === undefined) return

                let id = utils.generate_hash()
                let name: string = plane_data["name"]
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
                this.main_app.PlaneDatabase.add_record(plane, "ACC")

                this.broadcast_planes(
                  this.main_app.PlaneDatabase.DB,
                  this.main_app.PlaneDatabase.monitor_DB,
                  this.main_app.PlaneDatabase.plane_paths_DB
                )

                //delete from plane spawner (already moved to PlaneDB)
                this.plane_spawner_config.splice(i, 1)
                
            }

            //Plane commander check
            //TODO: Going to revisit this soon, because in ATC some excercises prefer vectoring
            //TODO: Finish plane commander
        }
    }
}

// Upper-level function definitions used to manage environment calls from main_lib
// TODO: solve for multi-session (mutiple ATCos)

export function start_sim(main_app: MainAppInterface){
  main_app.app_status["sim-running"] = true

  //send stop event to all workers
  main_app.wrapper.broadcast("workers", "sim-event", "startsim")
  main_app.wrapper.send_message("controller", "sim-event", "startsim")
}

export function stop_sim(main_app: MainAppInterface){
    main_app.app_status["sim-running"] = false

    //send stop event to all workers
    main_app.wrapper.broadcast("workers", "sim-event", "stopsim")
    main_app.wrapper.send_message("controller", "sim-event", "stopsim")
}

export function start_mic_record(main_app: MainAppInterface){
    console.log(main_app.app_status["sim-running"])
    if (main_app.msc_wrapper && main_app.app_status["sim-running"]) main_app.msc_wrapper.send_message("module", "ai_backend", "start-mic")
}

export function stop_mic_record(main_app: MainAppInterface){
    if (main_app.msc_wrapper && main_app.app_status["sim-running"]) main_app.msc_wrapper.send_message("module", "ai_backend", "stop-mic")
}

export function restore_sim(main_app: MainAppInterface){
    main_app.backup_worker.postMessage(["read-db"])
}

export function regenerate_map(main_app: MainAppInterface){
    if (main_app.app_status["turn-on-backend"]){
        console.log("Terrain generation not done yet :)")
        //this.backend_worker.postMessage(["action", "terrain"])
    }
}

export function parse_scale(scale: string){
    //parse scale (constant, that describes how many units is one pixel)
    let val: number = 0
    if(scale.includes("m")){
        val = parseFloat(scale.substring(0, scale.indexOf("m"))) //value is in nautical miles
    }

    return val
}