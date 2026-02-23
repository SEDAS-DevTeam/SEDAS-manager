import {
    app_settings
} from "./comm_mock_up_data"

function log(message_data: string) {
    console.log(`[MOCK IPC] ${message_data}`)
}

function redirect(new_hash_redir: string) {
    setTimeout(() => {
            let idx = document.location.href.indexOf("#/")
        let curr_hash_redir = document.location.href.slice(idx)
        document.location.href = document.location.href.replace(curr_hash_redir, new_hash_redir)
    }, 500)
}

const MockReturns = {
    /*
        Functions
    */
    redirect_to_menu() {
        log("Redirecting to menu...")
        redirect("#/external/main")
    },
    redirect_to_settings() {
        log("Redirecting to settings...")
        redirect("#/external/settings")
    },
    redirect_to_main() {
        log("Redirecting to main...")
        redirect("#/controller/setup")
    },
    exit: () => log("Exiting app..."),
    save_settings: () => log("Saving settings..."),
    monitor_change_info() {
        log("TODO") // TODO
    },
    ping() {
        log("TODO") // TODO
    },
    send_info_settings: (electron_api: MockElectronAPI) => electron_api.emit("app-data", [app_settings]),
    send_info_controller: (electron_api: MockElectronAPI) => log("TODO: this is going to be a pain..."),
    send_info_worker: (electron_api: MockElectronAPI) => log("TODO")
}

export class MockElectronAPI {
    private listeners: Record<string, Function[]> = {}
    private readonly handlers: Record<string, Function> = {
        "redirect-to-menu": () => MockReturns.redirect_to_menu(),
        "redirect-to-settings": () => MockReturns.redirect_to_settings(),
        "redirect-to-main": () => MockReturns.redirect_to_main(),
        "save-settings": () => MockReturns.save_settings(),
        "monitor-change-info": () => console.log("iunno how to solve that"),
        "exit": () => MockReturns.exit(),
        "ping": () => log("ping!"),
        "send-info-settings": () => MockReturns.send_info_settings(this),
        "send-info-controller": () => MockReturns.send_info_controller(this),
        "send-info-worker": () => MockReturns.send_info_worker(this)
    }

    
    public send_message(sender: string, message_content: any[]) {
        log(`Received message from ${sender}: ${message_content}`)

        // ACK logic
        let channel = message_content[0]
        let ack_channel = channel + "-ack"
        this.emit(ack_channel, ["ACK"])

        if (this.handlers[channel]) this.handlers[channel]()
        else if (channel === "send-info") this.handlers[`${channel}-${sender}`](this)
        else log("Handler not recognized")
    }

    public on_message(channel: string, message_callback: Function) {
        if (channel.includes("-ack")){
            return // Include ack channels
        }

        if (!this.listeners[channel]) {
            this.listeners[channel] = []
        }
        this.listeners[channel].push(message_callback)
        log(`Listener registered for: ${channel}`)
    }

    public emit(channel: string, data: any) {
        if (this.listeners[channel]) {
            this.listeners[channel].forEach(callback => callback(data))
        }
    }
}