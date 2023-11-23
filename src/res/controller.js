//variable definitions
const PLANE_LABELS = ["Heading", "Level", "Speed"]
const HEADING_VALS = [100, 110, 120, 130, 140, 150, 160, 170, 180, 190, 200]
const LEVEL_VALS = [100, 110, 120, 130, 140, 150, 160, 170, 180, 190, 200]
const SPEED_VALS = [100, 110, 120, 130, 140, 150, 160, 170, 180, 190, 200]
const ALL = [HEADING_VALS, LEVEL_VALS, SPEED_VALS]

var Windows = []
var monitor_objects = []
var INIT_DATA = [] //store it in this session

var desc_rendered = false
var curr_desc = -1
var selected_map = ""

var already_generated_names = []
var selected_name = ""
var all_points = []
var monitor_data = [] //data for storing monitors

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
    var other_elem = elem.parentNode.children
    for (let i = 0; i < other_elem.length; i++){
        if (other_elem[i].classList[1] == elem.classList[1]){
            if(other_elem[i].classList.contains("selected")){
                other_elem[i].classList.remove("selected")
            }
        }
    }

    elem.classList.add("selected")
    window.electronAPI.send_message("controller", ["plane-value-change", elem.classList[1], elem.innerHTML])
}

function create_plane_elem(plane_name, plane_departure, plane_arrival, plane_heading, plane_level, plane_speed){
    let grid_container = document.createElement("div")
    grid_container.classList.add("grid-container")

    let other_plane_components = [plane_heading, plane_level, plane_speed]

    let plane_cell = document.createElement("div")
    plane_cell.classList.add("plane-cell")
    plane_cell.innerHTML = `<h2>${plane_name} (from ${plane_departure.split("_")[0]} to ${plane_arrival.split("_")[0]})</h2>`

    for(let i_row = 0; i_row < 3; i_row++){
        for(let i_col = 0; i_col < 12; i_col++){
            let grid_row = document.createElement("div")
            grid_row.classList.add("grid-item")
            grid_container.appendChild(grid_row)

            if (i_col == 0){
                grid_row.id = "label"
                grid_row.innerHTML = PLANE_LABELS[i_row]
                continue
            }

            grid_row.innerHTML = ALL[i_row][i_col - 1]
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
    }
    plane_cell.appendChild(grid_container)
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
    let heading = val_spans[0].innerHTML

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


    window.electronAPI.send_message("controller", ["spawn-plane", {
        "name": name,
        "heading": heading,
        "level": level,
        "speed": speed,
        "monitor": spawn_on,
        "departure": dep_point,
        "arrival": arr_point
    }])

    //render on controller screen
    create_plane_elem(name, dep_point, arr_point, heading, level, speed)
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

    //specific messages
    window.electronAPI.on_message_redir()
    window.electronAPI.on_init_info((data) => {
        process_init_data(data)
    })
}