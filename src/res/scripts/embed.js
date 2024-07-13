window.onload = () => {
    document.getElementById("confirm-button").onclick = () => {
        let url_value = document.getElementById("url-form").value //TODO
        
        //check if hostname with this address exists
        window.electronAPI.send_message('embed', ['ping', url_value])

        document.getElementById("embed-iframe").src = url_value
    }
}

window.electronAPI.on_message("ping-status", (data) => {
    console.log(data)
    //received callback
    if (data){
        document.getElementById("err").innerHTML = ""
    }
    else{
        document.getElementById("err").innerHTML = "ERROR: Hostname not resolved, iframe not displayed"
    }
})