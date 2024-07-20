//
//Controller Simulation JS
//

//plane labels
const PLANE_LABELS = ["Heading", "Level", "Speed"]
const PLANE_CLASSES = ["change-heading", "change-level", "change-speed"]

const SPEED_STEP = 10
const ALT_STEP = 500
const HEAD_STEP = 10
const HEADING_VALS = [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 110, 120, 130, 140, 150, 160, 170, 180, 190, 200, 210, 220, 230, 240, 250, 260, 270, 280, 290, 300, 310, 320, 330, 340, 350]

//other vars
var LEVEL_VALS = []
var SPEED_VALS = []
var ALL = []

var selected_hours = 0
var selected_mins = 0
var already_generated_names = []
var plane_data = [] //data for storing all planes
var all_points = []
var map_checked = false
var sim_running = false

//function definitions
function ChangeTime(inc_fact, i){
    switch(i){
        case 0:
            //increment hours
            selected_hours += inc_fact
            break
        case 1:
            //increment minutes
            selected_mins += inc_fact
            break
    }
    //check
    if (selected_hours > 24){
        selected_hours = 0
    }
    if (selected_mins > 60){
        selected_mins = 0
    }

    if (selected_hours < 0){
        selected_hours = 24
    }
    if (selected_mins < 0){
        selected_mins = 60
    }

    //better formatting
    let res_h = ""
    let res_m = ""

    if (selected_hours < 10){
        res_h = "0" + selected_hours.toString()
    }
    else{
        res_h = selected_hours.toString()
    }

    if (selected_mins < 10){
        res_m = "0" + selected_mins.toString()
    }
    else{
        res_m = selected_mins.toString()
    }

    document.getElementById("hours").innerHTML = res_h
    document.getElementById("minutes").innerHTML = res_m
}

function MoveSlider(idx){
    let range_value = document.getElementsByClassName("val-range")[idx].value
    let range_header = document.getElementsByClassName("val-out")[idx]

    range_header.innerHTML = range_value
}

function OnInput(elem){
    let choice_buttons = document.getElementsByClassName("choice-but")
    for (let i = 0; i < choice_buttons.length; i++){
        if (choice_buttons[i].classList.contains("selected-choice")){
            choice_buttons[i].classList.remove("selected-choice")
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
    var header_full = elem.parentNode.parentNode.querySelector("h2").innerHTML
    
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

    window.electronAPI.send_message("controller", ["plane-value-change", elem.classList[1], elem.innerHTML, plane_callsign])
}

function delete_plane(elem){
    var plane_id;
    var header_full = elem.parentNode.querySelector("h2").innerHTML
    
    header_full = header_full.split("(")[0]
    var header = header_full.substring(0, header_full.length - 1)

    //look at local db
    for (let i = 0; i < plane_data.length; i++){
        if (plane_data[i].callsign == header){
            //found corresponding plane
            plane_id = plane_data[i].id
        }
    }
    window.electronAPI.send_message("controller", ["plane-delete-record", plane_id])
}

function create_plane_elem(plane_id, plane_name, plane_departure, plane_arrival, plane_heading, plane_level, plane_speed){
    let other_plane_components = [plane_heading, plane_level, plane_speed]

    console.log("created plane element")

    let plane_cell = document.createElement("div")
    plane_cell.classList.add("plane-cell")
    plane_cell.innerHTML = `<div class="plane-cell-header" id="plane${plane_id}"><h2>${plane_name} (from ${plane_departure.split("_")[0]} to ${plane_arrival.split("_")[0]})</h2><i class="fa-solid fa-trash" id="delete-icon" onclick="delete_plane(event.target)"></i><div>`
    for(let i_row = 0; i_row < 3; i_row++){
        let grid_container = document.createElement("div")
        grid_container.classList.add("grid-container")

        for(let i_col = 0; i_col < ALL[i_row].length + 1; i_col++){
            let grid_row = document.createElement("div")
            grid_row.classList.add("grid-item")
            grid_container.appendChild(grid_row)

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
            grid_row.classList.add(PLANE_CLASSES[i_row])

            //add onclick event to them
            grid_row.addEventListener("click", (event) => {
                plane_value_change(event.target)
            })

            //added selected to already selected elements
            if (grid_row.innerHTML == other_plane_components[i_row]){
                grid_row.classList.add("selected")
            }
        }
        plane_cell.appendChild(grid_container)
    }
    document.getElementById("plane-list").appendChild(plane_cell)
}

function process_plane_data(){
    //name
    let name = selected_name
    if (selected_name == ""){
        alert("You did not select any planes!")
        return
    }

    let val_spans = document.getElementsByClassName("val-out")
    //heading
    let heading = parseInt(val_spans[0].innerHTML)

    //level
    let level = val_spans[1].innerHTML

    //speed
    let speed = val_spans[2].innerHTML

    //on which monitor to spawn
    let spawn_elem = document.getElementById("monitor_spawn")
    let spawn_on  = spawn_elem.options[spawn_elem.selectedIndex].value;

    //departure point
    let dep_elem = document.getElementById("departure_point")
    let dep_point = dep_elem.options[dep_elem.selectedIndex].value;

    //monitor_spawn
    let arr_elem = document.getElementById("arrival_point")
    let arr_point = arr_elem.options[arr_elem.selectedIndex].value;

    //arrival time
    let hours = document.getElementById("hours").innerHTML
    let mins = document.getElementById("minutes").innerHTML


    window.electronAPI.send_message("controller", ["spawn-plane", {
        "name": name,
        "heading": parseInt(heading),
        "level": parseInt(level),
        "speed": parseInt(speed),
        "monitor": spawn_on,
        "departure": dep_point,
        "arrival": arr_point,
        "arrival_time": `${hours}:${mins}`
    }])
}

function refresh_plane_data(){

    //delete currently generated GUI
    let plane_list = document.getElementById("plane-list")
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
    let buttons = document.getElementsByClassName("choice-but")
    let choice_text = document.getElementsByClassName("choice-text")[0]
    if (choice_text.value.length != 0){
        choice_text.id = ""
        choice_text.value = ""
    }

    if(buttons[n].classList.contains("selected-choice")){
        //this button was already selected
        buttons[n].classList.remove("selected-choice")
        selected_name = ""
        return
    }

    for (let i = 0; i < buttons.length; i++){
        if (buttons[i].classList.contains("selected-choice")){
            buttons[i].classList.remove("selected-choice")
        }
    }
    buttons[n].classList.add("selected-choice")
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

    let dep_select = document.getElementById("departure_point")
    for (let i = 0; i < all_points.length; i++){
        let option_elem = document.createElement("option")
        option_elem.innerHTML = `${all_points[i]["name"]} (${all_points[i]["type"]})`
        option_elem.value = `${all_points[i]["name"]}_${all_points[i]["type"]}`

        dep_select.appendChild(option_elem)
    }

    let arr_select = document.getElementById("arrival_point")
    for (let i = 0; i < all_points.length; i++){
        let option_elem = document.createElement("option")
        option_elem.innerHTML = `${all_points[i]["name"]} (${all_points[i]["type"]})`
        option_elem.value = `${all_points[i]["name"]}_${all_points[i]["type"]}`
        
        arr_select.appendChild(option_elem)
    }
}

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
    var choice_buttons = document.getElementsByClassName("choice-but")
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
    var monit_sel = document.getElementById("monitor_spawn");
    var selectedValue = monit_sel.options[monit_sel.selectedIndex].value;
    window.electronAPI.send_message("controller", ["get-points", selectedValue])
}

/*
    Switches
*/

function switch_change_ai(elem){
    if (elem.checked){
        window.electronAPI.send_message("controller", "ai-control-start")

        //disable visibility on whole content
        document.querySelectorAll("#main-content").forEach(elem => {
            elem.style.visibility = "hidden"
        })
    }
    else{
        window.electronAPI.send_message("controller", "ai-control-stop")

        //enable visibility on whole content
        document.querySelectorAll("#main-content").forEach(elem => {
            elem.style.visibility = "visible"
        })
    }
}

function switch_change_wind(elem){
    if (elem.checked){
        window.electronAPI.send_message("controller", "wind-control-start")

        //disable visibility on whole content
        document.querySelectorAll("#wind-control").forEach(elem => {
            elem.style.visibility = "visible"
        })
    }
    else{
        window.electronAPI.send_message("controller", "wind-control-stop")

        //enable visibility on whole content
        document.querySelectorAll("#wind-control").forEach(elem => {
            elem.style.visibility = "hidden"
        })
    }
}

/*
    Processing initial data
*/

function process_specific(data, reset = false){
    if (!map_checked){
        //user did not check, do nothing
        return 
    }

    let mask = document.getElementById("mask-plane-list")
    let warn_text = document.getElementById("sim-not-running")
    sim_running = data[8]["sim-running"]
    if (sim_running){
        mask.classList.remove("mask-unselect")
        mask.classList.add("mask-select")
        warn_text.style.display = "none"
    }
    else{
        mask.classList.remove("mask-select")
        mask.classList.add("mask-unselect")
        warn_text.style.display = "block"
    }

    //clear parent element innerHTML
    document.getElementById("monitor_spawn").innerHTML = ""

    var monitor_data = JSON.parse(data[1])

    for (let i = 0; i < monitor_data.length; i++){
        console.log(monitor_data[i])

        let monitor_option = document.createElement("option")
        monitor_option.value = `monitor${i}${monitor_data[i]["win"]["win_type"]}`
        monitor_option.innerHTML = `monitor ${i} (${monitor_data[i]["win"]["win_type"]})`
        document.getElementById("monitor_spawn").appendChild(monitor_option)
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
    var range_elements = document.getElementsByClassName("val-range")
    var label_elements = document.getElementsByClassName("val-out")

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

function onload_specific(){
    //set mask to whole page
    document.getElementById("mask-sim").style.height = `${document.body.scrollHeight}px`

    //check if user had already selected map
    window.electronAPI.send_message("controller", ["map-check"])

    random_generate_names()

    //event listeners
    document.getElementById("confirm-button-plane").addEventListener("click", () => {
        process_plane_data()
    })

    document.getElementsByClassName("randomize-but")[0].addEventListener("click", () => {
        random_generate_names()
    })

    document.getElementById("ai-control-switch").addEventListener("change", (event) => {
        switch_change_ai(event.target)
    })

    document.getElementById("wind-control-switch").addEventListener("change", (event) => {
        switch_change_wind(event.target, ["wind-control-start", "wind-control-stop", "#wind-control"])
    })

    document.getElementById("sim_button").addEventListener("click", (event) => {
        
        if (event.target.className == "stopsim"){
            window.electronAPI.send_message("controller", ["stop-sim"]) //stop simulation
        }
        else if (event.target.className == "startsim"){
            window.electronAPI.send_message("controller", ["start-sim"]) //start simulation
        }
    })

    let choice_buttons = document.getElementsByClassName("choice-but")
    for (let i = 0; i < choice_buttons.length; i++){
        choice_buttons[i].addEventListener("click", () => {
            on_choice_select(i)
        })
    }

    let ranges = document.getElementsByClassName("val-range")
    for (let i = 0; i < ranges.length; i++){
        ranges[i].addEventListener("input", () => {
            MoveSlider(i)
        })
    }

    document.getElementsByClassName("choice-text")[0].addEventListener("input", (event) => {
        OnInput(event.target)
    })

    //check whenever monitor_spawn is selected and change departure and arrival points accordingly
    document.getElementById("monitor_spawn").addEventListener("change", (event) => {
        change_according_points()
    })

    document.getElementById("departure_point").addEventListener("change", (event) => {
        //disable that specific point on other point select
        let selectedValue = event.target.options[event.target.selectedIndex].value;

        let children = document.getElementById("arrival_point").children
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

    document.getElementById("arrival_point").addEventListener("change", (event) => {
        //disable that specific point on other point select
        let selectedValue = event.target.options[event.target.selectedIndex].value;

        let children = document.getElementById("departure_point").children
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

    //time selection
    var up_arrows = document.getElementsByClassName("arr-up")
    for (let i = 0; i < up_arrows.length; i++){
        up_arrows[i].addEventListener("click", () => {
            ChangeTime(1, i)
        })
    }

    var down_arrows = document.getElementsByClassName("arr-down")
    for (let i = 0; i < down_arrows.length; i++){
        down_arrows[i].addEventListener("click", () => {
            ChangeTime(-1, i)
        })
    }

    //listeners

    //plane messages
    window.electronAPI.on_message("update-plane-db", (data) => {
        plane_data = data
        console.log(plane_data)
        refresh_plane_data()
    })

    window.electronAPI.on_message("sim-event", (data) => {
        let mask = document.getElementById("mask-plane-list")
        let warn_text = document.getElementById("sim-not-running")

        let elem = document.querySelector("button#sim_button")
        if (data == "stopsim"){
            elem.className = "startsim"
            elem.innerHTML = "RUN"

            sim_running = false

            mask.classList.remove("mask-select")
            mask.classList.add("mask-unselect")

            warn_text.style.display = "block"
        }
        else if (data == "startsim"){
            elem.className = "stopsim"
            elem.innerHTML = "STOP"

            sim_running = true

            mask.classList.remove("mask-unselect")
            mask.classList.add("mask-select")

            warn_text.style.display = "none"
        }
    })
}