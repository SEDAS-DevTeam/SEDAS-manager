//low level functions
function deg_to_rad(deg){
    return deg * (Math.PI / 180)
}

function rad_to_deg(rad){
    return Math.round(rad * (180 / Math.PI))
}

export class PlaneDB{
    /*Just an array with methods - for storing planes*/
    public DB: any = [] //storing planes
    public monitor_DB: any = [] //storing where are planes rendered
    public plane_paths_DB: any = []

    //temporary databases for plane movement
    public plane_turn_DB: any = []

    public constructor(monitor_data: any){
        for (let i = 0; i < monitor_data.length; i++){
            this.monitor_DB.push({
                "type": monitor_data[i].win_type,
                "planes_id": []
            })
        }
    }

    public update_worker_data(monitor_data: any){
        this.monitor_DB = []

        for (let i = 0; i < monitor_data.length; i++){
            if (monitor_data[i].win_type == "APP" || monitor_data[i].win_type == "ACC" || monitor_data[i].win_type == "TWR"){
                this.monitor_DB.push({
                    "type": monitor_data[i].win_type,
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

    public delete_record(id: number){
        //delete from planes database
        for (let i = 0; i < this.DB.length; i++){
            if (this.DB[i].id == id){
                this.DB.splice(i, 1)
            }
        }

        //delete from monitors database
        for (let i = 0; i < this.monitor_DB.length; i++){
            for (let i_planes = 0; i_planes < this.monitor_DB[i]["planes_id"].length; i_planes++){
                if(this.monitor_DB[i]["planes_id"][i_planes][i_planes] == id){
                    this.monitor_DB.splice(i_planes, 1)
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
                let r_of_t = this.DB[i].calc_rate_of_turn(std_bank_angle)
                
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

                if (parseInt(this.DB[i].updated_level) > parseInt(this.DB[i].level)){
                    //compute screen 2d speed, because of trigonometry
                    let screen_speed = Math.cos(deg_to_rad(std_climb_angle)) * parseInt(this.DB[i].speed)
                    this.DB[i].screen_speed = screen_speed

                    //climb
                    let change = (parseInt(this.DB[i].speed) / 3600) * Math.sin(deg_to_rad(std_climb_angle)) / scale
                    let fallback_diff = parseInt(this.DB[i].level) + change - parseInt(this.DB[i].updated_level)

                    //check if completed
                    if (fallback_diff > 0 && fallback_diff < 500){
                        this.DB[i].level = this.DB[i].updated_level

                        //set screen speed back to normal
                        this.DB[i].screen_speed = this.DB[i].speed
                        
                        continue
                    }
                    this.DB[i].level = Math.round(parseInt(this.DB[i].level) + change) //round

                }
                else if (parseInt(this.DB[i].updated_level) < parseInt(this.DB[i].level)){
                    //compute screen 2d speed, because of trigonometry
                    let screen_speed = Math.cos(deg_to_rad(std_descent_angle)) * parseInt(this.DB[i].speed)
                    this.DB[i].screen_speed = screen_speed

                    //descent
                    let change = parseInt(this.DB[i].speed) / 3600 * Math.sin(std_descent_angle)
                    let fallback_diff = parseInt(this.DB[i].updated_level) - parseInt(this.DB[i].level) - change
                    
                    if (fallback_diff > 0 && fallback_diff < 500){
                        this.DB[i].level = this.DB[i].updated_level

                        //set screen speed back to normal
                        this.DB[i].screen_speed = this.DB[i].speed

                        continue
                    }
                    this.DB[i].level = (parseInt(this.DB[i].level) - change).toFixed(1)
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
                    console.log(divider)
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

        /*
        PLANE PATH CHANGES
        */
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
    public id: number;
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

    public constructor(id: number, callsign: string, 
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

    public calc_rate_of_turn(std_bank_angle: number){
        return ((1.091 * Math.tan(deg_to_rad(std_bank_angle))) / this.speed) * 1000 //TODO: inspect this rounding error
    }

    public calc_pixel_change(type: string, scale: number, angle: number, change: number){
        let angle_head = Math.floor(angle / 90)
        let rel_angle = angle % 90
        if(angle % 90 == 0 && angle != 0){
            rel_angle = angle - (angle_head - 1) * angle
        }

        let dy_n_scale = Math.sin(deg_to_rad(rel_angle)) * change
        let dx_n_scale = Math.cos(deg_to_rad(rel_angle)) * change
        
        let dy = 0
        let dx = 0
        if (type == "movement"){
            dy = dy_n_scale / scale
            dx = dx_n_scale / scale
        }
        else if (type == "rotation"){
            dy = dy_n_scale
            dx = dx_n_scale
        }

        //if pixel-change is too small, set automatically to one
        dy = Math.ceil(dy)
        dx = Math.ceil(dx)

        let x1: number = 0
        let y1: number = 0

        switch(angle_head){
            case 0:
            x1 = this.x + dy
            y1 = this.y - dx
            break
            case 1:
            x1 = this.x + dx
            y1 = this.y + dy
            break
            case 2:
            x1 = this.x - dy
            y1 = this.y + dx
            break
            case 3:
            x1 = this.x - dx
            y1 = this.y - dy
            break
        }

        if(angle == 90){
            x1 = this.x + dy
            y1 = this.y
        }
        else if(angle == 180){
            x1 = this.x
            y1 = this.y + dx
        }
        else if(angle == 270){
            x1 = this.x - dy
            y1 = this.y
        }

        return [x1, y1]
    }

    public forward(scale: number){
        //make one forward pass

        let vals = undefined
        if (this.speed != this.screen_speed){
            //calculate pixel distance
            vals = this.calc_pixel_change("movement", scale, this.heading, this.screen_speed / 3600)
        }
        else{

            //calculate pixel distance
            vals = this.calc_pixel_change("movement", scale, this.heading, this.speed / 3600)
        }

        //rewrite variables
        this.x = vals[0]
        this.y = vals[1]
    }
}