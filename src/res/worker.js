function process_map_data(data){
    console.log(data)
}

window.onload = () => {
    //render all essential things
    renderCanvas(1)
    renderCanvas(2)
    renderCanvas(3)

    renderAirspace([[50, 50], [50, 150], [350, 100], [200, 50], [50, 50]])
    renderRunway(80, 50, 180, 60)

    renderPlane(150, 150, 45)
    renderPlanePath([200, 200])

    document.querySelector("a#plankmsg").addEventListener("click", () => {
        window.electronAPI.send_message_redir("controller", ["test msg2"])
    })
    
    document.querySelector("a#plankmsg2").addEventListener("click", () => {
        renderPlane(50, 50)
    })
    
    document.querySelector("a#exit").addEventListener("click", () => {
        window.electronAPI.send_message("worker", ["exit"])
    })

    document.querySelector("a#stopbutton").addEventListener("click", () => {
        let elem = document.querySelector("a#stopbutton")
        if (elem.className == "stopsim"){
            elem.className = "startsim"
        }
        else if (elem.className == "startsim"){
            elem.className = "stopsim"
        }
    })
}

window.electronAPI.on_message_redir() //for handling all message redirects
window.electronAPI.on_map_data((data) => {
    process_map_data(data)
})