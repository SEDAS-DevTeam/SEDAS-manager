import {parentPort} from "worker_threads"
import net from "net"
import path from "path"
import { ChildProcessWithoutNullStreams, spawn } from "node:child_process";

// TODO: change from client to server

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

function send_message(channel: string, content: any){
    parentPort.postMessage([channel, JSON.stringify(content)])
}

function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

class Module{
    public name: string;
    public channel: string;
    public call_path: string;
    public arguments: string[];

    constructor(bin_path: string,
                args: string[],
                name: string,
                channel: string){
        this.channel = channel;
        this.name = name;
        this.arguments = args;
        this.call_path = bin_path;
    }

    public terminate(){
        console.log("Terminated module")
    }
}

class ModuleRegistry{
    public registry: Module[] = [];
    public active_processes: object[] = [];
    private client_socket: net.Socket;

    constructor(configuration: object){
        for (let i = 0; i < configuration["modules"].length; i++){
            let module_config = configuration["modules"][i];

            let call_path: string = path.join(settings["abs_path"], module_config["integration_path"])
            let call_args: string[] = check_call_arguments(settings["abs_path"], module_config["arguments"])

            let name: string = module_config["name"]
            let channel: string = module_config["channel"]


            // initialize module
            var module = new Module(call_path,
                                    call_args,
                                    name, 
                                    channel)
            this.registry.push(module)
        }
    }

    public delete_module(module_name: string){
        for (let i = 0; i < this.registry.length; i++){
            if (this.registry[i].name == module_name){
                // terminate module and delete from registry
                this.registry[i].terminate()
                this.registry.splice(i, 1)
                break
            }
        }
    }

    public get_enabled_channels(){
        var channels: string[] = []
        for (let i = 0; i < this.registry.length; i++){
            channels.push(this.registry[i].channel)
        }
        return channels
    }

    public check_call(message: any[]){
        for (let i = 0; i < this.registry.length; i++){
            if (this.registry[i].channel == message[1]){
                // channel corresponds with message channel
                if (this.registry[i].channel == "ai_backend"){
                    // SEDAS-AI-Backend
                    switch(message[2]){
                        case "data":
                            let data: object = JSON.parse(message[3])
                            break
                        case "start-mic":
                            console.log("Starting mic record")
                            this.message_modules("start-mic")
                            break
                        case "stop-mic":
                            console.log("Stopping mic record")
                            this.message_modules("stop-mic")
                            break
                        case "register":
                            console.log(`Registering pseudopilot: ${message[3]} ${message[4]}`)
                            this.message_modules(`register ${message[3]} ${message[4]}`)
                            break
                        case "unregister":
                            console.log("Unregistering pseudopilot")
                            this.message_modules(`unregister ${message[3]}`)
                    }
                }
            }
        }
    }

    public deploy_modules(){
        // modules deploy
        for (let i = 0; i < this.registry.length; i++){
            let path: string = this.registry[i].call_path;
            let args: string[] = this.registry[i].arguments;
            let name: string = this.registry[i].name;
            
            let process = spawn(path, args);
            this.active_processes.push({
                "name": name, 
                "process_obj": process
            })
        }

        // modules stdout check
        for (let i = 0; i < this.active_processes.length; i++){
            let name: string = this.active_processes[i]["name"]
            let process: ChildProcessWithoutNullStreams = this.active_processes[i]["process_obj"]

            process.stdout.on("data", (data) => {
                console.log(`${name}: ${data}`);
            })
            process.stderr.on("data", (data) => {
                console.log(`${name}: ${data}`);
            })
            process.on("close", (code) => {
                console.log(`${name} process exited!`)
            })
        }
    }

    public connect_to_server(){ // TODO: later change to create server
        // connect to SEDAS-AI-Backend
        this.client_socket = new net.Socket();
        this.client_socket.connect(PORT, HOST, () => {
            console.log("Connected to sedas_ai_backend!")
        })
        this.client_socket.on("data", (data) => {
            // TODO: just done for parsing SEDAS-AI-backend
            let comm_args: string[] = data.toString().split(" ")
            comm_args.unshift("sedas_ai")
            send_message("module", comm_args)
        })
        this.client_socket.on("close", () => {
            console.log("Connection closed")
        })
    }

    public message_modules(message: string){ // TODO: do more unified standard for more modules
        this.client_socket.write(message)
    }
    
    public async close_modules(){
        this.message_modules("quit")
        await sleep(1000) // wait one second for graceful exit
        this.client_socket.end()
    }
}

var module_registry: ModuleRegistry;
var settings: object;

parentPort.on("message", (message) => {
    if (Array.isArray(message)){
        if (message[0] == "action"){
            // global actions for backend
            switch(message[1]){
                case "settings":
                    console.log("Data for settings")
                    console.log(message[2])

                    settings = JSON.parse(message[2]) // TODO: add some more stuff to this
                    break
                case "config":
                    console.log("Configuration for backend")
                    console.log(message[2])

                    // read configuration and setup parentPort message channel
                    let configuration: object = JSON.parse(message[2])

                    // setup module registry
                    module_registry = new ModuleRegistry(configuration);
                    let enabled_channels: string[] = module_registry.get_enabled_channels()
                    send_message("channels", enabled_channels)
                    break
                case "debug":
                    console.log("Debug level: " + message[2]) // TODO: later
                    break
                case "stop":
                    console.log("Stopping all backend stuff")

                    // stopping all modules
                    module_registry.close_modules()
                    break
                case "start":
                    console.log("Starting backend work")

                    // running all modules
                    module_registry.deploy_modules()
                    module_registry.connect_to_server()
                    break
            }
        }
        else if (message[0] == "module"){
            // check specific module-actions
            module_registry.check_call(message)
        }
    }
})