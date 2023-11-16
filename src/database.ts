import * as sqlite from "sqlite3"
import * as fs from "fs"

var DB: any;


export function CreateDatabase(){
    if(fs.existsSync("plane_info.db")){
        fs.unlinkSync("plane_info.db")
        //remove to erase memory
    }

    DB = new sqlite.Database("plane_info.db")

    return new Promise<void>((resolve, reject) => {
        DB.run("CREATE TABLE IF NOT EXISTS PLANES (id INTEGER, callsign TEXT, heading INTEGER, level INTEGER, speed INTEGER, departure TEXT, arrival TEXT)", (err) => {
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

export function InsertRecord(id: number, callsign: string, heading: number, 
                            level: number, speed: number, departure: string, arrival: string){
    return new Promise<void>((resolve, reject) => {
        DB.serialize(() => {
            DB.run("INSERT INTO PLANES (id, callsign, heading, level, speed, departure, arrival) VALUES (?, ?, ?, ?, ?, ?, ?)",
            [id, callsign, heading, level, speed, departure, arrival], (err) => {
                if(err){
                    reject(err)
                }
            })
        })
    })
}

export function DeleteRecord(id: number){
    return new Promise<void>((resolve, reject) => {
        DB.run(`DELETE FROM PLANES WHERE id='${id}'`, (err) => {
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

export function SelectRecord(id: number){
    return new Promise((resolve, reject) => {
        DB.each(`SELECT * FROM PLANES WHERE id=${id}`, (err: any, row: any) => {
            if (err){
                reject(err)
            }
            else{
                resolve(row)
            }
        });
    })
}

export function SelectAll(){
    return new Promise((resolve, reject) => {
        DB.each("SELECT * FROM PLANES", (err: any, data: any) => {
            if (err){
                reject(err)
            }
            else{
                resolve(data)
            }
        })
    })
}

export function CloseDatabase(){
    return new Promise<void>((resolve, reject) => {
        DB.close()
        resolve()
    })
}