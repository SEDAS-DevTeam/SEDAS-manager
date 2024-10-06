import {parentPort} from "worker_threads"
import fs from "fs";
import {
    PATH_TO_SETTINGS
} from "../app_config"
import { NATO_ALPHA, NATO_NUMS } from "../atc_config"

//read JSON
const app_settings_raw = fs.readFileSync(PATH_TO_SETTINGS, "utf-8")
const app_settings = JSON.parse(app_settings_raw);

function command_processor(command_args: string[]){
    let response: string = ""

    //translate plane name back from nato
    let trans_plane_name: string = ""
    for (let i = 0; i < command_args[0].length; i++){
        if (NATO_ALPHA[command_args[0][i]] == undefined){
            trans_plane_name += `${NATO_NUMS[command_args[0][i]]} `
        }
        else{
            trans_plane_name += `${NATO_ALPHA[command_args[0][i]]} `
        }
    }

    //check commands
    switch (command_args[1]){
        case "change-heading":
            if (command_args[2].length == 2){
                command_args[2] = "0" + command_args[2]
            }

            //translate updated heading
            let trans_heading: string = ""
            for (let i = 0; i < command_args[2].length; i++){
                trans_heading += `${NATO_NUMS[command_args[2][i]]} `
            }

            response = `Fly heading ${trans_heading}, ${trans_plane_name}`
            break
    }

    return response
}

parentPort.on("message", (message) => {
    console.log(`backend said ${message}`)
})

/*
const core_server = net.createServer((socket) => {
    console.log('Client connected');

    // Handle data received from the client
    socket.on('data', (data: Buffer) => {
        let data_str: string = data.toString()
        console.log(data_str)
    
        let value_command = data_str.split(":");
        switch(value_command[0]){
            case "data":
                //check if plane exists
                let exists: boolean = false
                var args = value_command[1].split(" ")
                for (let i = 0; i < args.length; i++){
                    //strip input string of useless spaces
                    if (args[i].length == 0){
                        args.splice(i, 1)
                    }
                }
                var callsign = args[0]

                for (let i = 0; i < plane_data.length; i++){
                    if (plane_data[i].callsign == callsign){
                        exists = true
                        break
                    }
                }
                
                if (exists){
                    var message: string = command_processor(args)

                    //send message to generate speech
                    socket.write(`data-for-speech: ${message}\n`)
    
                    parentPort.postMessage("command:" + args.join(" ")) //post to main process for updates
                }
                break
            case "debug":
                console.log(value_command[1])
                break
        }
    });

    parentPort.on("message", async (message) => {
        if (Array.isArray(message)){
            switch(message[0]){
                //command messages with args
                case "debug":
                    logging = message[1]
                    break
                case "action":
                    switch(message[1]){
                        case "start-neural":
                            socket.write('action: start-neural\n')
                            break
                        case "stop-neural":
                            socket.write('action: stop-neural\n')
                            break
                        case "terrain":
                            console.log("terrain not working :(")
                            break
                        case "stop":
                            break
                        case "interrupt":
                            parentPort.postMessage("debug: SIGINT for core.py")
                            core_server.close()
                            core_process.kill()

                        //passing settings to backend process
                        case "settings":
                            socket.write(`settings ${message[2]}`)
                            break
                    }
                //data messages
                case "data":
                    plane_data = message[1]
                    break
            }
        }
    })

    // Handle client disconnect
    socket.on('end', () => {
        console.log('Client disconnected');
    });
});

const core_process = spawn("python3", [PATH_TO_CORE])

core_server.listen(PORT, '127.0.0.1', () => {
    console.log('Server listening on 127.0.0.1');
});
*/