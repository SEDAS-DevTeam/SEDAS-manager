import {parentPort} from "worker_threads"
import {spawn} from "node:child_process"

class Acai {
    private name: string;

    public constructor(name: string){
        this.name = name;
    }
}

class TerrainGeneration {
    private name: string;

    public constructor(name: string){
        this.name = name;
    }

    public gen_terrain(): string{
        return "test"
    }
}

/*OBJECTS*/
const event_gen = new Acai("balls")
const terrain_gen = new TerrainGeneration("balls")

parentPort.on("message", (message) => {
    switch(message){
        case "terrain":
            let out = terrain_gen.gen_terrain() //generate terrain 
            parentPort.postMessage(out)
        case "acai":
            break
    }
    if(message == "acai"){

    }
    else if(message == "terrain"){
    }
})