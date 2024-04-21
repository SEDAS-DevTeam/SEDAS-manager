//variable definitions

//plane labels
const PLANE_LABELS = ["Heading", "Level", "Speed"]
const PLANE_CLASSES = ["change-heading", "change-level", "change-speed"]

const SPEED_STEP = 10
const ALT_STEP = 500
const HEAD_STEP = 10
const HEADING_VALS = [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 110, 120, 130, 140, 150, 160, 170, 180, 190, 200, 210, 220, 230, 240, 250, 260, 270, 280, 290, 300, 310, 320, 330, 340, 350]
var LEVEL_VALS = []
var SPEED_VALS = []
var ALL = []

var Windows = []
var monitor_objects = []
var INIT_DATA = [] //storing all vital data like airport list, command preset list, aircraft preset list in current session
var APP_DATA = undefined

var desc_rendered = false
var clicked = false
var curr_desc = -1

//user selection variables
var selected_map = ""
var selected_aircraft_preset = ""
var selected_command_preset = ""
var selected_name = ""

var selected_hours = 0
var selected_mins = 0

var already_generated_names = []
var all_points = []
var monitor_data = [] //data for storing monitors
var plane_data = [] //data for storing all planes
var map_checked = false
var sim_running = false

//frontend variables dict
var frontend_vars = {}

//wiki variables
var sources = [
    "https://sedas-docs.readthedocs.io/en/latest/",
    "https://wiki.ivao.aero/en/home"
]

/*
CHOOSING WHICH MAP TO GENERATE ON WHICH MONITOR
*/

function selection(button_elem){
    let sel_id = button_elem.id
    let prefix = sel_id.split("-")[0]

    let selection_path;
    let selection_name;

    switch(prefix){
        case "aircraft":
            for (let i = 0; i < INIT_DATA[5].length; i++){
                if (sel_id == INIT_DATA[5][i]["hash"]){
                    selection_path = INIT_DATA[5][i]["path"]
                    selection_name = INIT_DATA[5][i]["name"]
                }
            }
            document.getElementById("confirmresult-aircraft").innerHTML = selection_name
            selected_aircraft_preset = selection_path
            
            break
        case "command":
            for (let i = 0; i < INIT_DATA[6].length; i++){
                if (sel_id == INIT_DATA[6][i]["hash"]){
                    selection_path = INIT_DATA[6][i]["path"]
                    selection_name = INIT_DATA[6][i]["name"]
                }
            }
            document.getElementById("confirmresult-command").innerHTML = selection_name
            selected_command_preset = selection_path

            break
        case "airport":
            for (let i = 0; i < INIT_DATA[2].length; i++){
                if (sel_id == INIT_DATA[2][i]["hash"]){
                    selection_path = INIT_DATA[2][i]["content"]["FILENAME"]
                    selection_name = INIT_DATA[2][i]["content"]["AIRPORT_NAME"]
                }
            }
            document.getElementById("confirmresult-airport").innerHTML = selection_name
            selected_map = selection_path
            break
    }

}

function render_map(){
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
    
    window.electronAPI.send_message("controller", ["set-environment", selected_map, selected_command_preset, selected_aircraft_preset])
}

/*
Controller_SIM features
*/

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
        "heading": heading,
        "level": level,
        "speed": speed,
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
Controller_SET features
*/

function regen_map(){
    window.electronAPI.send_message("controller", ["regenerate-map"])
}

function generate_aircrafts_from_sources(){
    let aircraft_data = INIT_DATA[5]
    for (let i = 0; i < aircraft_data.length; i++){
        let record = document.createElement("tr")
        let name = aircraft_data[i]["name"]

        let name_obj = document.createElement("td")
        name_obj.innerHTML = name
        let inspect_obj = document.createElement("td")
        let select_obj = document.createElement("td")
        let inspect = document.createElement("i")
        inspect.classList.add("fa")
        inspect.classList.add("fa-search")
        inspect.setAttribute("aria-hidden", "true")
        inspect.id = "aircraft"

        let select_button = document.createElement("button")
        select_button.classList.add("tablebutton")
        select_button.innerHTML = "Select"
        select_button.id = aircraft_data[i]["hash"]
        select_obj.append(select_button)
        inspect_obj.append(inspect)

        record.appendChild(name_obj)
        record.appendChild(inspect_obj)
        record.appendChild(select_obj)

        document.querySelector("table#aircrafts").appendChild(record)
    }
}

function generate_commands_from_sources(){
    let command_data = INIT_DATA[6]
    for (let i = 0; i < command_data.length; i++){
        let record = document.createElement("tr")
        let name = command_data[i]["name"]

        let name_obj = document.createElement("td")
        name_obj.innerHTML = name
        let inspect_obj = document.createElement("td")
        let select_obj = document.createElement("td")
        let inspect = document.createElement("i")
        inspect.classList.add("fa")
        inspect.classList.add("fa-search")
        inspect.setAttribute("aria-hidden", "true")
        inspect.id = "command"

        let select_button = document.createElement("button")
        select_button.classList.add("tablebutton")
        select_button.innerHTML = "Select"
        select_button.id = command_data[i]["hash"]
        select_obj.append(select_button)
        
        inspect_obj.appendChild(inspect)

        record.appendChild(name_obj)
        record.appendChild(inspect_obj)
        record.appendChild(select_obj)

        document.querySelector("table#commands").appendChild(record)
    }
}

function generate_airports_from_sources(){
    let airport_data = INIT_DATA[2]
    for (let i = 0; i < airport_data.length; i++){
        let airport = airport_data[i]["content"]
        let airport_hash = airport_data[i]["hash"]

        let record = document.createElement("tr")

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

        let desc_obj = document.createElement("td")
        let select_obj = document.createElement("td")
        let inspect = document.createElement("i")
        let popup_box = document.createElement("div")
        let desc = document.createElement("p")
        let select_button = document.createElement("button")

        inspect.classList.add("fa");
        inspect.classList.add("fa-search")
        inspect.setAttribute('aria-hidden', 'true')
        inspect.id = "airport"

        popup_box.classList.add("popup-box");
        select_button.classList.add("tablebutton")
        select_button.innerHTML = "Select"
        select_button.id = airport_hash

        desc.classList.add("desc");
        desc.innerHTML = airport["DESC"]

        popup_box.appendChild(desc)

        desc_obj.appendChild(inspect)
        desc_obj.appendChild(popup_box)
        select_obj.appendChild(select_button)

        record.appendChild(desc_obj)
        record.appendChild(select_obj)

        document.querySelector("table#airports").appendChild(record)
    }
}

/*
Controller_MON features
*/

function send_monitor_data(){
    var monitor_headers = document.getElementsByClassName("monitor-header")
    var monitor_options_elem = document.getElementsByClassName("monitor-functions")

    let data = []

    for (let i_mon = 0; i_mon < monitor_headers.length; i_mon++){
        let monitor_header = monitor_headers[i_mon].innerHTML
        var monitor_type = monitor_options_elem[i_mon].options[monitor_options_elem[i_mon].selectedIndex].value;

        data.push({
            "name": monitor_header,
            "type": monitor_type
        })
    }

    console.log(data)
    window.electronAPI.send_message("controller", ["monitor-change-info", data])
}

function show_description_airport(idx){
    let desc_data = document.querySelectorAll("div.popup-box")
    for (let i = 0; i < desc_data.length; i++){
        desc_data[i].style.visibility = "hidden"
    }
    desc_data[idx].style.visibility = "visible"

    desc_rendered = true
    clicked = true
    curr_desc = idx
}

function ask_for_content(idx, type){
    window.electronAPI.send_message("controller", ["json-description", idx, type])
    desc_rendered = true
    clicked = true
    document.getElementsByClassName("desc-content")[0].style.visibility = "visible"
}

function process_init_data(data, reset = false){
    var path = window.location.pathname;
    var page_name = path.split("/").pop().replace(".html", "");

    //save app data
    APP_DATA = JSON.parse(data[3])

    let map_name = data[4][0]
    let command_preset_name = data[4][1]
    let aircraft_preset_name = data[4][2]

    if (reset){
        //delete all monitors
        monitor_objects.forEach(elem => {
            elem.remove()
        })

        monitor_objects = []
    }

    if (data.length == 0){
        alert("FATAL ERROR: There is nothing to process, no data sent")
    }

    INIT_DATA = data //save it into global variable

    //load frontend vars
    frontend_vars = data[7]

    let drop_buttons = document.getElementsByClassName("drop-button")
    let drop_contents = document.getElementsByClassName("dropdown-content")

    let i_drop = 0;
    //maybe add more later?
    for (const [key, value] of Object.entries(frontend_vars[page_name])) {
        if (key.includes("dropdown")){
            if (value == "on"){
                //visible
                drop_contents[i_drop].style.display = "block"

                drop_buttons[i_drop].classList.remove("fa-caret-right")
                drop_buttons[i_drop].classList.add("fa-caret-down")
            }
            else{
                //hidden
                drop_contents[i_drop].style.display = "none"

                drop_buttons[i_drop].classList.remove("fa-caret-down")
                drop_buttons[i_drop].classList.add("fa-caret-right")
            }

            i_drop += 1
        }
    }

    switch(page_name){
        case "controller_mon": {
            //when the controller page is redirected to monitors

            if (data[0] == "window-info"){
                monitor_data = JSON.parse(data[1])

                //initialize all the monitor objects
                for (let i = 0; i < monitor_data.length; i++){
                    let x = i % 4
                    let y = Math.round(i / 4)
                    let elemParent = document.getElementById("monitor-panel").children[0].children[y].children[x]

                    element_init(monitor_data[i], i, elemParent)
                }
            }

            break
        }
        case "controller_set": {
            if (map_name != undefined){
                //loaded from backup, change map name 
                document.getElementById("confirmresult-airport").innerHTML = map_name
                document.getElementById("confirmresult-command").innerHTML = command_preset_name
                document.getElementById("confirmresult-aircraft").innerHTML = aircraft_preset_name
            }
    
            generate_airports_from_sources() //initial airport data generation from configs sent through IPC
            generate_aircrafts_from_sources() //initial aircraft data generation from json files sent through IPC
            generate_commands_from_sources() //initial commands data generation from json files sent through IPC
    
            //add listeners to select buttons
            let select_buttons = document.getElementsByClassName("tablebutton")
            for (let i = 0; i < select_buttons.length; i++){
                select_buttons[i].addEventListener("click", () => {
                    selection(select_buttons[i])
                })
            }
    
            //add listener to airport description button
            var desc_elem_airport = document.querySelectorAll("td i#airport")
            for(let i = 0; i < desc_elem_airport.length; i++){
                desc_elem_airport[i].addEventListener("click", () => {
                    show_description_airport(i)
                })
            }

            //add listener to command description button
            var desc_elem_command = document.querySelectorAll("td i#command")
            for(let i = 0; i < desc_elem_command.length; i++){
                desc_elem_command[i].addEventListener("click", () => {
                    ask_for_content(i, "command")
                })
            }

            //add listener to aircraft description button
            var desc_elem_aircraft = document.querySelectorAll("td i#aircraft")
            for(let i = 0; i < desc_elem_aircraft.length; i++){
                desc_elem_aircraft[i].addEventListener("click", () => {
                    ask_for_content(i, "aircraft")
                })
            }

            break
        }
        case "controller_sim": {
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
                monitor_option.value = `monitor${i}${monitor_data[i]["win_type"]}`
                monitor_option.innerHTML = `monitor ${i} (${monitor_data[i]["win_type"]})`
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

            break
        }
    }
}

window.onload = () => {
    var path = window.location.pathname;
    var page_name = path.split("/").pop().replace(".html", "");

    //window is loaded, send command to send all info from backend
    window.electronAPI.send_message("controller", ["send-info"])

    //set for all elements globally
    
    //set click event listeners for dropdown
    let drop_buttons = document.getElementsByClassName("drop-button")
    let drop_contents = document.getElementsByClassName("dropdown-content")
    for (let i = 0; i < drop_buttons.length; i++){
        drop_buttons[i].addEventListener("click", (event) => {
            if (event.target.classList.contains("fa-caret-down")){
                console.log("hide")
                //dropdown is visible
                drop_contents[i].style.display = "none"

                event.target.classList.remove("fa-caret-down")
                event.target.classList.add("fa-caret-right")

                frontend_vars[page_name][`dropdown${i}`] = "off"
            }
            else{
                console.log("show")
                //dropdown is hidden
                drop_contents[i].style.display = "block"

                event.target.classList.remove("fa-caret-right")
                event.target.classList.add("fa-caret-down")

                frontend_vars[page_name][`dropdown${i}`] = "on"
            }

            window.electronAPI.send_message("controller", ["rewrite-frontend-vars", frontend_vars])
        })
    }

    //didn't want to put it into separated files for better organisation
    switch(page_name){
        case "controller_set":
            //event listeners

            document.addEventListener("click", () => {
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

            document.getElementById("confirm").addEventListener("click", () => {
                render_map()
            })
            document.getElementById("regen-map").addEventListener("click", () => {
                regen_map()
            })

            document.getElementById("close-desc").addEventListener("click", () => {
                desc_rendered = false
                document.getElementsByClassName("desc-content")[0].style.visibility = "hidden"
            })

            break

        case "controller_mon":
            //set page content div height
            let page_content = document.getElementById("page-content")
            let top_content = document.getElementById("top-content")

            let absolute_height = window.screen.height
            let top_height = top_content.offsetHeight

            page_content.setAttribute("style",`height:${absolute_height - top_height}px`);

            //event listeners
            document.getElementById("res_to_def").addEventListener("click", () => {
                delete_monitor_elem()
                process_init_data(INIT_DATA, true)
            })
            document.getElementById("apply-changes").addEventListener("click", () => {
                //apply changes and send them to backend
                send_monitor_data(monitor_objects)
            })

            //send data monitor data retrival request
            window.electronAPI.send_message("controller", ["send-monitor-data"])

            break

        case "controller_sim":
            //running init code

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
            break
        case "wiki":
            let iframe_buttons = document.getElementsByClassName("change-iframe")

            //always try to load sedas docs
            if (window.navigator.onLine){
                document.getElementById("wiki-content").src = sources[0]
                iframe_buttons[0].classList.add("selected")
            }
            else{
                document.getElementById("wiki-content").src = "./internet.html"
                break //do not allow to set listeners for iframe buttons
            }

            for (let i = 0; i < iframe_buttons.length; i++){
                iframe_buttons[i].addEventListener("click", (event) => {
                    //remove all residual class lists
                    for (let elem of iframe_buttons) {
                        console.log(elem)
                        if (elem.classList.contains("selected")){
                            elem.classList.remove("selected")
                        }
                    }

                    event.target.classList.add("selected")

                    document.getElementById("wiki-content").src = sources[i]
                })
            }
            break
    }

    //set for all pages
    document.getElementById("exit-button").addEventListener("click", () => {
        window.electronAPI.send_message("controller", ["exit"])
    })

    document.getElementById("menu-button").addEventListener("click", () => {
        window.electronAPI.send_message("controller", ["redirect-to-menu"])
    })

    document.getElementById("save-button").addEventListener("click", () => {
        //TODO
        alert("TODO")
    })

    //general messages
    window.electronAPI.on_message("map-points", (data) => {
        process_monitor_points(data)
    })
    window.electronAPI.on_message("map-checked", (data) => {
        let data_temp = JSON.parse(data)
        if (data_temp["user-check"]){
            document.getElementById("mask-sim").style.visibility = "hidden"
        }
        else{
            document.getElementById("mask-sim").style.visibility = "visible"
        }

        map_checked = data_temp["user-check"]

        //send message to get new data
        window.electronAPI.send_message("controller", ["send-info"])
    })

    //plane messages
    window.electronAPI.on_message("update-plane-db", (data) => {
        plane_data = data
        console.log(plane_data)
        refresh_plane_data()
    })

    //specific messages
    window.electronAPI.on_message_redir()
    window.electronAPI.on_init_info((data) => {
        process_init_data(data)
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

    window.electronAPI.on_message("description-data", (data) => {
        document.getElementById("inner-content").innerHTML = process_JSON(data)
    })
}