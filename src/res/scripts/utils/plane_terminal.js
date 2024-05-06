/*
Script with airplane terminal functionalities
*/

function add_log(log_text){
    let elem =document.createElement("p")
    elem.id = "terminal-log"
    elem.innerText = log_text

    document.getElementById("terminal-content").children[0].appendChild(elem)
}

function remove_log(){
    document.getElementById("terminal-content").children[0].children[0].remove()
}

window.electronAPI.on_message("terminal-add", (comm_data) => {
    add_log(`${comm_data[2]}: ${comm_data[1]} ${comm_data[0]}`)
})