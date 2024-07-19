//C++ (N-API) imports
import { plane_calculations } from "./bind";

export class PlaneDB{
    /*Just an array with methods - for storing planes*/
    public DB: any = [] //storing planes
    public monitor_DB: any = [] //storing where are planes rendered
    public plane_paths_DB: any = []

    //temporary databases for plane movement
    public plane_turn_DB: any = []

    /*
        Plane command config (used for gui but also for backend)

        NOTE: variations array is used only for listing parameters for command, processing is done in individual plane
    */
    public command_config = {
        "commands": [
            {
                "comm": "change-heading",
                "variations": ["left", "right", "standard"],
                "exec": ((plane: Plane, command: string, args: string[], value: any) => {
                    plane.change_heading(command, args, value)
                })
            },
            {
                "comm": "change-speed",
                "variations": [],
                "exec": ((plane: Plane, command: string, args: string[], value: any) => {
                    plane.change_speed(command, args, value)
                })
            },
            {
                "comm": "change-level",
                "variations": ["expedite", "climb", "descend"],
                "exec": ((plane: Plane, command: string, args: string[], value: any) => {
                    plane.change_level(command, args, value)
                })
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

    public set_command(callsign: string, command: string, value: number, args: string[] = []){
        for(let i = 0; i < this.DB.length; i++){
            if (callsign == this.DB[i].callsign){
                //find specific command context
                this.command_config.commands.forEach(command_elem => {
                    if (command == command_elem["comm"]){
                        command_elem["exec"](this.DB[i], command, args, value)
                    }
                })
            }
        }
    }

    public update_worker_data(monitor_data: any){
        console.log(monitor_data)
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

    public add_path_record(id: number, coords: any){
        for (let i = 0; i < this.plane_paths_DB.length; i++){
            if (this.plane_paths_DB[i]["id"] == id){
                this.plane_paths_DB[i]["coords"].push(coords)
                break
            }
        }
    }

    public find_record(id: number){
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

    public update_planes(scale: number, std_bank_angle: number, std_climb_angle: number, std_descent_angle: number,
                         std_accel: number, path_limit: number){
        //scale that represents how many nautical miles are on one pixel

        /*
        MOVEMENT CHANGES
        */

        //update all planes
        for (let i = 0; i < this.DB.length; i++){
            //save current location to plane path history
            this.add_path_record(this.DB[i].id, [this.DB[i].x, this.DB[i].y])

            this.DB[i].forward(scale)
        }

        for (let i = 0; i < this.DB.length; i++){
            //heading change
            if (this.DB[i].updated_heading != this.DB[i].heading){
                //make turn
                let r_of_t = plane_calculations.calc_rate_of_turn(std_bank_angle, this.DB[i].speed)
                
                let continue_change: boolean = true
                //scan plane turn database
                for (let i_db = 0; i_db < this.plane_turn_DB.length; i_db++){
                    if (this.plane_turn_DB[i_db]["id"] == this.DB[i].id){
                        //no need to update
                        continue_change = false
                        break
                    }
                }

                if (!continue_change){
                    continue
                }

                //add to turn DB for processing
                this.plane_turn_DB.push({
                    "id": this.DB[i].id,
                    "rate_of_turn": r_of_t
                })
            }
        }

        //level change
        for (let i = 0; i < this.DB.length; i++){
            if (parseInt(this.DB[i].updated_level) != parseInt(this.DB[i].level)){
                //compute screen 2d speed
                if (parseInt(this.DB[i].updated_level) > parseInt(this.DB[i].level)){
                    let screen_speed: number = plane_calculations.calc_screen_speed(std_climb_angle, this.DB[i].speed)
                    this.DB[i].screen_speed = screen_speed

                    const [change, fallback_diff] = plane_calculations.calc_climb(this.DB[i].speed, this.DB[i].level, std_climb_angle, scale, this.DB[i].updated_level)
                    
                    if (fallback_diff > 0 && fallback_diff < 500){ //TODO: resolution size not always correct
                        //Not done
                        this.DB[i].level = this.DB[i].updated_level
                        
                        //set screen speed back to normal
                        this.DB[i].screen_speed = this.DB[i].speed
                        
                    }
                    else{
                        //Done
                        this.DB[i].level = Math.round(parseInt(this.DB[i].level) + change) //round
                    }
                }
                else if (parseInt(this.DB[i].updated_level) < parseInt(this.DB[i].level)){
                    let screen_speed: number = plane_calculations.calc_screen_speed(std_descent_angle, this.DB[i].speed)
                    this.DB[i].screen_speed = screen_speed

                    const [change, fallback_diff] = plane_calculations.calc_descent(this.DB[i].speed, this.DB[i].level, std_descent_angle, scale, this.DB[i].updated_level)
                    
                    if (fallback_diff > 0 && fallback_diff < 500){
                        //Not done
                        this.DB[i].level = this.DB[i].updated_level

                        //set screen speed back to normal
                        this.DB[i].screen_speed = this.DB[i].speed
                    }
                    else{
                        //Done
                        this.DB[i].level = (parseInt(this.DB[i].level) - change).toFixed(1)
                    }
                }
            }
        }

        //speed change
        for (let i = 0; i < this.DB.length; i++){
            if (this.DB[i].updated_speed != this.DB[i].speed){
                var fallback_diff = parseInt(this.DB[i].speed) + std_accel - parseInt(this.DB[i].updated_speed)
                if (fallback_diff > 0 && fallback_diff < std_accel){
                    //check if finished
                    this.DB[i].speed = parseInt(this.DB[i].updated_speed)
                }

                if (parseInt(this.DB[i].updated_speed) > parseInt(this.DB[i].speed)){
                    //increase velocity
                    this.DB[i].speed = parseInt(this.DB[i].speed) + std_accel
                    this.DB[i].screen_speed = parseInt(this.DB[i].screen_speed) + std_accel
                }
                else if (parseInt(this.DB[i].updated_speed) < parseInt(this.DB[i].speed)){
                    //decrease velocity
                    this.DB[i].speed = parseInt(this.DB[i].speed) - std_accel
                    this.DB[i].screen_speed = parseInt(this.DB[i].screen_speed) - std_accel
                }
            }
        }

        //update plane turns
        for (let i = 0; i < this.plane_turn_DB.length; i++){
            for (let i_plane = 0; i_plane < this.DB.length; i_plane++){
                if (this.DB[i_plane] == undefined || this.plane_turn_DB[i] == undefined){
                    continue
                }
                if (this.plane_turn_DB[i]["id"] == this.DB[i_plane].id){

                    var fallback_diff = Math.abs(parseInt(this.DB[i_plane].heading) + this.plane_turn_DB[i]["rate_of_turn"] - parseInt(this.DB[i_plane].updated_heading))
                    //check if completed
                    if (fallback_diff > 0 && fallback_diff < 10){
                        //automatically set to updated heading
                        this.DB[i_plane].heading = parseInt(this.DB[i_plane].updated_heading)

                        //heading == updated_heading => remove
                        this.plane_turn_DB.splice(i, 1)
                        continue
                    }

                    var divider = ((this.DB[i_plane].heading < 180) ? this.DB[i_plane].heading + 180 : this.DB[i_plane].heading - 180)
                    if (parseInt(this.DB[i_plane].updated_heading) > divider || parseInt(this.DB[i_plane].updated_heading) < this.DB[i_plane].heading){
                        //turn left
                        this.DB[i_plane].heading = parseInt(this.DB[i_plane].heading) - this.plane_turn_DB[i]["rate_of_turn"]
                    }
                    else{
                        //turn right
                        this.DB[i_plane].heading = parseInt(this.DB[i_plane].heading) + this.plane_turn_DB[i]["rate_of_turn"]
                    }

                    //check if over 360
                    if (this.DB[i_plane].heading > 360){
                        this.DB[i_plane].heading = 0
                    }

                    //check if under 360
                    if (this.DB[i_plane].heading < 0){
                        this.DB[i_plane].heading = 355
                    }
                }
            }
        }

        //plane path changes
        for (let i = 0; i < this.plane_paths_DB.length; i++){
            if (!isNaN(path_limit)){
                if (this.plane_paths_DB[i]["coords"].length > path_limit){
                    //free some path particles
                    this.plane_paths_DB[i]["coords"].shift()
                }
            }
        }
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

    //special args that represent subcommand for command
    public special_comm: string[] = []

    public constructor(id: string, callsign: string, 
        heading: number, heading_up: number, 
        level: number, level_up: number,
        speed: number, speed_up: number,
        departure: string, arrival: string, 
        arrival_time: string,
        x: number, y: number){
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

        let vals = undefined
        if (this.speed != this.screen_speed){
            //calculate pixel distance
            vals = plane_calculations.calc_pixel_change(this.x, this.y, "movement", scale, this.heading, this.screen_speed / 3600)
        }
        else{

            //calculate pixel distance
            vals = plane_calculations.calc_pixel_change(this.x, this.y, "movement", scale, this.heading, this.speed / 3600)
        }

        //rewrite variables
        this.x = vals[0]
        this.y = vals[1]
    }

    /*
        Functions for changing plane variables
    */
    public change_heading(command: string, args: string[], value: number){
        if (args.length == 0) this.updated_heading = value
        else{

        }
    }

    public change_speed(command: string, args: string[], value: any){
        if (args.length == 0) this.updated_speed = value
        else{

        }
    }

    public change_level(command: string, args: string[], value: any){
        if (args.length == 0) this.updated_level = value
        else{

        }
    }
}