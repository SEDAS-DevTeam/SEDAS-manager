const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
    //worker to controller communication
    send_message_redir: (send_to, message) => {
        ipcRenderer.send("message-redirect", [send_to, message])
        console.log("sent message")
    },
    //controller/worker (inherit) to main communication
    send_message: (send_as, message) => {
        ipcRenderer.invoke("message", [send_as, message])
        console.log("sent message to main")
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
        ipcRenderer.on('init-info', function (event, data) {
            switch(data[0]){
                case "window-info":
                    callback(data[1])
                    break
                
            }
        });
    }
})