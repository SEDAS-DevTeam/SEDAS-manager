var Windows = []
var monitor_objects = []
var INIT_DATA = [] //store it in this session

var desc_rendered = false
var curr_desc = -1

/*
CHOOSING WHICH MAP TO GENERATE ON WHICH MONITOR
*/

function selection(idx){
    console.log(INIT_DATA)
}

function generate_airports_from_sources(){
    let airport_data = INIT_DATA[2]
    for (let i = 0; i < airport_data.length; i++){
        console.log(airport_data[i])
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
            //add event listener for every description button 
            var desc_elem = document.querySelectorAll("td i")
            for(let i = 0; i < desc_elem.length; i++){
                desc_elem[i].addEventListener("click", () => {
                    show_description(i)
                })
            }

            document.addEventListener("click", () => {
                if (desc_rendered){
                    desc_rendered = false
                }
                else{
                    document.querySelectorAll("div.popup-box")[curr_desc].style.visibility = "hidden"
                }
            })

            let select_buttons = document.getElementsByClassName("tablebutton")
            for (let i = 0; i < select_buttons.length; i++){
                select_buttons[i].addEventListener("click", () => {
                    selection(i)
                })
            }
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
            
            //event listeners
            document.getElementById("send_message_redir").addEventListener("click", () => {
                window.electronAPI.send_message_redir("worker0", ["test msg"])
            })
            break
        
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