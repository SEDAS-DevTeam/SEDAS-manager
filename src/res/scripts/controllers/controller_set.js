//
//Controller Setup JS
//
const head_airports = ["Airport preset name", "Type", "Code", "Country", "City", "Description"]
const head_aircrafts = ["Aircraft preset name", "Inspect"]
const head_commands = ["Command preseet name", "Inspect"]

var desc_rendered = false
var clicked = false
var curr_desc = -1

//user selection variables
var selected_map = ""
var selected_aircraft_preset = ""
var selected_command_preset = ""
var selected_name = ""

var map_name = ""
var command_preset_name = ""
var aircraft_preset_name = ""

/*
table setups
*/
function set_env_table(elem){
    let sel_header;
    switch(elem.id){
        case "airports":
            sel_header = head_airports
            break
        case "aircrafts":
            sel_header = head_aircrafts
            break
        case "commands":
            sel_header = head_commands
            break
    }

    for (let i = 0; i < sel_header.length + 1; i++){
        let spec_elem = elem.children[0].children[0].children[i]
        if (i == sel_header.length){
            //append search tab
            spec_elem.innerHTML = '<th><form><input type="text" placeholder="Search.." name="search"></form></th>'
            break
        }

        spec_elem.innerHTML = sel_header[i]
    }
}

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
    
    window.electronAPI.send_message("controller", ["set-environment", selected_map, selected_command_preset, selected_aircraft_preset])
}

function regen_map(){
    window.electronAPI.send_message("controller", ["regenerate-map"])
}

/*
    Generating preset from sources
*/

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

        document.querySelector("default-table#aircrafts table").appendChild(record)
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

        document.querySelector("default-table#commands table").appendChild(record)
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

        document.querySelector("default-table#airports table").appendChild(record)
    }
}

/*
    Showing descriptions
*/

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

/*
    Processing initial data
*/

function process_specific(data, reset = false){
    console.log("did it go there?")
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
}

/*
    function for window load
*/

function onload_specific(){
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
        set_environment()
    })
    document.getElementById("regen-map").addEventListener("click", () => {
        regen_map()
    })

    document.getElementById("close-desc").addEventListener("click", () => {
        desc_rendered = false
        document.getElementsByClassName("desc-content")[0].style.visibility = "hidden"
    })

    //listeners

    window.electronAPI.on_message("description-data", (data) => {
        document.getElementById("inner-content").innerHTML = process_JSON(data)

        //set all event listeners for inner content
        let plane_content_selectors = document.getElementsByClassName("plane-content-switch")
        for (let i = 0; i < plane_content_selectors.length; i++){
            plane_content_selectors[i].addEventListener("click", (event) => {
                if (plane_content_selectors[i].classList.contains("fa-caret-right")){
                    //not visible
                    event.target.parentNode.parentNode.childNodes[2].style.display = "block"
                    plane_content_selectors[i].classList.remove("fa-caret-right")
                    plane_content_selectors[i].classList.add("fa-caret-down")
                }
                else {
                    //visible
                    event.target.parentNode.parentNode.childNodes[2].style.display = "none"
                    plane_content_selectors[i].classList.remove("fa-caret-down")
                    plane_content_selectors[i].classList.add("fa-caret-right")
                }
            })
        }
    })
}