//
//Controller Setup JS
//

import sg from '../../source/sgui/sgui.js';
import { on_message, send_message } from '../../scripts/utils/ipc_wrapper.js';
import { frontend_vars, set_controller_buttons, set_controller_window, process_init_data } from '../utils/controller_utils.js'
import { FrontendFunctions, TableFunctions } from '../utils/set_utils.js'

var INIT_DATA = undefined
var desc_rendered = false
var clicked = false
var curr_desc = -1
var all_selected_scenarios = [];

//user selection variables
var selected_map = ""
var selected_aircraft_preset = ""
var selected_command_preset = ""
var selected_scenario = ""

var map_name = ""
var command_preset_name = ""
var aircraft_preset_name = ""

//element function binders definitions
var frontend;
var table_map;
var table_aircraft;
var table_command;
var table_scenario;
var table_scenario_adjustments_category;
var table_scenario_adjustments_weight;

/*
table setups
*/

function process_JSON(data){
    let res_str = ""

    let data_json = JSON.parse(data["content"])
    for (const [key, value] of Object.entries(data_json)) {
        //create header
        res_str += `<span class="man-header">${value["manufacturer"]}</span><br>`

        //create planes
        for (const [plane_key, plane_value] of Object.entries(value["planes"])){
            res_str += '<div class="plane">'
            res_str += `<span class="plane-header">${plane_value["name"]}`
            
            //add content switch
            res_str += `<i class="plane-content-switch fa-solid fa-caret-right"></i></span><br>`

            //add plane hidden content
            res_str += `<div class="plane-content">`
            for (const [plane_inner_key, plane_inner_value] of Object.entries(plane_value)){
                if (plane_inner_key == "name"){
                    continue
                }

                //more nested elements
                if (plane_inner_key == "roc" || plane_inner_key == "rod"){
                    res_str += `<b>${plane_inner_key}:</b><br>`
                    for (const [plane_ro_key, plane_ro_value] of Object.entries(plane_inner_value)){
                        res_str += `<b class="nested">${plane_ro_key}:</b> ${plane_ro_value}<br>`
                    }
                    continue
                }

                res_str += `<b>${plane_inner_key}:</b> ${plane_inner_value}<br>`
            }
            res_str += "</div><br>"
            res_str += "</div>"
        }
    }
    return res_str
}

function set_environment(){
    if (selected_map.length == 0){
        alert("You did not select any map")
        return
    }

    if (selected_aircraft_preset.length == 0){
        alert("You did not select any aircraft preset")
        return
    }

    if (selected_command_preset.length == 0){
        alert("You did not select any command preset")
        return
    }
    
    send_message("controller", "set-environment", [selected_map, selected_command_preset, selected_aircraft_preset, selected_scenario])
}

/*
    Processing initial data
*/

function process_set(data){
    if (map_name != undefined){
        //loaded from backup, change map name 
        document.getElementById("confirmresult-airport").innerHTML = map_name
        document.getElementById("confirmresult-command").innerHTML = command_preset_name
        document.getElementById("confirmresult-aircraft").innerHTML = aircraft_preset_name
    }

    //initial data generation from configs sent through IPC
    table_map.set_airports_list(data)
    table_aircraft.set_aircrafts_list(data)
    table_command.set_commands_list(data)

    frontend.listener_on_select()
    frontend.listener_on_description()
    frontend.listener_on_inspection("command")
    frontend.listener_on_inspection("aircraft")
}

/*
    function for window load
*/

function onload_set(){
    //create frontend binder
    frontend = new FrontendFunctions()

    //create all element binders
    table_map = new TableFunctions(sg.get_elem("default-table#airports"), "airports")
    table_aircraft = new TableFunctions(sg.get_elem("default-table#aircrafts"), "aircrafts")
    table_command = new TableFunctions(sg.get_elem("default-table#commands"), "commands")
    table_scenario = new TableFunctions(sg.get_elem("default-table#scenarios"), "scenario")
    table_scenario_adjustments_category = new TableFunctions(sg.get_elem("default-table#scenario-adjustments-category"))
    table_scenario_adjustments_weight = new TableFunctions(sg.get_elem("default-table#scenario-adjustments-weight"))

    table_map.set_header()
    table_aircraft.set_header()
    table_command.set_header()
    table_scenario.set_header()

    table_scenario_adjustments_category.set_adjustments_list("category")
    table_scenario_adjustments_weight.set_adjustments_list("weight")


    sg.on_click(() => {
        if (clicked){
            clicked = false
            return
        }

        if (desc_rendered){
            desc_rendered = false

            let popup_elem = document.querySelectorAll("div.popup-box")[curr_desc]

            if (popup_elem != undefined){
                document.querySelectorAll("div.popup-box")[curr_desc].style.visibility = "hidden"
            }

        }
    })

    sg.get_elem("#confirm").on_click(() => {
        set_environment()
    })

    sg.get_elem("#close-desc").on_click(() => {
        desc_rendered = false
        document.getElementsByClassName("desc-content")[0].style.visibility = "hidden"
    })

    //listeners
}

on_message("scenario-list", (data) => {
    all_selected_scenarios = data
    table_scenario.delete_list()
    table_scenario.set_scenarios_list(all_selected_scenarios)

    frontend.listener_on_select()
    frontend.listener_on_select_dropdown()
})

on_message("description-data", (data) => {
   sg.get_elem("#inner-content").innerHTML = process_JSON(data)
    //set all event listeners for inner content
    let plane_content_selectors = document.getElementsByClassName("plane-content-switch")
    for (let i = 0; i < plane_content_selectors.length; i++){
        plane_content_selectors[i].addEventListener("click", (event) => {
            if (plane_content_selectors[i].has_class("fa-caret-right")){
                //not visible
                event.target.parentNode.parentNode.childNodes[2].style.display = "block"
                plane_content_selectors[i].remove_class("fa-caret-right")
                plane_content_selectors[i].add_class("fa-caret-down")
            }
            else {
                //visible
                event.target.parentNode.parentNode.childNodes[2].style.display = "none"
                plane_content_selectors[i].remove_class("fa-caret-down")
                plane_content_selectors[i].add_class("fa-caret-right")
            }
        })
    }
})

sg.on_win_load(() => {
    set_controller_window(frontend_vars)
    set_controller_buttons()
    onload_set()

    window.electronAPI.on_init_info((data) => {
        INIT_DATA = data
        frontend.set_init_data(data)
        process_init_data(data)
        process_set(data)
    })
})