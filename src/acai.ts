class SpeechRecognition {
    private name: string;

    public constructor(name: string){
        this.name = name;
    }

    public test(){
        console.log(this.name)
    }
}

class EventGeneration {
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
const event_gen = new EventGeneration("balls")
const terrain_gen = new TerrainGeneration("balls")

export {speech_rec, event_gen, terrain_gen}