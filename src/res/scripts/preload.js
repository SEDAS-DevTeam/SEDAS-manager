const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
    //worker to controller communication
    send_message_redir: (send_to, message) => {
        ipcRenderer.send("message-redirect", [send_to, message])
        console.log("sent message")
    },
    //controller/worker (inherit) to main communication
    send_message: (message_info, message) => {
        ipcRenderer.invoke("message", [message_info, message])
        console.log("sent message to main")
    },
    send_plane_info: (plane_info) => {
        ipcRenderer.invoke("plane-info", plane_info)
        console.log(plane_info)
    },
    on_plane_info: (callback) => {
        ipcRenderer.on("plane-info", (event, data) => {
            callback(data)
        })
    },
    //when receiving incoming messages from other processes
    on_message_redir: () => {
        ipcRenderer.on("message-redirect", (event, data) => {
            console.log("received message!")
            console.log(data)
        })
    },
    //getting initial info (number of monitors, etc.) from backend
    on_init_info: (callback) => {
        ipcRenderer.on('init-info', (event, data) => {
            callback(data)
        });
    },
    on_map_data: (callback) => {
        ipcRenderer.on('map-data', (event, data) => {
            callback(data)
        });
    },
    //on generic message send
    on_message: (channel, callback) => {
        ipcRenderer.on(channel, (event, data) => {
            callback(data)
        })
    }
})