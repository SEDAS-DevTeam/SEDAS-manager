var map_data = undefined;

function process_map_data(data, type){
    map_data = data //set map data to global on session

    let spec_data = map_data[0][type] //load map data type (ACC/APP/TWR)

    //canvas rendering part
    renderCanvas(1)
    renderCanvas(2)
    renderCanvas(3)

    for (const [key, value] of Object.entries(spec_data)) {
        if (value != "none"){
            switch(key){
                case "ARP":
                    //rendering ARP for ACC/APP
                    renderAirport(value[0]["x"], value[0]["y"])
                    break
                case "RUNWAY":
                    //rendering runway for TWR
                    for (let i = 0; i < value.length; i++){
                        renderRunway(value[i]["x1"], value[i]["y1"], value[i]["x2"], value[i]["y2"])
                    }
                    break
                case "POINTS":
                    //rendering all other route points
                    for (let i = 0; i < value.length; i++){
                        renderPoint(value[i]["x"], value[i]["y"], value[i]["name"], "white")
                    }
                    break
                case "SID":
                    //rendering SID instruments
                    for (let i = 0; i < value.length; i++){
                        renderPoint(value[i]["x"], value[i]["y"], value[i]["name"], "white")
                    }
                    break
                case "STAR":
                    //rendering STAR instruments
                    for (let i = 0; i < value.length; i++){
                        renderPoint(value[i]["x"], value[i]["y"], value[i]["name"], "white")
                    }
                    break
                case "SECTOR":
                    //rendering airspace
                    let SECTOR_points = []
                    for (let i = 0; i < value.length; i++){
                        SECTOR_points.push([value[i]["x"], value[i]["y"]])
                    }
                    renderAirspace(AIRSPACE_SECTOR_COLOR, SECTOR_points)

                    break
                case "TERRAIN":
                    //rendering terrain
                    let TERRAIN_points = []
                    for (let i = 0; i < value.length; i++){
                        TERRAIN_points.push([value[i]["x"], value[i]["y"]])
                    }
                    renderAirspace("black", TERRAIN_points)
                    break
                case "RESTRICTED_AREA":
                    //rendering no-fly zones
                    let AREA_points = []
                    for (let i = 0; i < value.length; i++){
                        AREA_points.push([value[i]["x"], value[i]["y"]])
                    }
                    renderAirspace("black", AREA_points)
                    break
            }
        }
    }
}

window.onload = () => {
    //render all essential things
    renderCanvas(1)
    renderCanvas(2)
    renderCanvas(3)

    //render empty map placeholder on init
    renderText(50, 100, "Empty map placeholder", "white")

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
            elem.innerHTML = "RUN"
        }
        else if (elem.className == "startsim"){
            elem.className = "stopsim"
            elem.innerHTML = "STOP"
        }
    })
}

window.electronAPI.on_message_redir() //for handling all message redirects
window.electronAPI.on_map_data((data) => {
    process_map_data(data, "ACC") //always load ACC
})