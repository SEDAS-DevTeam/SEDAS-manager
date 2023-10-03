import {parentPort} from "worker_threads"

class SpeechRecognition {
    private name: string;

    public constructor(name: string){
        this.name = name;
    }

    public test(){
        console.log(this.name)
    }
}

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
}

/*OBJECTS*/
const speech_rec = new SpeechRecognition("balls")
const event_gen = new Acai("balls")
const terrain_gen = new TerrainGeneration("balls")

parentPort.on("message", (message) => {
    console.log(message)
    parentPort.postMessage("I am alive")
})