window.onload = () => {
    setInterval(update_time, 1000)
    //clear_row(1, 1, "departures")
    //update_row(1, 1, "arrivals", ["test1", "test1", "test1", "test1"])
}

function update_time(){
    let time_elem = document.getElementById("top-time-header")
    let date = new Date()

    let innerhtml = "Time: " + new Date(date)

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

