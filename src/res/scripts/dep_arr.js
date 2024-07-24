var plane_data = [] //data for storing all planes

function update_time(){
    let time_elem = document.getElementById("top-time-header")
    let date = new Date()

    let innerhtml = "Time: " + date

    time_elem.innerHTML = innerhtml

}

function update_row(idx, table_spec, type_spec, values){
    let row = document.getElementById(type_spec + table_spec).querySelectorAll("tr")
    console.log(row[idx])
    for (let i = 0; i < row[idx].children.length; i++){
        row[idx].children[i].innerHTML = values[i]
    }
}

function clear_row(idx, table_spec, type_spec){
    let row = document.getElementById(type_spec + table_spec).querySelectorAll("tr")
    console.log(row[idx])
    for (let i = 0; i < row[idx].children.length; i++){
        row[idx].children[i].innerHTML = ""
    }
}

function render_planes(){
    for (let i = 0; i < plane_data.length; i++){
        if(plane_data[i].departure.includes("ARP") || plane_data[i].departure.includes("RUNWAY")){
            //comes to departures list
            update_row(1, 1, "departures", [plane_data[i].arrival_time, plane_data[i].callsign, plane_data[i].departure.split("_")[0], plane_data[i].arrival.split("_")[0]])
        }
        else{
            //comes to arrivals list
            update_row(1, 1, "arrivals", [plane_data[i].arrival_time, plane_data[i].callsign, plane_data[i].departure.split("_")[0], plane_data[i].arrival.split("_")[0]])
        }
    }
}

window.onload = () => {
    setInterval(update_time, 1000)
    //clear_row(1, 1, "departures")
    //update_row(1, 1, "arrivals", ["test1", "test1", "test1", "test1"])
    send_message("dep_arr", "send-plane-data")
}

window.electronAPI.on_message("update-plane-db", (data) => {
    console.log(data)
    plane_data = data
    render_planes()
})