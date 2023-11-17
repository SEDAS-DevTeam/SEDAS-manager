var Windows = []
var monitor_objects = []
var INIT_DATA = [] //store it in this session

var desc_rendered = false
var curr_desc = -1
var selected_map = ""

var already_generated_names = []


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
    
    window.electronAPI.send_message("controller", ["render-map", selected_map])

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
    }
}


function process_plane_data(){

}

function on_choice_select(n){
    let buttons = document.getElementsByClassName("choice-but")
    if (document.getElementsByClassName("choice-text")[0].value.length != 0){
        return
    }

    if(buttons[n].classList.contains("selected-choice")){
        //this button was already selected
        buttons[n].classList.remove("selected-choice")
        return
    }

    for (let i = 0; i < buttons.length; i++){
        if (buttons[i].classList.contains("selected-choice")){
            buttons[i].classList.remove("selected-choice")
        }
    }
    buttons[n].classList.add("selected-choice")
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
            
            if (!generated_callsigns.includes(out)){
                generated_callsigns.push(out)
                choice_buttons[i].innerHTML = out

                break
            }
        }
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
            var monitor_data = JSON.parse(data[1])

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

        //event listeners
        let ranges = document.getElementsByClassName("val-range")
        for (let i = 0; i < ranges.length; i++){
            ranges[i].addEventListener("input", () => {
                MoveSlider(i)
            })
        }

        document.getElementsByClassName("choice-text")[0].addEventListener("input", (event) => {
            OnInput(event.target)
        })
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

            break

        case "controller_sim.html":
            //running init code
            random_generate_names()

            //event listeners
            document.getElementById("confirm-button-plane").addEventListener("click", () => {
                process_plane_data()
            })

            let choice_buttons = document.getElementsByClassName("choice-but")
            for (let i = 0; i < choice_buttons.length; i++){
                choice_buttons[i].addEventListener("click", () => {
                    on_choice_select(i)
                })
            }
    }

    //set for all pages
    document.getElementById("main-header-button").addEventListener("click", () => {
        window.electronAPI.send_message("controller", ["exit"])
    })

    window.electronAPI.on_message_redir()
    window.electronAPI.on_init_info((data) => {
        process_init_data(data)
    })
}