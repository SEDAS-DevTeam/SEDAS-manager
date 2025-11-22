/*
  File hosting all the communicator classes (IPC, MSC, etc.)
*/

import md5 from "md5";
import utils from "./app_utils";

import { ipcMain } from "electron/main";
import { Worker } from "worker_threads"
import {
  Window,
  IPCwrapperInterface,
  MSCwrapperInterface
} from "./app_config"


//
// Wrapper for IPC communication between frontend and backend
//

export class IPCwrapper implements IPCwrapperInterface{
    /*
        Class that handles the IPC communication
    */
    public window_communication_configuration: any[] = [];
    private channel_communication_configuration: any[] = [];
    private open: boolean = true;
    
    private hash_message(message: any[] | string){
        return md5(JSON.stringify(message))
    }

    private send_message_to_window(destination: string, channel: string, data: any){
        for (let i = 0; i < this.window_communication_configuration.length; i++){
            if (destination == this.window_communication_configuration[i]["win_name"]){
                this.window_communication_configuration[i]["win"].send_message(channel, data)
            }
        }
    }

    // window registering
    public register_window(window: Window, window_name: string){
        this.window_communication_configuration.push({
            "id": window.window_id,
            "win_name": window_name,
            "win": window
        })
    }

    public unregister_window(window_id: string){
        for (let i = 0; i < this.window_communication_configuration.length; i++){
            if (this.window_communication_configuration[i]["id"] == window_id){
                this.window_communication_configuration.splice(i, 1)
                break
            }
        }
    }

    // channel registering
    public register_channel(channel_name: string, sender: string[], type: string, callback: Function){
        this.channel_communication_configuration.push({
            "channel": channel_name,
            "sender": sender,
            "type": type, //accepts unidirectional or bidirectional
            "callback": callback
        })
    }

    public set_all_listeners(){
        ipcMain.handle("message", async (event, data: any[]) => {
            if (!this.open){
                return
            }

            //incoming data from windows
            var sender: string = data[0]
            var channel: string = data[1][0]
            var message_data: any = data[1].slice(1, data[1].length - 1)
            var hash: string = data[1][data[1].length - 1]

            for(let i = 0; i < this.channel_communication_configuration.length; i++){
                //data in configuration
                let desired_sender: string = this.channel_communication_configuration[i]["sender"]
                let desired_channel: string = this.channel_communication_configuration[i]["channel"]

                let desired_hash: string = "";
                if (message_data.length == 0){
                    desired_hash = this.hash_message(desired_channel)
                }
                else{desired_hash = this.hash_message(message_data)}

                for(let i_sender = 0; i_sender < desired_sender.length; i_sender++){
                    if(desired_sender[i_sender].includes(sender) && channel == desired_channel){
                        //credentials are correct
                        if (hash == desired_hash){
                            let callback: Function = this.channel_communication_configuration[i]["callback"]
                            //message is correct
                            
                            //send back acknowledge and call callback
                            this.send_ack(sender, channel)
                            console.log("acknowledged")
                            callback(message_data)
                        }
                        else{
                            //message not correct -> writing into log & resend
                            this.send_nack(sender, channel)
                            console.log("not acknowledged")
                            console.log(sender)
                            console.log(channel)
                            console.log(desired_hash)
                            console.log(hash)
                        }
                    }
                }
            }
        })
    }

    public open_channels(){this.open = true}
    public close_channels(){this.open = false}

    public send_message(destination: string, channel: string, data: any){
        this.send_message_to_window(destination, channel, data)
    }

    public broadcast(type: string, channel: string, data: any){
        //broadcast to all windows
        if (type == "all"){
            for (let i = 0; i < this.window_communication_configuration.length; i++){
                this.window_communication_configuration[i]["win"].send_message(channel, data)
            }
        }
        else if (type == "workers"){
            for (let i = 0; i < this.window_communication_configuration.length; i++){
                let win_name: string = this.window_communication_configuration[i]["win_name"]
                if (win_name.includes("worker")){
                    this.window_communication_configuration[i]["win"].send_message(channel, data)
                }
            }
        }
    }

    private send_ack(destination: string, channel: string){
        this.send_message_to_window(destination, channel + "-ack", ["ACK"])
    }

    private send_nack(destination: string, channel: string){
        this.send_message_to_window(destination, channel + "-ack", ["NACK"])
    }
}

/*
    Wrapper for MSC (module socket communication) between modules like sedas_ai_backend
*/
export class MSCwrapper implements MSCwrapperInterface{
    public worker: Worker;
    private backend_settings: object;
    private module_config: object;
    public enabled_channels: string[] = [];

    constructor(worker_path: string,
                backend_settings: object,
                module_config_path: string) {
        this.worker = new Worker(worker_path)
        this.backend_settings = backend_settings
        this.module_config = utils.read_file_content(module_config_path)

        // send settings configuration
        this.send_message("action", "settings", this.backend_settings)

        // send module configuration
        this.send_message("action", "config", this.module_config)
    }

    public send_message(...message: any[]){
        let message_modified = message.map((elem) => {
            if (typeof elem !== "string") return JSON.stringify(elem)
            else return elem
        })
        if (this.enabled_channels.length == 0 && message[0] != "action"){
            console.log("Channels not yet enabled!")
            return;
        }
        this.worker.postMessage(message_modified)
    }

    public set_listener(callback: Function){
        this.worker.on("message", (message: string[]) => {
            console.log("Got message from backend!")
            console.log(message)
            callback(message)
        })
    }

    public terminate(){
        this.worker.terminate()
    }
}