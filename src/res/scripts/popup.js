import sg from '../source/sgui/sgui.js';
import { on_message,send_message } from '../scripts/utils/ipc_wrapper.js';

//variables
var comm_channel;

function setup_confirm(content){
    let yes_button = sg.create_elem("s-button", "yes", "Yes", content)
    let no_button = sg.create_elem("s-button", "no", "No", content)

    yes_button.on_click(() => {
        send_message("popup", comm_channel, [true])
    })
    no_button.on_click(() => {
        send_message("popup", comm_channel, [false])
    })
}

function setup_alert(content){
    let ok_button = sg.create_elem("s-button", "yes", "Ok", content)

    ok_button.on_click(() => {
        send_message("popup", comm_channel)
    })
}

function setup_prompt(content){
    //TODO
}

on_message("popup-init-info", (data) => {
    let content = sg.get_elem("#popup-content")

    sg.get_elem("s-header").innerHTML = data[2]
    sg.get_elem("s-text").innerHTML = data[3]
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