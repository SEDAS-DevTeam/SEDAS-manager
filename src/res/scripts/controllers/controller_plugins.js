import sg from '../../source/sgui/sgui.js';
import { on_message, send_message } from '../../scripts/utils/ipc_wrapper.js';
import { frontend_vars, set_controller_buttons, set_controller_window, set_general_message_handlers } from '../utils/controller_utils.js'

//variables
var deg = 0
var initial_plugin_list = undefined; //for local plugins list

function refresh(elem){
    deg += 360
    elem.style.transform = 'rotate(' + deg + 'deg)'

    //TODO send request message to main
}

function onload_plugins(){
    send_message("controller", "get-plugin-list")
}

function process_plugins(data){
    //blank TODO
    console.log(data)
}

on_message("plugin-list", (data) => {
    if (data == undefined){
        return
    }
    initial_plugin_list = data

    let headers = ["Plugin", "Version", "Last updated"]
    let elem = sg.get_elem("#plugin-tab")

    //update all the elements
    for (let i = 0; i < headers.length + 1; i++){
        let spec_elem = elem.children[0].children[0].children[i]
        if (i == headers.length){
            //append search tab
            spec_elem.innerHTML = '<th><form><input type="text" placeholder="Search.." name="search"></form></th>'
            break
        }

        spec_elem.innerHTML = headers[i]
    }

    for (let i = 1; i < data.length + 1; i++){
        let spec_elem = elem.children[0].children[i]
        let args = Object.entries(data[i - 1]["data"])

        for (let i2 = 0; i2 < spec_elem.children.length; i2++){
            if (typeof(args[i2][1]) == "boolean"){
                let button_container = sg.create_elem("div", "", "", spec_elem.children[i2])
                let button = sg.create_elem("s-button", "", "", button_container)

                if (args[i2][1]){
                    //is installed
                    button.add_class("indicator-but")
                    button.add_class("installed")
                    button.innerHTML = "Installed"
                    button.id = data[i - 1]["header"]["id"]

                    let manage_button = sg.create_elem("s-button", "", "Manage plugin", button_container)
                    manage_button.add_class("indicator-but", "manage-but")
                    manage_button.add_class("manage")
                }
                else{
                    //isn't installed
                    button.classList.add("indicator-but")
                    button.classList.add("not-installed")
                    button.innerHTML = "Not installed"
                    button.id = data[i - 1]["header"]["id"]
                }
                continue
            }

            spec_elem.children[i2].innerHTML = args[i2][1]
        }
    }

    //reload all listeners
    let not_installed_buttons = sg.get_elem("button.not-installed")
    let manage_buttons = sg.get_elem("button.manage")
    
    for (let i = 0; i < not_installed_buttons.length; i++){
        not_installed_buttons[i].on_click(() => {
            send_message("controller", "install-plugin", [not_installed_buttons[i].id, initial_plugin_list[i]["data"]["plugin"]])
        })
    }

    for (let i = 0; i < manage_buttons.length; i++){
        manage_buttons[i].on_click(() => {
            console.log("manage!")
        })
    }
})

sg.on_win_load(() => {
    set_controller_window(frontend_vars)
    onload_plugins()
    set_controller_buttons()
    set_general_message_handlers(process_plugins)
})