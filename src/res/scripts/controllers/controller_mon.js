//
//Controller Monitors JS
//

var Windows = []
var monitor_objects = []
var monitor_data = [] //data for storing monitors

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
    send_message("controller", "monitor-change-info", [data])
}

/*
    Processing initial data
*/

function process_specific(data, reset = false){
    if (data[0] == "window-info"){
        monitor_data = JSON.parse(data[1])

        //initialize all the monitor objects
        for (let i = 0; i < monitor_data.length; i++){
            let x = i % 4
            let y = Math.round(i / 4)
            let elemParent = document.querySelector("default-table#monitor-panel").children[0].children[y].children[x]

            element_init(monitor_data[i], i, elemParent)
        }
    }
}

/*
    function for window load
*/

function onload_specific(){
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
        process_specific(INIT_DATA, true)
    })
    document.getElementById("apply-changes").addEventListener("click", () => {
        //apply changes and send them to backend
        send_monitor_data(monitor_objects)
    })

    //send data monitor data retrival request
    send_message("controller", "send-monitor-data")
}