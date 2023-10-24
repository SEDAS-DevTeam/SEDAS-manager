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

function comm_callback(data){
    console.log("data arrived")
}

//save settings
function save_settings(send_as){
    //parse form data
    let loc_data = document.getElementById("location").value
    let limit_data = document.getElementById("limit").value
    let align_data = document.getElementById("alignment").value

    let data = {
        "controller-loc": loc_data,
        "worker-spawn": limit_data,
        "alignment": align_data
    }

    comm.send_message(send_as, ['save-settings', JSON.stringify(data, null, 2)])
}

function airport_change(){
    alert("changed")
}

//when receiving incoming messages from other processes
ipcRender.on("message-redirect", (event, data) => {
    console.log("received message!")
    console.log(data)

    //ipcRender.send("message-redirect", ["validate"])
})