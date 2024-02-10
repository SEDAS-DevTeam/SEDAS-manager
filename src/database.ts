import sqlite from "sqlite3"
import {parentPort} from "worker_threads"
import path from "path"
import fs from "fs"

const ABS_PATH = path.resolve("")
const SQLITE_DATABASE_PATH = path.join(ABS_PATH, "/src/res/tmp_data/backup.db")
const DATABASE_PATH = path.join(ABS_PATH, "/src/res/tmp_data/backup.json")

export class BackupDB{
    /*Simple SQLite database*/
    private DB: any;

    public create_database(){
        this.DB = new sqlite.Database(SQLITE_DATABASE_PATH)
    
        return new Promise<void>((resolve, reject) => {
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
    public delete_record(id: number){
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
    public select_record(id: number){
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
    public select_all(){
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
    public close_database(){
        return new Promise<void>((resolve, reject) => {
            this.DB.close()
            resolve()
        })
    }
    public delete_database(){
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

//
// worker part
//

parentPort.on("message", async (message) => {
    if (Array.isArray(message)){
        switch(message[0]){
            case "save-to-db":
                fs.writeFileSync(DATABASE_PATH, message[1])
                break
            case "read-db":
                let data = fs.readFileSync(DATABASE_PATH, "utf-8")
                parentPort.postMessage(["db-data", data])
                break
        }
    }
})