import {parentPort} from "worker_threads"
import net from "net"
import path from "path"

const HOST = "localhost"
const PORT = 65432

function check_call_arguments(abs_path: string, module_arguments: string[]): string[]{
    for (let i = 0; i < module_arguments.length; i++){
        if (path.isAbsolute(module_arguments[i]) || module_arguments[i].includes(path.sep)){
            module_arguments[i] = path.join(abs_path, module_arguments[i])
        }
    }
    return module_arguments
}

class Module{

}

var module_registry: Module[] = [];
var settings: object;

parentPort.on("message", (message) => {
    if (Array.isArray(message)){
        if (message[0] == "action"){
            // global actions for backend
            switch(message[1]){
                case "settings":
                    console.log("Data for settings")
                    console.log(message[2])

                    settings = JSON.parse(message[2])
                    break
                case "config":
                    console.log("Configuration for backend")
                    console.log(message[2])

                    // read configuration and setup parentPort message channel
                    let configuration: object = JSON.parse(message[2])
                    for (let i = 0; i < configuration["modules"].length; i++){
                        let module_config = configuration["modules"][i];

                        let call_path: string = path.join(settings["abs_path"], module_config["integration_path"])
                        check_call_arguments(settings["abs_path"], module_config["arguments"])

                        let name: string = module_config["name"]
                        let channel: string = module_config["channel"]
                        console.log("Script call path: " + call_path)
                    }
                    break
            }
        }
        else if (message[0] == "module"){
            // specific module-actions
        }

        switch(message[0]){
            case "data":
                break
            case "debug":
                console.log("Debug what?")
                console.log(message[1])
                break
            case "action":
                switch(message[1]){
                    case "settings":
                        break
                    case "start-neural":
                        console.log("Start neural!")
                        break
                    case "stop-neural":
                        console.log("Stop neural!")
                        break
                    case "interrupt":
                        break
                    case "terrain":
                        break
                }
                break
        }
    }
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