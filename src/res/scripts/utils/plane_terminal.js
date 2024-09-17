/*
Script with airplane terminal functionalities
*/

export function add_log(log_text){
    let elem =document.createElement("p")
    elem.id = "terminal-log"
    elem.innerText = log_text

    document.getElementById("terminal-content").children[0].appendChild(elem)
}

export function remove_log(){
    document.getElementById("terminal-content").children[0].children[0].remove()
}