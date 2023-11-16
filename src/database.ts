import * as sqlite from "sqlite3"
import * as fs from "fs"

export class BackupDB{
    /*Simple SQLite database*/
    private DB: any;

    public create_database(){
        this.DB = new sqlite.Database("plane_info.db")
    
        let promise_pending = new Promise<void>((resolve, reject) => {
            this.DB.run("CREATE TABLE IF NOT EXISTS PLANES (id INTEGER, callsign TEXT, heading INTEGER, level INTEGER, speed INTEGER, departure TEXT, arrival TEXT, x INTEGER, y INTEGER)", (err: any) => {
                if (err){
                    console.log(err)
                    reject(err)
                }
                else{
                    resolve()
                }
            });  
        })
    }
    public insert_record(id: number, callsign: string, heading: number, 
                        level: number, speed: number, departure: string, arrival: string, x: number, y: number){
        return new Promise<void>((resolve, reject) => {
            this.DB.serialize(() => {
                this.DB.run("INSERT INTO PLANES (id, callsign, heading, level, speed, departure, arrival, x, y) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
                    [id, callsign, heading, level, speed, departure, arrival, x, y], (err: any) => {
                    if(err){
                        reject(err)
                    }
                })
            })
        })
    }
    public DeleteRecord(id: number){
        return new Promise<void>((resolve, reject) => {
            this.DB.run(`DELETE FROM PLANES WHERE id='${id}'`, (err: any) => {
                if (err){
                    console.log(err)
                    reject(err)
                }
                else{
                    resolve()
                    console.log("deleted a record")
                }
            })
        })
    }
    public SelectRecord(id: number){
        return new Promise((resolve, reject) => {
            this.DB.each(`SELECT * FROM PLANES WHERE id=${id}`, (err: any, row: any) => {
                if (err){
                    reject(err)
                }
                else{
                    resolve(row)
                }
            });
        })
    }
    public SelectAll(){
        return new Promise((resolve, reject) => {
            this.DB.each("SELECT * FROM PLANES", (err: any, data: any) => {
                if (err){
                    reject(err)
                }
                else{
                    resolve(data)
                }
            })
        })
    }
    public CloseDatabase(){
        return new Promise<void>((resolve, reject) => {
            this.DB.close()
            resolve()
        })
    }
    public DeleteDatabase(){
        return new Promise<void>((resolve, reject) => {
            this.DB.run(`DROP TABLE PLANES`, (err: any) => {
                if (err){
                    console.log(err)
                    reject(err)
                }
                else{
                    resolve()
                    console.log("deleted a record")
                }
            })
        })
    }
}

export class PlaneDB{
    /*Just an array with methods - for storing planes*/
    public DB: any;

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