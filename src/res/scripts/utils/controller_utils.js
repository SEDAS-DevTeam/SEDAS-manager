import sg from '../../source/sgui/sgui.js';
import { on_message, send_message } from '../../scripts/utils/ipc_wrapper.js';

//variables
export var INIT_DATA = [] //storing all vital data like airport list, command preset list, aircraft preset list in current session
export var APP_DATA = undefined
export var frontend_vars = {}
export var monitor_objects = []

var path = window.location.pathname;
var page_name = path.split("/").pop().replace(".html", "");

function set_dropdown_buttons(){
    let drop_buttons = sg.get_elem(".drop-button")
    let drop_contents = sg.get_elem(".dropdown-content")

    if (drop_buttons == undefined){
        return
    }
    for (let i = 0; i < drop_buttons.length; i++){
        drop_buttons[i].on_click(() => {
            if (drop_buttons[i].has_class("fa-caret-down")){
                //dropdown is visible
                console.log("hide")
                drop_contents[i].hide()

                drop_buttons[i].remove_class("fa-caret-down")
                drop_buttons[i].add_class("fa-caret-right")

                frontend_vars[page_name][`dropdown${i}`] = "off"
            }
            else{
                //dropdown is hidden
                console.log("show")
                drop_contents[i].show()

                drop_buttons[i].remove_class("fa-caret-right")
                drop_buttons[i].add_class("fa-caret-down")

                frontend_vars[page_name][`dropdown${i}`] = "on"
            }

            send_message("controller", "rewrite-frontend-vars", [frontend_vars])
        })
    }
}

function process_init_data(data){
    APP_DATA = JSON.parse(data[3])

    map_name = data[4][0]
    command_preset_name = data[4][1]
    aircraft_preset_name = data[4][2]

    if (data.length == 0){
        alert("FATAL ERROR: There is nothing to process, no data sent")
    }

    INIT_DATA = data //save it into global variable

    //load frontend vars
    frontend_vars = data[7]

    let drop_buttons = sg.get_elem(".drop-button")
    let drop_contents = sg.get_elem(".dropdown-content")

    if (drop_buttons.length == 0){
        return
    }

    let i_drop = 0;
    for (const [key, value] of Object.entries(frontend_vars[page_name])) {
        if (key.includes("dropdown")){
            if (value == "on"){
                //visible
                drop_contents[i_drop].show()

                drop_buttons[i_drop].remove_class("fa-caret-right")
                drop_buttons[i_drop].add_class("fa-caret-down")
            }
            else{
                //hidden
                drop_contents[i_drop].hide()

                drop_buttons[i_drop].remove_class("fa-caret-down")
                drop_buttons[i_drop].add_class("fa-caret-right")
            }

            i_drop += 1
        }
    }
}

export function set_controller_window(frontend_vars){
    //window is loaded, send command to send all info from backend
    send_message("controller", "send-info")

    set_dropdown_buttons(frontend_vars)
}

export function set_controller_buttons(){
    sg.get_elem("#exit-button").on_click(() => {
        send_message("controller", "exit")
    })

    sg.get_elem("#menu-button").on_click(() => {
        send_message("controller", "redirect-to-menu")
    })

    sg.get_elem("#save-button").on_click(() => {
        alert("TODO")
    })
}

export function set_general_message_handlers(process_callback){
    on_message("map-points", (data) => {
        //TODO what?
    })

    on_message("map-checked", (data) => {
        let data_temp = JSON.parse(data)
        if (data_temp["user-check"]){
            sg.get_elem("#mask-sim").hide()
        }
        else{
            sg.get_elem("#mask-sim").show()
        }

        send_message("controller", "send-info")
    })

    window.electronAPI.on_init_info((data) => {
        process_init_data(data)
        process_callback(data)
    })
}