//
//Controller Monitors JS
//

import sg from '../../source/sgui/sgui.js';
import { send_message } from '../../scripts/utils/ipc_wrapper.js';
import { frontend_vars, set_controller_buttons, set_controller_window, process_init_data } from '../utils/controller_utils.js'
import { element_init, delete_monitor_elem } from '../utils/monitor_control.js'


var INIT_DATA = undefined
var monitor_objects = []
var monitor_data = [] //data for storing monitors
var init_data = []

function send_monitor_data(){
    var monitor_headers = sg.get_elem(".monitor-header")
    var monitor_options_elem = sg.get_elem(".monitor-functions")

    let data = []

    for (let i_mon = 0; i_mon < monitor_headers.length; i_mon++){
        let monitor_header = monitor_headers[i_mon].innerHTML
        var monitor_type = monitor_options_elem[i_mon].get_selected_elem();

        data.push({
            "name": monitor_header,
            "type": monitor_type
        })
    }

    console.log(data)
    send_message("controller", "monitor-change-info", [data])
}

/*
    Processing initial data
*/

function process_mon(data){
    init_data = data
    if (data[0] == "window-info"){
        monitor_data = JSON.parse(data[1])
        console.log(monitor_data)

        //initialize all the monitor objects
        for (let i = 0; i < monitor_data.length; i++){
            let x = i % 4
            let y = Math.round(i / 4)
            let elemParent = sg.get_elem("default-table#monitor-panel").children[0].children[y].children[x]

            element_init(monitor_data[i], i, elemParent)
        }
    }
}

/*
    function for window load
*/

function onload_mon(){
    //event listeners
    sg.get_elem("#res_to_def").on_click(() => {
        delete_monitor_elem()
        process_mon(init_data)
    })
    sg.get_elem("#apply-changes").on_click(() => {
        //apply changes and send them to backend
        send_monitor_data(monitor_objects)
    })

    //send data monitor data retrival request
    send_message("controller", "send-monitor-data")
}

sg.on_win_load(() => {
    set_controller_window(frontend_vars)
    set_controller_buttons()
    onload_mon()
    
    window.electronAPI.on_init_info((data) => {
        INIT_DATA = data
        process_init_data(data)
        process_mon(data)
    })
})