export class PlaneDB{
    /*Just an array with methods - for storing planes*/
    public DB: any = [] //storing planes
    public monitor_DB: any = [] //storing where are planes rendered
    public plane_paths_DB: any = []

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
    }

    public delete_all(){
        this.DB = []
        this.monitor_DB = []
    }

    public update_planes(){
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
            this.updated_speed = speed_up

            this.departure = departure;
            this.arrival = arrival;
            this.arrival_time = arrival_time
            this.x = x;
            this.y = y;
    }
}