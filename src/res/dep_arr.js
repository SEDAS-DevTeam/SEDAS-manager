window.onload = () => {
    setInterval(update_time, 1000)
}

function update_time(){
    let time_elem = document.getElementById("top-time-header")
    let date = new Date()

    let innerhtml = "Time: " + new Date(date)

    time_elem.innerHTML = innerhtml

}

function update_row(idx){

}

function clear_row(idx){

}

