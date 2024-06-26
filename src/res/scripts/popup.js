//variables
var comm_channel;

function setup_confirm(content){

    let yes_button = document.createElement("button")
    yes_button.id = "yes"
    yes_button.innerHTML = "Yes"

    let no_button = document.createElement("button")
    no_button.id = "no"
    no_button.innerHTML = "No"

    yes_button.onclick = () => {
        console.log(comm_channel)
        window.electronAPI.send_message("popup-widget", [comm_channel, true])
    }

    no_button.onclick = () => {
        window.electronAPI.send_message("popup-widget", [comm_channel, false])
    }

    content.appendChild(yes_button)
    content.appendChild(no_button)
}

function setup_alert(content){
    let ok_button = document.createElement("button")
    ok_button.id = "yes"
    ok_button.innerHTML = "Ok"

    ok_button.onclick = () => {
        window.electronAPI.send_message("popup-widget", [comm_channel])
    }

    content.appendChild(ok_button)
}

function setup_prompt(content){
    //TODO
}

window.electronAPI.on_message("popup-init-info", (data) => {
    let content = document.getElementById("popup-content")

    document.getElementById("main-text").innerHTML = data[2]
    document.getElementsByClassName("norm-text")[0].innerHTML = data[3]
    comm_channel = data[1]

    switch(data[0]){
        case "confirm": {
            setup_confirm(content)
            break
        }
        case "alert": {
            setup_alert(content)
            break
        }
        case "prompt": {
            //TODO
            setup_prompt(content)
            break
        }
    }
})