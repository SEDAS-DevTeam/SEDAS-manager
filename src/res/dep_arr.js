window.onload = () => {
    setInterval(update_time, 1000)
}

function update_time(){
    let time_elem = document.getElementById("top-time-header")
    let date = new Date()
    let date_utc = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(),
    date.getUTCDate(), date.getUTCHours(),
    date.getUTCMinutes(), date.getUTCSeconds());

    let innerhtml = "Time: " + new Date(date_utc).toUTCString()

    time_elem.innerHTML = innerhtml

}