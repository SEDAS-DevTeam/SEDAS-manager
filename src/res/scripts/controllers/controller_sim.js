//
//Controller Simulation JS
//

import sg from '../../source/sgui/sgui.js';
import { on_message, send_message } from '../../scripts/utils/ipc_wrapper.js';
import { add_log, remove_log } from '../../scripts/utils/plane_terminal.js'
import { frontend_vars, set_controller_buttons, set_controller_window, process_init_data, APP_DATA } from '../utils/controller_utils.js'

//plane labels
const PLANE_LABELS = ["Heading", "Level", "Speed"]
const PLANE_CLASSES = ["turn-any", "level-any", "speed-any"]

const SPEED_STEP = 10
const ALT_STEP = 500
const HEAD_STEP = 10
const HEADING_VALS = [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 110, 120, 130, 140, 150, 160, 170, 180, 190, 200, 210, 220, 230, 240, 250, 260, 270, 280, 290, 300, 310, 320, 330, 340, 350]

//other vars
var INIT_DATA = []
var LEVEL_VALS = []
var SPEED_VALS = []
var ALL = []

var already_generated_names = []
var plane_data = [] //data for storing all planes
var all_points = []
var map_checked = false
var sim_running = false
var selected_name = undefined

function MoveSlider(idx){
    let range_value = sg.get_elem(".val-range")[idx].value
    let range_header = sg.get_elem(".val-out")[idx]

    range_header.innerHTML = range_value
}

function OnInput(elem){
    let choice_buttons = sg.get_elem(".choice-but")
    for (let i = 0; i < choice_buttons.length; i++){
        if (choice_buttons[i].has_class("selected-choice")){
            choice_buttons[i].remove_class("selected-choice")
        }
    }

    elem.value = elem.value.toUpperCase()

    if(elem.value.length == 0){
        elem.id = ""
    }
    else{
        elem.id = "selected-choice-text"
        selected_name = elem.value
    }
}

function plane_value_change(elem){
    console.log(elem.parentNode.parentNode.children)
    var header_full = elem.parentNode.parentNode.children[0].innerText
    
    header_full = header_full.split("(")[0]
    var header = header_full.substring(0, header_full.length - 1)
    var plane_callsign;

    //look at local db
    for (let i = 0; i < plane_data.length; i++){
        if (plane_data[i].callsign == header){
            //found corresponding plane
            plane_callsign = plane_data[i].callsign
            console.log(plane_callsign)
        }
    }

    send_message("controller", "plane-value-change", [elem.classList[1], elem.innerHTML, plane_callsign])
}

function delete_plane(elem){
    var plane_id;
    var header_full = elem.parentNode.children[0].innerHTML
    console.log(header_full)
    
    header_full = header_full.split("(")[0]
    var header = header_full.substring(0, header_full.length - 1)

    //look at local db
    for (let i = 0; i < plane_data.length; i++){
        if (plane_data[i].callsign == header){
            //found corresponding plane
            plane_id = plane_data[i].id
        }
    }
    send_message("controller", "plane-delete-record", [plane_id])
}

function create_plane_elem(plane_id, plane_name, plane_departure, plane_arrival, plane_heading, plane_level, plane_speed){
    let other_plane_components = [plane_heading, plane_level, plane_speed]

    console.log("created plane element")

    let plane_cell = sg.create_elem("div", "", "", sg.get_elem("#plane-list"))
    let plane_cell_header = sg.create_elem("div", `plane${plane_id}`, "", plane_cell)
    plane_cell_header.add_class("plane-cell-header")

    sg.create_elem("s-header", "plane-header", `${plane_name} (from ${plane_departure.split(" ")[0]} to ${plane_arrival.split("_")[0]})`, plane_cell_header)
    let trash_icon = sg.create_elem("i", "delete-icon", "", plane_cell_header)
    trash_icon.add_class("fa-solid")
    trash_icon.add_class("fa-trash")
    trash_icon.on_click((event) => {
        delete_plane(event.target)
    })

    plane_cell.add_class("plane-cell")

    for(let i_row = 0; i_row < 3; i_row++){
        let grid_container = sg.create_elem("div", "", "", plane_cell)
        grid_container.add_class("grid-container")

        for(let i_col = 0; i_col < ALL[i_row].length + 1; i_col++){
            let grid_row = sg.create_elem("div", "", "", grid_container)
            grid_row.add_class("grid-item")

            if (i_col == 0){
                grid_row.id = "label"
                grid_row.innerHTML = PLANE_LABELS[i_row]
                continue
            }

            let elem_value = ALL[i_row][i_col - 1]
            if (elem_value == undefined){
                continue
            }
            grid_row.innerHTML = elem_value
            grid_row.add_class(PLANE_CLASSES[i_row])

            //add onclick event to them
            grid_row.on_click(() => {
                plane_value_change(grid_row)
            })

            //added selected to already selected elements
            if (grid_row.innerHTML == other_plane_components[i_row]){
                grid_row.add_class("selected")
            }
        }
    }
}

function process_plane_data(){
    //name
    let name = selected_name
    if (selected_name == ""){
        alert("You did not select any planes!")
        return
    }

    let val_spans = sg.get_elem(".val-out")
    //heading
    let heading = parseInt(val_spans[0].innerHTML)

    //level
    let level = val_spans[1].innerHTML

    //speed
    let speed = val_spans[2].innerHTML

    //on which monitor to spawn
    let spawn_elem = sg.get_elem("#monitor_spawn")
    let spawn_on  = spawn_elem.get_selected_elem()

    //departure point
    let dep_elem = sg.get_elem("#departure_point")
    let dep_point = dep_elem.get_selected_elem()

    //monitor_spawn
    let arr_elem = sg.get_elem("#arrival_point")
    let arr_point = arr_elem.get_selected_elem()

    //arrival time
    //TODO


    send_message("controller", "spawn-plane", [{
        "name": name,
        "heading": parseInt(heading),
        "level": parseInt(level),
        "speed": parseInt(speed),
        "monitor": spawn_on,
        "departure": dep_point,
        "arrival": arr_point,
        "arrival_time": ""
    }])
}

function refresh_plane_data(){

    //delete currently generated GUI
    let plane_list = sg.get_elem("#plane-list")
    if (plane_list == undefined){
        return
    }

    for (let i = 0; i < plane_list.children.length; i++){
        if (plane_list.children[i].tagName == "DIV"){
            plane_list.children[i].remove()
            i -= 1
        }
    }

    for (let i = 0; i < plane_data.length; i++){
        console.log(plane_data)
        create_plane_elem(plane_data[i].id, plane_data[i].callsign, plane_data[i].departure, 
            plane_data[i].arrival, plane_data[i].updated_heading, 
            plane_data[i].updated_level, plane_data[i].updated_speed)
    }
}

function on_choice_select(n){
    let buttons = sg.get_elem(".choice-but")
    let choice_text = sg.get_elem(".choice-text")
    if (choice_text.value.length != 0){
        choice_text.id = ""
        choice_text.value = ""
    }

    if(buttons[n].has_class("selected-choice")){
        //this button was already selected
        buttons[n].remove_class("selected-choice")
        selected_name = ""
        return
    }

    for (let i = 0; i < buttons.length; i++){
        if (buttons[i].has_class("selected-choice")){
            buttons[i].remove_class("selected-choice")
        }
    }
    buttons[n].add_class("selected-choice")
    selected_name = buttons[n].innerHTML
}

function process_monitor_points(monitor_map_data){
    //reset points
    all_points = []
    console.log(monitor_map_data)

    let data = JSON.parse(monitor_map_data)
    for (const [key, value] of Object.entries(data)) {
        if (value == "none"){
            continue
        }

        for (let i = 0; i < value.length; i++){
            all_points.push({
                "type": key,
                "name": value[i]["name"]
            })
        }
    }

    let dep_select = sg.get_elem("#departure_point")
    for (let i = 0; i < all_points.length; i++){
        let option_elem = sg.create_elem("option", "", `${all_points[i]["name"]} (${all_points[i]["type"]})`, dep_select)
        option_elem.value = `${all_points[i]["name"]}_${all_points[i]["type"]}`
    }

    let arr_select = sg.get_elem("#arrival_point")
    for (let i = 0; i < all_points.length; i++){
        let option_elem = sg.create_elem("option", "", `${all_points[i]["name"]} (${all_points[i]["type"]})`, arr_select)
        option_elem.value = `${all_points[i]["name"]}_${all_points[i]["type"]}`
    }
}

//TODO: move to backend
function random_generate_names(){
    /*
    CALLSIGN GENERATION RULES
    * must not exceed 7 characters
    * not any alphabet haracter after numericals
    * ICAO airline designators have to be used
    * 3 letters ICAO code and 4 is unique call sign
    */
    let generated_callsigns = []

    let chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    let nums = "0123456789"

    //random generate all buttons
    var choice_buttons = sg.get_elem(".choice-but")
    for (let i = 0; i < choice_buttons.length; i++){
        //unselect all buttons
        if (choice_buttons[i].classList.contains("selected-choice")){
            choice_buttons[i].classList = ["choice-but"]
        }

        while(true){
            let out = ""

            for (let i_code = 0; i_code < 3; i_code++){
                out += chars.charAt(Math.floor(Math.random() * chars.length))
            }

            //randomize selection of 4 or 3 digits
            var rand_len = Math.floor(Math.random() * 2)
            let i_sign_max = 0

            if (rand_len == 1) i_sign_max = 3
            else i_sign_max = 4

            for (let i_sign = 0; i_sign < i_sign_max; i_sign++){
                out += nums.charAt(Math.floor(Math.random() * nums.length))
            }
            
            if (!generated_callsigns.includes(out) && !already_generated_names.includes(out)){
                generated_callsigns.push(out)
                already_generated_names.push(out)
                choice_buttons[i].innerHTML = out
                selected_name = out
                break
            }
        }
    }
    selected_name = ""
}

function change_according_points(){
    var monit_sel = sg.get_elem("#monitor_spawn");
    var selectedValue = monit_sel.options[monit_sel.selectedIndex].value;
    send_message("controller", "get-points", [selectedValue])
}

/*
    Switches
*/

function switch_change_wind(elem){
    if (elem.checked){
        send_message("controller", "wind-control-start")

        //disable visibility on whole content
        sg.get_elem("div#wind-control").show()
    }
    else{
        send_message("controller", "wind-control-stop")

        //enable visibility on whole content
        sg.get_elem("div#wind-control").hide()
    }
}

/*
    Processing initial data
*/

function process_sim(data){
    if (!map_checked){
        //user did not check, do nothing
        return 
    }

    let mask = sg.get_elem("#mask-plane-list")
    let warn_text = sg.get_elem("#sim-not-running")

    sim_running = data[8]["sim-running"]
    if (sim_running){
        mask.remove_class("mask-unselect")
        mask.add_class("mask-select")
        warn_text.hide()
    }
    else{
        mask.remove_class("mask-select")
        mask.add_class("mask-unselect")
        warn_text.show()
    }

    //clear parent element innerHTML
    sg.get_elem("#monitor_spawn").innerHTML = ""

    var monitor_data = JSON.parse(data[1])

    for (let i = 0; i < monitor_data.length; i++){
        console.log(monitor_data[i])

        let monitor_option = sg.create_elem("option", "", `monitor ${i} (${monitor_data[i]["win"]["win_type"]})`, sg.get_elem("#monitor_spawn"))
        monitor_option.value = `monitor${i}${monitor_data[i]["win"]["win_type"]}`
    }

    //modify ranges according to APP DATA
    let min_speed = parseInt(APP_DATA["min_speed"])
    let max_speed = parseInt(APP_DATA["max_speed"])

    let min_altitude = parseInt(APP_DATA["min_alt"])
    let max_altitude = parseInt(APP_DATA["max_alt"])

    //modify ALL variable
    ALL = [HEADING_VALS, LEVEL_VALS, SPEED_VALS]


    for (let i = min_speed; i < max_speed; i += SPEED_STEP){
        SPEED_VALS.push(i)
    }
    for (let i = min_altitude; i <= max_altitude; i += ALT_STEP){
        LEVEL_VALS.push(i)
    }

    //setting attributes to ranges
    var range_elements = sg.get_elem(".val-range")
    var label_elements = sg.get_elem(".val-out")

    range_elements[0].min = Math.min(...HEADING_VALS)
    range_elements[0].max = Math.max(...HEADING_VALS)

    range_elements[1].min = Math.min(...LEVEL_VALS)
    range_elements[1].max = Math.max(...LEVEL_VALS)

    range_elements[2].min = Math.min(...SPEED_VALS)
    range_elements[2].max = Math.max(...SPEED_VALS)

    //set values for labels and ranges
    range_elements[0].value = Math.min(...HEADING_VALS)
    label_elements[0].innerHTML = Math.min(...HEADING_VALS)

    range_elements[1].value = Math.min(...LEVEL_VALS)
    label_elements[1].innerHTML = Math.min(...LEVEL_VALS)

    range_elements[2].value = Math.min(...SPEED_VALS)
    label_elements[2].innerHTML = Math.min(...SPEED_VALS)

    //set values steps
    range_elements[0].step = HEAD_STEP
    range_elements[1].step = ALT_STEP
    range_elements[2].step = SPEED_STEP

    //change arrival and departure points onload
    change_according_points()
}

/*
    function for window load
*/

function onload_sim(){
    //set mask to whole page
    sg.get_elem("#mask-sim").style.height = `${document.body.scrollHeight}px`

    //check if user had already selected map
    send_message("controller", "map-check")

    random_generate_names()

    //event listeners
    sg.get_elem("#confirm-button-plane").on_click(() => {
        process_plane_data()
    })

    sg.get_elem(".randomize-but").on_click(() => {
        random_generate_names()
    })

    sg.get_elem("#wind-control-switch").on_change((event) => {
        switch_change_wind(event.target, ["wind-control-start", "wind-control-stop", "#wind-control"])
    })

    sg.get_elem("#sim_button").on_click((event) => {
        if (event.target.has_class("stopsim")){
            send_message("controller", "stop-sim") //stop simulation
        }
        else if (event.target.has_class("startsim")){
            send_message("controller", "start-sim") //start simulation
        }
    })

    let choice_buttons = sg.get_elem(".choice-but")
    for (let i = 0; i < choice_buttons.length; i++){
        choice_buttons[i].on_click(() => {
            on_choice_select(i)
        })
    }

    let ranges = sg.get_elem(".val-range")
    for (let i = 0; i < ranges.length; i++){
        ranges[i].on_input(() => {
            MoveSlider(i)
        })
    }

    sg.get_elem(".choice-text").on_input((event) => {
        OnInput(event.target)
    })

    //check whenever monitor_spawn is selected and change departure and arrival points accordingly
    sg.get_elem("#monitor_spawn").on_change(() => {
        change_according_points()
    })

    sg.get_elem("#departure_point").on_change((event) => {
        //disable that specific point on other point select
        let selectedValue = event.target.get_selected_elem()

        let children = sg.get_elem("#arrival_point").children
        for (let i = 0; i < children.length; i++){
            children[i].disabled = false
        }

        for (let i = 0; i < children.length; i++){
            if (selectedValue == children[i].value){
                children[i].disabled = true
                break
            }
        }
    })

    sg.get_elem("#arrival_point").on_change((event) => {
        //disable that specific point on other point select
        let selectedValue = event.target.get_selected_elem()

        let children = sg.get_elem("#departure_point").children
        for (let i = 0; i < children.length; i++){
            children[i].disabled = false
        }

        for (let i = 0; i < children.length; i++){
            if (selectedValue == children[i].value){
                children[i].disabled = true
                break
            }
        }
    })
}

on_message("update-plane-db", (data) => {
    plane_data = data
    console.log(plane_data)
    refresh_plane_data()
})

on_message("sim-event", (data) => {
    let mask = sg.get_elem("#mask-plane-list")
    let warn_text = sg.get_elem("#sim-not-running")

    let elem = sg.get_elem("s-button#sim_button")
    if (data == "stopsim"){
        elem.className = "startsim"
        elem.innerHTML = "RUN"

        sim_running = false

        mask.remove_class("mask-select")
        mask.add_class("mask-unselect")

        warn_text.show()
    }
    else if (data == "startsim"){
        elem.className = "stopsim"
        elem.innerHTML = "STOP"

        sim_running = true

        mask.remove_class("mask-unselect")
        mask.add_class("mask-select")

        warn_text.hide()
    }
})

on_message("terminal-add", (comm_data) => {
    add_log(`${comm_data[2]}: ${comm_data[1]} ${comm_data[0]}`)
})

on_message("map-points", (data) => {
    process_monitor_points(data)
})

on_message("map-checked", (data) => {
    let data_temp = JSON.parse(data)
    if (data_temp["user-check"]){
        sg.get_elem("#mask-sim").hide()
    }
    else{
        sg.get_elem("#mask-sim").show()
    }

    map_checked = data_temp["user-check"]

    //send message to get new data
    send_message("controller", "send-info")
})

sg.on_win_load(() => {
    set_controller_window(frontend_vars)
    set_controller_buttons()
    onload_sim()

    window.electronAPI.on_init_info((data) => {
        INIT_DATA = data
        process_init_data(data)
        process_sim(data)
    })
})