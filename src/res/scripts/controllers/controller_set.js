//
//Controller Setup JS
//
const head_airports = ["Scenario preset name", "Type", "Code", "Country", "City", "Description"]
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

//element function binders defined
var frontend;
var table_map;
var table_aircraft;
var table_command;

/*
table setups
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

/*
    Processing initial data
*/

function process_specific(data, reset = false){
    if (map_name != undefined){
        //loaded from backup, change map name 
        document.getElementById("confirmresult-airport").innerHTML = map_name
        document.getElementById("confirmresult-command").innerHTML = command_preset_name
        document.getElementById("confirmresult-aircraft").innerHTML = aircraft_preset_name
    }

    //initial data generation from configs sent through IPC
    table_map.set_airports_list()
    table_aircraft.set_aircrafts_list()
    table_command.set_commands_list()

    frontend.listener_on_select()
    frontend.listener_on_description()
    frontend.listener_on_inspection("command")
    frontend.listener_on_inspection("aircraft")
}

/*
    function for window load
*/

function onload_specific(){
    //create all element classes
    table_map = new TableFunctions("default-table#airports", "airports")
    table_aircraft = new TableFunctions("default-table#aircrafts", "aircrafts")
    table_command = new TableFunctions("default-table#commands", "commands")
    frontend = new FrontendFunctions()

    table_map.set_header()
    table_aircraft.set_header()
    table_command.set_header()

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