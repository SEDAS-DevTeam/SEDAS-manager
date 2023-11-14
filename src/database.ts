import * as sqlite from "sqlite3"

const DB = new sqlite.Database(":plane_info:")


export function CreateDatabase(){
    DB.run("CREATE TABLE PLANES (id INTEGER, callsign TEXT, heading INTEGER, level INTEGER, speed INTEGER, departure TEXT, arrival TEXT)");
}

export function InsertRecord(id: number, callsign: string, heading: number, 
                            level: number, speed: number, departure: string, arrival: string){
    
    DB.run(`INSERT INTO PLANES (${id}, ${callsign}, ${heading}, ${level}, ${speed}, ${departure}, ${arrival})`, 
        (err) => {
            if (err == null){
                console.log(err)
            }
        }
    )
}

export function DeleteRecord(id: number){
    DB.run(`DELETE FROM PLANES WHERE id='${id}'`, (err) => {
        if (err == null){
            console.log(err)
        }
    })
}

export function SelectRecord(id: number){
    DB.run(`SELECT * FROM PLANES WHERE id=${id}`, (err, row: any) => {
        if (err == null){
            console.log(err)
        }
        else{
            console.log(row)
        }
    })
}

export function CloseDatabase(){
    DB.run("DROP DATABASE PLANES")
    DB.close();
}