//C++ (N-API) imports
import { plane_calculations } from "./bind";

export class PlaneDB{
    /*Just an array with methods - for storing planes*/
    public DB: Plane[] = [] //storing planes
    public monitor_DB: any = [] //storing where are planes rendered
    public plane_paths_DB: any = []

    //temporary databases for plane movement
    public plane_turn_DB: object[] = []

    /*
        Plane command config (used for gui but also for backend)

        NOTE: variations array is used only for listing parameters for command, processing is done in individual plane
    */
    public command_config = {
        "commands": [
            /*
                Change heading commands
            */
            {
                "comm": "turn-any",
                "exec": ((plane: Plane, command: string, value: any) => {
                    plane.change_heading(command, value)
                })
            },
            {
                "comm": "turn-left",
                "exec": ((plane: Plane, command: string, value: any) => {
                    plane.change_heading(command, value)
                })
            },
            {
                "comm": "turn-right",
                "exec": ((plane: Plane, command: string, value: any) => {
                    plane.change_heading(command, value)
                })
            },
            {
                "comm": "speed-any",
                "exec": ((plane: Plane, command: string, value: any) => {
                    plane.change_speed(command, value)
                })
            },
            {
                "comm": "speed-accel"
                // TODO
            },
            {
                "comm": "speed-decel"
                // TODO
            },
            {
                "comm": "level-any",
                "variations": ["expedite", "climb", "descend"],
                "exec": ((plane: Plane, command: string, value: any) => {
                    plane.change_level(command, value)
                })
            },
            {
                "comm": "level-descend",
                // TODO
            },
            {
                "comm": "level-climb"
                // TODO
            }
        ]
    }

    public constructor(monitor_data: any){
        for (let i = 0; i < monitor_data.length; i++){
            this.monitor_DB.push({
                "type": monitor_data[i]["win"].win_type,
                "planes_id": []
            })
        }
    }

    public set_command(callsign: string, command: string, value: any){
        for(let i = 0; i < this.DB.length; i++){
            if (callsign == this.DB[i].callsign){
                //find specific command context
                this.command_config.commands.forEach(command_elem => {
                    if (command == command_elem["comm"]){
                        console.log(command, command_elem)
                        command_elem["exec"](this.DB[i], command, value)
                    }
                })
            }
        }
    }

    public update_worker_data(monitor_data: any){
        this.monitor_DB = []

        for (let i = 0; i < monitor_data.length; i++){
            if (monitor_data[i]["win"].win_type == "APP" || monitor_data[i]["win"].win_type == "ACC" || monitor_data[i]["win"].win_type == "TWR"){
                this.monitor_DB.push({
                    "type": monitor_data[i]["win"].win_type,
                    "planes_id": []
                })
            }
        }
    }

    public add_record(plane_obj: any, monitor_spawn: string){
        //append planes to main DB
        this.DB.push(plane_obj)

        //add to monitor DB
        for (let i = 0; i < this.monitor_DB.length; i++){
            if (monitor_spawn.includes(this.monitor_DB[i]["type"])){
                this.monitor_DB[i]["planes_id"].push(plane_obj["id"])
            }
        }

        //add to path DB
        this.plane_paths_DB.push({
            "id": plane_obj["id"],
            "coords":[]
        })
    }

    public add_path_record(id: string, coords: any){
        for (let i = 0; i < this.plane_paths_DB.length; i++){
            if (this.plane_paths_DB[i]["id"] == id){
                this.plane_paths_DB[i]["coords"].push(coords)
                break
            }
        }
    }

    public find_record(id: string){
        for (let i = 0; i < this.DB.length; i++){
            if (this.DB[i].id == id){
                return this.DB[i]
            }
        }
    }

    public delete_record(id: string){
        //delete from planes database
        for (let i = 0; i < this.DB.length; i++){
            if (this.DB[i].id == id){
                this.DB.splice(i, 1)
                break;
            }
        }

        //delete from monitors database
        for (let i = 0; i < this.monitor_DB.length; i++){
            for (let i_planes = 0; i_planes < this.monitor_DB[i]["planes_id"].length; i_planes++){
                if(this.monitor_DB[i]["planes_id"][i_planes] == id){
                    this.monitor_DB[i]["planes_id"].splice(i_planes, 1)
                }
            }
        }

        //delete from path database
        for (let i = 0; i < this.plane_paths_DB.length; i++){
            if (this.plane_paths_DB[i]["id"] == id){
                this.plane_paths_DB.splice(i, 1)
            }
        }
    }

    public delete_all(){
        this.DB = []
        this.monitor_DB = []
    }

    private update_plane_turns(){

        //update plane turns
        for (let i = 0; i < this.plane_turn_DB.length; i++){
            for (let i_plane = 0; i_plane < this.DB.length; i_plane++){
                if (this.DB[i_plane] == undefined || this.plane_turn_DB[i] == undefined){
                    continue
                }
                if (this.plane_turn_DB[i]["id"] == this.DB[i_plane].id){
                    try{
                        let napi_arguments = {
                            "heading": this.DB[i_plane].heading,
                            "updated_heading": this.DB[i_plane].updated_heading,
                            "rate_of_turn": this.plane_turn_DB[i]["rate_of_turn"],
                            "refresh_rate": 1,
                            "command": this.DB[i_plane].current_command
                        }
    
                        let [new_heading, continue_change] = plane_calculations.calc_plane_heading(napi_arguments)
    
                        // check when going over compas degrees
                        if (new_heading > 360) new_heading = napi_arguments["rate_of_turn"]
                        else if (new_heading < 0) new_heading = 360 - napi_arguments["rate_of_turn"]
                        
                        if (continue_change){
                            // Heading change is not done
                            this.DB[i_plane].heading = new_heading
                        }
                        else{
                            // Heading change is done
                            this.DB[i_plane].heading = this.DB[i].updated_heading
                        }
                    }
                    catch(error){
                        console.log("Could not set plane heading! See error below")
                        console.log(error.message)
                    }
                }
            }
        }
    }

    private update_path_particles(path_limit: number){
        // plane path particle regulation
        for (let i = 0; i < this.plane_paths_DB.length; i++){
            if (!isNaN(path_limit)){
                if (this.plane_paths_DB[i]["coords"].length > path_limit){
                    //free some path particles
                    this.plane_paths_DB[i]["coords"].shift()
                }
            }
        }
    }

    public update_planes(scale: number, std_bank_angle: number, std_climb_angle: number, std_descent_angle: number,
                         std_accel: number, path_limit: number){
        //scale that represents how many nautical miles are on one pixel
        /*
        MOVEMENT CHANGES
        */

        //typecheck for all planes, no need to do that every turn (remove later TODO)
        //also, there is no need for 5 fckin loops, so remove that later too

        //update all planes
        for (let i = 0; i < this.DB.length; i++){
            //save current location to plane path history
            this.add_path_record(this.DB[i].id, [this.DB[i].x, this.DB[i].y])

            //move plane forward
            this.DB[i].forward(scale)

            //level change
            this.DB[i].check_level(std_climb_angle, std_descent_angle, scale)

            //speed change
            this.DB[i].check_speed(std_accel)

            //heading change
            this.DB[i].check_heading(std_bank_angle, this.plane_turn_DB)
        }

        this.update_plane_turns()
        this.update_path_particles(path_limit)
    }
}

export class Plane{
    public id: string;
    public callsign: string;

    public heading: number;
    public updated_heading: number;

    public level: number;
    public updated_level: number;

    public speed: number;
    public screen_speed: number //2d speed for climb and descent
    public updated_speed: number;

    public departure: string;
    public arrival: string;
    public arrival_time: string;
    public x: number;
    public y: number;

    public current_command: string = "";

    //special args that represent subcommand for command
    public special_comm: string[] = []

    public constructor(id: string, 
        callsign: string, 
        heading: number,
        heading_up: number, 
        level: number,
        level_up: number,
        speed: number, 
        speed_up: number,
        departure: string, 
        arrival: string, 
        arrival_time: string,
        x: number, 
        y: number){
            this.id = id;
            this.callsign = callsign;

            this.heading = heading;
            this.updated_heading = heading_up

            this.level = level;
            this.updated_level = level_up;

            this.speed = speed;
            this.screen_speed = speed
            this.updated_speed = speed_up

            this.departure = departure;
            this.arrival = arrival;
            this.arrival_time = arrival_time
            this.x = x;
            this.y = y;
    }

    public forward(scale: number){
        //make one forward pass

        let napi_arguments = {
            "x": this.x,
            "y": this.y,
            "scale": scale,
            "heading": this.heading,
            "screen_speed": this.screen_speed, // to get (nm/s);
            "refresh_rate": 1 // TODO: add to settings
        }
        let vals = plane_calculations.calc_plane_forward(napi_arguments)

        //rewrite variables
        this.x = vals[0]
        this.y = vals[1]
    }

    public check_heading(std_bank_angle: number, plane_turn_DB: object[]){ //TODO: rewrite
        if (this.updated_heading != this.heading){
            //make turn

            let r_of_t = plane_calculations.calc_rate_of_turn(std_bank_angle, this.speed)
            let continue_change: boolean = true
            //scan plane turn database
            for (let i_db = 0; i_db < plane_turn_DB.length; i_db++){
                if (plane_turn_DB[i_db]["id"] == this.id){
                    //no need to update
                    continue_change = false
                    break
                }
            }

            if (continue_change){
                //add to turn DB for processing
                plane_turn_DB.push({
                    "id": this.id,
                    "rate_of_turn": r_of_t
                })
            }
        }
    }

    public check_level(std_climb_angle: number, std_descent_angle: number, scale: number){
        // check and update level on plane

        let napi_arguments = {
            "climb_angle": std_climb_angle,
            "descent_angle": std_descent_angle,
            "scale": scale,
            "level": this.level,
            "updated_level": this.updated_level,
            "speed": this.speed,
            "refresh_rate": 1
        }
        
        const [new_level, continue_change, screen_speed] = plane_calculations.calc_plane_level(napi_arguments)
        if (continue_change){
            //Level change is not done
            this.level = new_level
            this.screen_speed = screen_speed
        }
        else{
            //Level change is done
            this.level = this.updated_level
            this.screen_speed = this.speed
        }
    }

    public check_speed(std_accel: number){
        let napi_arguments = {
            "accel": std_accel,
            "refresh_rate": 1,
            "speed": this.speed,
            "updated_speed": this.updated_speed,
            "screen_speed": this.screen_speed
        }

        const [new_speed, continue_change, new_screen_speed] = plane_calculations.calc_plane_speed(napi_arguments)
        if (continue_change){
            //Speed change is not done
            this.speed = new_speed
            this.screen_speed = new_screen_speed
        }
        else{
            //Speed change is done
            this.speed = this.updated_speed
        }
    }

    /*
        Functions for changing plane variables
        Everytime there is some variation of command, for example:
            turn-any
            turn-left
            turn-right
        
        Different commands get set, so that N-API can differentiate calculations
    */
    public change_heading(command: string, value: any){
        this.updated_heading = parseInt(value)
        this.current_command = command

    }

    public change_speed(command: string, value: any){
        this.updated_speed = parseInt(value)
        this.current_command = command
    }

    public change_level(command: string, value: any){
        this.updated_level = parseInt(value)
        this.current_command = command
    }
}