//generic code for every window
const ipcRender = require("electron").ipcRenderer

//worker to controller communication
function send_message_redir(send_to, message){
    ipcRender.send("message-redirect", [send_to, message])
    console.log("sent message")
}

//controller/worker (inherit) to main communication
function send_message(send_as, message){
    ipcRender.send("message", [send_as, message])
    console.log("sent message to main")
}

module.exports = {send_message, send_message_redir}