export class PlaneDB{
    /*Just an array with methods - for storing planes*/
    public DB: any = []

    public add_record(id: number, callsign: string, heading: number, level: number,
        speed: number, departure: string, arrival: string, x: number, y: number){
        /*
        id - record identifier
        callsign - aircraft callsing
        heading/level/speed
        departure/arrival - departure/arrival point
        x - last x coordinate
        y - last y coordinate
        */
        this.DB.push({
            "id": id,
            "callsign": callsign,
            "heading": heading,
            "level": level,
            "speed": speed,
            "departure": departure,
            "arrival": arrival,
            "x": x,
            "y": y
        })
    }

    public find_record(id: number){
        for (let i = 0; i < this.DB.length; i++){
            if (this.DB[i]["id"] == id){
                return this.DB[i]
            }
        }
    }

    public modify_record(id: number, mod_val :(string | number)[]){
        for (let i = 0; i < this.DB.length; i++){
            if (this.DB[i]["id"] == id){
                this.DB[i][mod_val[0]] = mod_val[1]
            }
        }
    }

    public delete_record(id: number){
        for (let i = 0; i < this.DB.length; i++){
            if (this.DB[i]["id"] == id){
                this.DB.splice(i, 1)
            }
        }
    }

    public delete_all(){
        this.DB = []
    }
}

export class Plane{
    public constructor(){

    }
}