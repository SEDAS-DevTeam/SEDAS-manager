//
//Controller Setup JS
//

import sg from '../../source/sgui/sgui.js';
import { on_message, send_message } from '../../scripts/utils/ipc_wrapper.js';
import { frontend_vars, set_controller_buttons, set_controller_window, process_init_data } from '../utils/controller_utils.js'

/*
    Variables
*/

const head_airports = ["Scenario preset name", "Type", "Code", "Country", "City", "Description"]
const head_aircrafts = ["Aircraft preset name", "Inspect"]
const head_commands = ["Command preseet name", "Inspect"]
const head_scenarios = ["Scenario name", "category tags", "weight category tags"]

const head_category = ["AI", "HE", "GL", "AE"]
const head_weight_category = ["UL", "L", "M", "H", "S"]

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
    Classes
*/

class FrontendFunctions{
    constructor(){
        this.init_data = undefined;
    }

    #selection(event){
        let sel_id = event.target.id
        let prefix = sel_id.split("-")[0]
    
        let selection_path;
        let selection_name = "None";
        let selection_hash;

        switch(prefix){
            case "aircraft":
                for (let i = 0; i < this.init_data[5].length; i++){
                    if (sel_id == this.init_data[5][i]["hash"]){
                        selection_path = this.init_data[5][i]["path"]
                        selection_name = this.init_data[5][i]["name"]
                    }
                }
                sg.get_elem("#confirmresult-aircraft").innerHTML = selection_name
                selected_aircraft_preset = selection_path
                
                break
            case "command":
                for (let i = 0; i < this.init_data[6].length; i++){
                    if (sel_id == this.init_data[6][i]["hash"]){
                        selection_path = this.init_data[6][i]["path"]
                        selection_name = this.init_data[6][i]["name"]
                    }
                }
                sg.get_elem("#confirmresult-command").innerHTML = selection_name
                selected_command_preset = selection_path
    
                break
            case "airport":
                for (let i = 0; i < this.init_data[2].length; i++){
                    if (sel_id == this.init_data[2][i]["hash"]){
                        selection_path = this.init_data[2][i]["content"]["FILENAME"]
                        selection_name = this.init_data[2][i]["content"]["AIRPORT_NAME"]
                    }
                }
                sg.get_elem("#confirmresult-airport").innerHTML = selection_name
                selected_map = selection_path
    
                send_message("controller", "send-scenario-list", [selected_map])
                break
            case "scenario": {
                for (let i = 0; i < all_selected_scenarios.length; i++){
                    if (sel_id == all_selected_scenarios[i]["hash"]){
                        selection_name = all_selected_scenarios[i]["name"]
                        selection_hash = all_selected_scenarios[i]["hash"]
                        break
                    }
                }
    
                sg.get_elem("#confirmresult-scenario").innerHTML = selection_name
                selected_scenario = selection_hash
    
                break
            }
        }
    }

    set_init_data(init_data){
        this.init_data = init_data
    }

    show_description_airport(idx){
        let desc_data = sg.get_elem("div.popup-box")
        for (let i = 0; i < desc_data.length; i++){
            desc_data[i].hide()
        }
        desc_data[idx].show()
    
        desc_rendered = true
        clicked = true
        curr_desc = idx
    }

    ask_for_content(idx, type){
        send_message("controller", "json-description", [idx, type])
        desc_rendered = true
        clicked = true
        sg.get_elem(".desc-content").show()
    }

    listener_on_select(){
        let select_buttons = sg.get_elem(".tablebutton")
        for (let i = 0; i < select_buttons.length; i++){
            //remove click listeners (just in case)
            select_buttons[i].remove_listener("click")
            select_buttons[i].on_click((event) => this.#selection(event))
        }
    }

    listener_on_select_dropdown(){
        let select1 = sg.get_elem("#time-mode")
        //TODO
    }

    listener_on_description(){
        let desc_elem_airport = sg.get_elem("td i#airport")
        for(let i = 0; i < desc_elem_airport.length; i++){
            desc_elem_airport[i].on_click(() => {
                this.show_description_airport(i)
            })
        }
    }

    listener_on_inspection(selector){
        var desc_elem = sg.get_elem("td i#" + selector)
        for(let i = 0; i < desc_elem.length; i++){
            desc_elem[i].on_click(() => {
                this.ask_for_content(i, selector)
            })
        }
    }
}

class TableFunctions{
    constructor(element, selection_type = ""){
        this.element = element
        this.selection_type = selection_type
    }

    set_header(){
        let sel_header;
        switch(this.selection_type){
            case "airports":
                sel_header = head_airports
                break
            case "aircrafts":
                sel_header = head_aircrafts
                break
            case "commands":
                sel_header = head_commands
                break
            case "scenario":
                sel_header = head_scenarios
                break
        }
    
        for (let i = 0; i < sel_header.length + 1; i++){
            let spec_elem = this.element.children[0].children[0].children[i]
            if (i == sel_header.length){
                //append search tab
                spec_elem.innerHTML = '<th><form><input type="text" placeholder="Search.." name="search"></form></th>'
                break
            }
    
            spec_elem.innerHTML = sel_header[i]
        }
    }

    #add_colored_header(i, elem){
        if (elem.attributes.even_color == "true" && i == 0){
            elem.id = "color"
        }
    }

    /*
        Content generation
    */
    set_aircrafts_list(data){
        let aircraft_data = data[5]
        for (let i = 0; i < aircraft_data.length; i++){
            let record = sg.create_elem("tr", "", "", this.element.children[0])
            this.#add_colored_header(i, record)

            let name = aircraft_data[i]["name"]
    
            sg.create_elem("td", "", name, record)
            let inspect_obj = sg.create_elem("td", "", "", record)
            let select_obj = sg.create_elem("td", "", "", record)

            let inspect = sg.create_elem("i", "aircraft", "", inspect_obj)
            inspect.classList.add("fa")
            inspect.classList.add("fa-search")
    
            let select_button = sg.create_elem("s-button", aircraft_data[i]["hash"], "Select", select_obj)
            select_button.classList.add("tablebutton")
        }
    }

    set_commands_list(data){
        let command_data = data[6]
        for (let i = 0; i < command_data.length; i++){
            let record = sg.create_elem("tr", "", "", this.element.children[0])
            this.#add_colored_header(i, record)

            let name = command_data[i]["name"]
    
            sg.create_elem("td", "", name, record)
            let inspect_obj = sg.create_elem("td", "", "", record)
            let select_obj = sg.create_elem("td", "", "", record)

            let inspect = sg.create_elem("i", "command", "", inspect_obj)
            inspect.classList.add("fa")
            inspect.classList.add("fa-search")
    
            let select_button = sg.create_elem("s-button", command_data[i]["hash"], "Select", select_obj)
            select_button.classList.add("tablebutton")
        }
    }

    set_airports_list(data){
        let airport_data = data[2]
        for (let i = 0; i < airport_data.length; i++){
            let airport = airport_data[i]["content"]
            let airport_hash = airport_data[i]["hash"]
    
            let record = sg.create_elem("tr", "", "", this.element.children[0])
            this.#add_colored_header(i, record)
    
            let i2 = 0;
            for (const [key, value] of Object.entries(airport)) {
                if (i2 == 0){
                    //skip first FILENAME record
                    i2 += 1
                    continue
                }
                if (i2 == Object.keys(airport).length - 1){
                    //skip DESC
                    break
                }
    
                record.innerHTML += `<td>${value}</td>`
                i2 += 1
            }
    
            let desc_obj = sg.create_elem("td", "", "", record)
            let select_obj = sg.create_elem("td", "", "", record)

            let inspect = sg.create_elem("i", "airport", "", desc_obj)
            inspect.classList.add("fa");
            inspect.classList.add("fa-search")

            let popup_box = sg.create_elem("div", "", "", desc_obj)
            popup_box.classList.add("popup-box");
            
            let desc = sg.create_elem("s-text", "", airport["DESC"], popup_box)
            desc.classList.add("desc");

            let select_button = sg.create_elem("s-button", airport_hash, "Select", select_obj)
            select_button.classList.add("tablebutton")
    
            desc_obj.appendChild(popup_box)
            select_obj.appendChild(select_button)
        }
    }

    set_adjustments_list(type){
        let sel_category;
        switch(type){
            case "category": {
                sel_category = head_category
                break
            }
            case "weight": {
                sel_category = head_weight_category
                break
            }
        }

        let row = this.element.children[0].children[0]
        for (let i = 0; i < sel_category.length; i++){
            let col = row.children[i]
            let select = sg.create_elem("select", sel_category[i], "<option>True</option><option>False</option>", col)
            select.classList.add("sel-category")

            let text = sg.create_elem("s-text", "", sel_category[i], col)
            text.innerHTML = sel_category[i]
            text.classList.add("sel-text")
        }
    }

    set_scenarios_list(scenarios){
        //delete children
        this.delete_list()

        //hide warn text
        sg.get_elem("#map-not-selected").hide()
        for (let i = 0; i < scenarios.length; i++){
            let scenario_name = scenarios[i]["name"]
            let scenario_id = scenarios[i]["hash"]
            let scenario_content = scenarios[i]["content"]

            let scenario_weight_categories = scenario_content["wtc_category"]
            let scenario_categories = scenario_content["category"]
            
            console.log(scenario_weight_categories, scenario_categories)

            let record = sg.create_elem("tr", "", "", this.element.children[0])
            this.#add_colored_header(i, record)
            
            sg.create_elem("td", "", scenario_name, record)

            let category_tags_parent = sg.create_elem("td", "", "", record)
            for (let i = 0; i < scenario_categories.length; i++){
                category_tags_parent.innerHTML += `<span id="tag">${scenario_categories[i]}</span>`
            }

            let weight_category_tags_parent = sg.create_elem("td", "", "", record)
            for (let i = 0; i < scenario_weight_categories.length; i++){
                weight_category_tags_parent.innerHTML += `<span id="tag">${scenario_weight_categories[i]}</span>`
            }
            
            let select_parent = sg.create_elem("td", "", "", record)
            let select_button = sg.create_elem("s-button", scenario_id, "Select", select_parent)
            select_button.classList.add("tablebutton")
        }
    }

    delete_list(){
        for (let i = 1; i < this.element.children[0].children.length; i++){
            this.element.children[0].children[i].remove()
        }
    }
}

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

    sg.get_elem("#time-form").hide()
    sg.get_elem("#time-mode").on_change((event) => {
        if (event.target.value == "custom"){
            sg.get_elem("#time-form").show()
        }
        else{
            sg.get_elem("#time-form").hide()
        }
    })
}

on_message("scenario-list", (data) => {
    all_selected_scenarios = data
    table_scenario.delete_list()
    table_scenario.set_scenarios_list(all_selected_scenarios)

    frontend.listener_on_select()
    frontend.listener_on_select_dropdown()
})

on_message("description-data", (data) => {
    console.log(data)
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