//
//file for basic functions that every controller window has
//


var INIT_DATA = [] //storing all vital data like airport list, command preset list, aircraft preset list in current session
var APP_DATA = undefined

//frontend variables dict
var frontend_vars = {}

function process_init_data(data, reset = false){
    var path = window.location.pathname;
    var page_name = path.split("/").pop().replace(".html", "");

    //save app data
    APP_DATA = JSON.parse(data[3])

    map_name = data[4][0]
    command_preset_name = data[4][1]
    aircraft_preset_name = data[4][2]

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

    onload_specific() //onloads set for specific page

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

    //specific messages
    window.electronAPI.on_message_redir()
    window.electronAPI.on_init_info((data) => {
        process_init_data(data)
        process_specific(data)
    })
}