//variable definitions
const PLANE_LABELS = ["Heading", "Level", "Speed"]
const SPEED_STEP = 10
const ALT_STEP = 500
const HEAD_STEP = 10
const HEADING_VALS = [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 110, 120, 130, 140, 150, 160, 170, 180, 190, 200, 210, 220, 230, 240, 250, 260, 270, 280, 290, 300, 310, 320, 330, 340, 350]
var LEVEL_VALS = []
var SPEED_VALS = []
var ALL = []


var Windows = []
var monitor_objects = []
var INIT_DATA = [] //store it in this session
var APP_DATA = undefined

var desc_rendered = false
var curr_desc = -1
var selected_map = ""

var already_generated_names = []
var selected_name = ""
var all_points = []
var monitor_data = [] //data for storing monitors
var plane_data = [] //data for storing all planes

//selected time
var selected_hours = 0
var selected_mins = 0

/*
CHOOSING WHICH MAP TO GENERATE ON WHICH MONITOR
*/

function selection(idx){
    let sel_map = INIT_DATA[2][idx]["FILENAME"]
    let sel_map_name = INIT_DATA[2][idx]["AIRPORT_NAME"]

    document.getElementById("confirmresult").innerHTML = sel_map_name
    selected_map = sel_map

}

function render_map(){
    if (selected_map.length == 0){
        alert("You did not select any of these maps!")
        return
    }
    
    window.electronAPI.send_message("controller", ["set-map", selected_map])

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
    var plane_id;

    //look at local db
    for (let i = 0; i < plane_data.length; i++){
        if (plane_data[i].callsign == header){
            //found corresponding plane
            plane_id = plane_data[i].id
            console.log(plane_data[i].id)
        }
    }

    window.electronAPI.send_message("controller", ["plane-value-change", elem.classList[1], elem.innerHTML, plane_id])
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
            grid_row.classList.add("item" + i_row)

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
    if (document.getElementsByClassName("choice-text")[0].value.length != 0){
        return
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

function ai_control_change(elem){
    if (elem.checked){
        window.electronAPI.send_message("controller", ["ai-control-start"])

        //disable visibility on whole content
        document.getElementById("main-content").style.visibility = "hidden"
    }
    else{
        window.electronAPI.send_message("controller", ["ai-control-stop"])

        //enable visibility on whole content
        document.getElementById("main-content").style.visibility = "visible"
    }
}

/*
Controller_GEN features
*/

function generate_airports_from_sources(){
    let airport_data = INIT_DATA[2]
    for (let i = 0; i < airport_data.length; i++){
        let record = document.createElement("tr")

        let i2 = 0;
        for (const [key, value] of Object.entries(airport_data[i])) {
            if (i2 == 0){
                //skip first FILENAME record
                i2 += 1
                continue
            }
            if (i2 == Object.keys(airport_data[i]).length - 1){
                //skip DESC
                break
            }

            record.innerHTML += `<td>${value}</td>`
            i2 += 1
        }

        let desc_obj = document.createElement("td")
        let select_obj = document.createElement("td")
        let logo = document.createElement("i")
        let popup_box = document.createElement("div")
        let desc = document.createElement("p")
        let select_button = document.createElement("button")

        logo.classList.add("fa");
        logo.classList.add("fa-search")
        logo.setAttribute('aria-hidden', 'true');

        popup_box.classList.add("popup-box");
        select_button.classList.add("tablebutton")
        select_button.innerHTML = "Select"

        desc.classList.add("desc");
        desc.innerHTML = airport_data[i]["DESC"]

        popup_box.appendChild(desc)

        desc_obj.appendChild(logo)
        desc_obj.appendChild(popup_box)
        select_obj.appendChild(select_button)

        record.appendChild(desc_obj)
        record.appendChild(select_obj)

        document.querySelector("table").appendChild(record)
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

function show_description(idx){
    let desc_data = document.querySelectorAll("div.popup-box")
    for (let i = 0; i < desc_data.length; i++){
        desc_data[i].style.visibility = "hidden"
    }
    desc_data[idx].style.visibility = "visible"

    desc_rendered = true
    curr_desc = idx
}

function process_init_data(data, reset = false){
    //save app data
    APP_DATA = JSON.parse(data[3])

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

    var path = window.location.pathname;
    var page = path.split("/").pop();

    INIT_DATA = data //save it into global variable

    if (page.includes("controller_mon")){
        //when the controller page is redirected to monitors

        if (data[0] == "window-info"){
            monitor_data = JSON.parse(data[1])
            console.log(monitor_data)

            //initialize all the monitor objects
            for (let i = 0; i < monitor_data.length; i++){
                element_init(monitor_data[i], i)
            }
            
            //retrieve all monitors again, set them to draggable and draw connections
            let DOM_monitor_objects = document.getElementsByClassName("monitor-content")
            for (let i = 0; i < DOM_monitor_objects.length; i++){
                monitor_objects.push(DOM_monitor_objects[i])
                drag_element(monitor_objects[i], i)
            }
            draw_connection()
        }
    }
    else if (page.includes("controller_gen")){
        generate_airports_from_sources() //initial airport data generation from configs sent through IPC

        //add listeners to select buttons
        let select_buttons = document.getElementsByClassName("tablebutton")
        for (let i = 0; i < select_buttons.length; i++){
            select_buttons[i].addEventListener("click", () => {
                selection(i)
            })
        }

        //add event listener for every description button 
        var desc_elem = document.querySelectorAll("td i")
        for(let i = 0; i < desc_elem.length; i++){
            desc_elem[i].addEventListener("click", () => {
                show_description(i)
            })
        }
    }
    else if (page.includes("controller_sim")){
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
    }
}

window.onload = () => {
    //window is loaded, send command to send all info from backend
    window.electronAPI.send_message("controller", ["send-info"])

    var path = window.location.pathname;
    var page_name = path.split("/").pop();

    //didn't want to put it into separated files for better organisation
    switch(page_name){
        case "controller_gen.html":
            //event listeners

            document.addEventListener("click", () => {
                if (desc_rendered){
                    desc_rendered = false
                }
                else{
                    try{
                        document.querySelectorAll("div.popup-box")[curr_desc].style.visibility = "hidden"
                    } catch(error){
                        //do nothing (TODO, remove try catch)
                    }
                }
            })

            document.getElementById("confirm").addEventListener("click", () => {
                render_map()
            })
            break

        case "controller_mon.html":
            //set page content div height
            let page_content = document.getElementById("page-content")
            let top_content = document.getElementById("top-content")

            let absolute_height = window.screen.height
            let top_height = top_content.offsetHeight

            page_content.setAttribute("style",`height:${absolute_height - top_height}px`);

            //event listeners
            document.getElementById("res_to_def").addEventListener("click", () => {
                process_init_data(INIT_DATA, true)
            })
            document.getElementById("apply-changes").addEventListener("click", () => {
                //apply changes and send them to backend
                send_monitor_data(monitor_objects)
            })

            //send data monitor data retrival request
            window.electronAPI.send_message("controller", ["send-monitor-data"])

            break

        case "controller_sim.html":
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
                ai_control_change(event.target)
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
    }

    //set for all pages
    document.getElementById("main-header-button").addEventListener("click", () => {
        window.electronAPI.send_message("controller", ["exit"])
    })

    //general messages
    window.electronAPI.on_message("map-points", (data) => {
        process_monitor_points(data)
    })
    window.electronAPI.on_message("map-checked", (data) => {
        let data_temp = JSON.parse(data)
        if (data_temp["user-check"]){
            document.getElementById("mask").style.visibility = "hidden"
        }
        else{
            document.getElementById("mask").style.visibility = "visible"
        }
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
        let elem = document.querySelector("button#sim_button")
        if (data == "stopsim"){
            elem.className = "startsim"
            elem.innerHTML = "RUN"
        }
        else if (data == "startsim"){
            elem.className = "stopsim"
            elem.innerHTML = "STOP"
        }
    })
}