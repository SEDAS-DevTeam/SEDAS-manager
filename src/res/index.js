//generic code for every window
const ipcRender = require("electron").ipcRenderer

//main menu code
function to_settings(){
    ipcRender.send("redirect", "settings")
}

function start(){
    ipcRender.send("redirect", "main-program")
}

//settings window code
function to_menu(){
    ipcRender.send("redirect-settings", ["menu"])
}

//save settings
function save_settings(){
    //parse form data
    let loc_data = document.getElementById("location").value
    let limit_data = document.getElementById("limit").value
    let align_data = document.getElementById("alignment").value

    ipcRender.send("redirect-settings", ["save-settings", {
        "controller-loc": loc_data,
        "worker-spawn": limit_data,
        "alignment": align_data
    }])
}

//WORKER x CONTROLLER COMMUNICATION
function send_message(send_to, message){
    //glob_send_to = send_to

    ipcRender.send("message-redirect", [send_to, message])
    console.log("sent message")
}

window.addEventListener("load", () => {
    //when receiving incoming messages from other processes
    ipcRender.on("recv", (event, data) => {
        console.log("received message!")
        console.log(data)

        ipcRender.send("message-redirect", ["validate"])
    })
    //when receiving validation responses from other processes
    ipcRender.on("valid", (event, data) => {
        if("success"){
            console.log("success!")
        }
    })
})