function log(message_data: string) {
    console.log(`[MOCK IPC] ${message_data}`)
}

const MockReturns = {
    exit() {
        log("Exiting app...")
    }
}

export class MockElectronAPI {
    private listeners: Record<string, Function[]> = {}
    
    public send_message(sender: string, message_content: any[]) {
        log(`Received message from ${sender}: ${message_content}`)

        // ACK logic
        let ack_channel = message_content[0] + "-ack"
        this.emit(ack_channel, ["ACK"])

        // Categorize based on channel
        switch (message_content[0]) {
            case "exit":
                MockReturns.exit()
        }
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

    private emit(channel: string, data: any) {
        if (this.listeners[channel]) {
            this.listeners[channel].forEach(callback => callback(data))
        }
    }
}