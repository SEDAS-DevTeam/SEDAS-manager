var map_data = undefined
var plane_data = []
var plane_label_coords = []
var APP_DATA = undefined
var plane_paths = []
var scale = 0

var curr_rel_dist = [0, 0] //x, y

/*
in format
[{
    "id": 
    "coords": [x1, y1, x2, y2]
}]
*/

var is_dragging = false

var curr_plane = undefined

function process_map_data(){

    //rewrite all canvas data
    renderCanvas(1)
    renderCanvas(2)
    renderCanvas(3)

    if (map_data[0] == undefined){
        //render empty map placeholder on init
        renderText(50, 100, "Empty map placeholder", "white", "48px", "canvas3")
        return;
    }

    let spec_data = map_data[0][map_data[1]] //load map data type (ACC/APP/TWR)
    scale = map_data[0]["scale"]
    if (spec_data == undefined){
        //map resource for type does not exist
        renderText(50, 100, `Map resource for type "${map_data[1]}" does not exist`, "white", "48px", "canvas3")
        return
    }

    for (const [key, value] of Object.entries(spec_data)) {
        if (value != "none"){
            switch(key){
                case "ARP":
                    //rendering ARP for ACC/APP
                    renderAirport(value[0]["x"], value[0]["y"], value[0]["name"])
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
                        renderPoint(value[i]["x"], value[i]["y"], value[i]["name"], POINT_COLOR, POINT_TRIAG_LENGTH)
                    }
                    break
                case "SID":
                    //rendering SID instruments
                    for (let i = 0; i < value.length; i++){
                        renderPoint(value[i]["x"], value[i]["y"], value[i]["name"], SID_COLOR, SID_TRIAG_LENGTH)
                    }
                    break
                case "STAR":
                    //rendering STAR instruments
                    for (let i = 0; i < value.length; i++){
                        renderPoint(value[i]["x"], value[i]["y"], value[i]["name"], STAR_COLOR, STAR_TRIAG_LENGTH)
                    }
                    break
                case "SECTOR":
                    //rendering airspace
                    let SECTOR_points = []
                    for (let i = 0; i < value.length; i++){
                        SECTOR_points.push([value[i]["x"], value[i]["y"]])
                    }
                    renderAirspace(SECTOR_COLOR, SECTOR_BORDER_COLOR, SECTOR_BORDER_WIDTH, SECTOR_points)

                    break
                case "TERRAIN":
                    //rendering terrain
                    let TERRAIN_points = []
                    for (let i = 0; i < value.length; i++){
                        TERRAIN_points.push([value[i]["x"], value[i]["y"]])
                    }
                    renderAirspace(TERRAIN_COLOR, TERRAIN_BORDER_COLOR, TERRAIN_BORDER_WIDTH, TERRAIN_points)
                    break
                case "RESTRICTED_AREA":
                    //rendering no-fly zones
                    let AREA_points = []
                    for (let i = 0; i < value.length; i++){
                        AREA_points.push([value[i]["x"], value[i]["y"]])
                    }
                    renderAirspace(NO_FLY_ZONE_COLOR, NO_FLY_ZONE_BORDER_COLOR, NO_FLY_ZONE_BORDER_WIDTH, AREA_points)
                    break
            }
        }
    }

    //render scale
    renderScale(scale)
}

function check_trans_altitude(plane_data){
    //TODO: is set up only for 1000 transition altitude
    let plane_level = ""

    //check if altitude does exceed transition altitude
    if (plane_data.level > parseInt(APP_DATA["transition_altitude"])){
        let val = Math.floor(plane_data.level / 100).toString()
        if (val.length < 3){
            for (let i = 0; i < 3 - val.length; i++){
                val = "0" + val
            }
        }

        //convert to FL
        plane_level = "FL " + val
    }
    else{
        plane_level = plane_data.level + " ft"
    }
    return plane_level
}

function render_planes(){
    //check saved coordinates if we deleted any plane
    for (let i = 0; i < plane_label_coords.length; i++){
        let found_record = false
        for (let i_plane = 0; i_plane < plane_data.length; i_plane++){
            if(plane_label_coords[i]["id"] == plane_data[i_plane]["id"]){
                //plane coord record does exist
                found_record = true
            }
        }
        if(!found_record){
            plane_label_coords.splice(i, 1)
        }
    }

    //render plane
    for (let i = 0; i < plane_data.length; i++){
        //plane rendering is in canvas 2
        //tag rendering is in canvas 3
        let label_x = 0
        let label_y = 0

        plane_level = check_trans_altitude(plane_data[i])

        let found_plane = false
        for (let i2 = 0; i2 < plane_label_coords.length; i2++){
            if(plane_label_coords[i2]["id"] == plane_data[i]["id"]){
                //found specific plane
                found_plane = true

                //rewrite label coords so it has same distance
                plane_label_coords[i2]["coords"][2] = plane_data[i]["x"] + plane_label_coords[i2]["dist"][0]
                plane_label_coords[i2]["coords"][3] = plane_data[i]["y"] + plane_label_coords[i2]["dist"][1]

                label_x = plane_label_coords[i2]["coords"][2]
                label_y = plane_label_coords[i2]["coords"][3]
                break
            }
        }
        if (!found_plane){
            label_x = plane_data[i]["x"] + 50
            label_y = plane_data[i]["y"] - 50
        }

        //add metrics and other functionalities to label values
        plane_data[i].speed = plane_data[i].speed + " kts"

        renderPlane(plane_data[i]["x"], plane_data[i]["y"], plane_data[i]["heading"], plane_data[i]["speed"], APP_DATA["max_speed"], APP_DATA["min_speed"])
        let label_coords = renderPlaneInfo(plane_data[i]["x"], plane_data[i]["y"], label_x, label_y, {
            "callsign": plane_data[i]["callsign"],
            "level": plane_level,
            "speed": plane_data[i]["speed"],
            "code": undefined
        })

        if (!found_plane){
            plane_label_coords.push({
                "id": plane_data[i]["id"],
                "coords": label_coords,
                "dist": [label_x - plane_data[i]["x"], label_y - plane_data[i]["y"]]
            })
        }
    }
}

function update_labels(curr_x, curr_y){
    renderCanvas(3)

    for (let i = 0; i < plane_label_coords.length; i++){        
        if (plane_label_coords[i]["id"] == curr_plane["id"]){
            // render moved plane label

            //update x and y by cursor location
            x = curr_x - curr_rel_dist[0]
            y = curr_y - curr_rel_dist[1]

            plane_level = check_trans_altitude(curr_plane)

            let label_coords = renderPlaneInfo(curr_plane["x"], curr_plane["y"], x, y, {
                "callsign": curr_plane["callsign"],
                "level": plane_level,
                "speed": curr_plane["speed"],
                "code": undefined
            })

            plane_label_coords[i] = {
                "id": curr_plane["id"],
                "coords": label_coords,
                "dist": [plane_label_coords[i]["coords"][2] - plane_data[i]["x"], plane_label_coords[i]["coords"][3] - plane_data[i]["y"]]
            }
        }
        else{
            //render rest of the plane labels

            for(let i2 = 0; i2 < plane_data.length; i2++){
                if (plane_label_coords[i]["id"] == plane_data[i2]["id"]){
                    //rerender rest of unused labels onmousemove
                    renderPlaneInfo(plane_data[i2]["x"], plane_data[i2]["y"], plane_label_coords[i]["coords"][2], plane_label_coords[i]["coords"][3], {
                        "callsign": plane_data[i2]["callsign"],
                        "level": plane_data[i2]["level"],
                        "speed": plane_data[i2]["speed"],
                        "code": undefined
                    })
                }
            }
        }
    }


}

window.onload = () => {
    //ask for map data
    window.electronAPI.send_message("worker", ["render-map"])

    //ask for app data
    window.electronAPI.send_message("worker", ["send-info"])

    //ask for plane data
    window.electronAPI.send_message("worker", ["send-plane-data"])

    //render all essential things
    renderCanvas(1)
    renderCanvas(2)
    renderCanvas(3)

    //render empty map placeholder on init
    renderText(50, 100, "Empty map placeholder", "white", "48px", "canvas3")

    document.querySelector("a#plankmsg").addEventListener("click", () => {
        window.electronAPI.send_message_redir("controller", ["test msg2"])
    })
    
    document.querySelector("a#exit").addEventListener("click", () => {
        window.electronAPI.send_message("worker", ["exit"])
    })

    document.querySelector("a#stopbutton").addEventListener("click", () => {
        let elem = document.querySelector("a#stopbutton")
        if (elem.className == "stopsim"){
            window.electronAPI.send_message("worker", ["stop-sim"]) //stop simulation
        }
        else if (elem.className == "startsim"){
            window.electronAPI.send_message("worker", ["start-sim"]) //start simulation
        }
    })
}

/*
MOUSE EVENTS
*/

document.onmousedown = (event) => {
    let curr_x = event.clientX
    let curr_y = event.clientY

    for(i = 0; i < plane_label_coords.length; i++){
        let curr_coords = plane_label_coords[i]["coords"]

        if (curr_coords[2] < curr_x && curr_coords[0] > curr_x){
            if (curr_coords[1] > curr_y){
                //is dragging on elem
                is_dragging = true

                curr_plane = plane_data[i]

                curr_rel_dist = [Math.abs(curr_x - curr_coords[2]), Math.abs(curr_y - curr_coords[3])]
            }
        }
    }
}

document.onmouseup = () => {
    is_dragging = false
    curr_rel_dist = [0, 0]
}

document.onmousemove = (event) => {
    if (is_dragging){
        update_labels(event.clientX, event.clientY)

        //also still render paths
        for (let i = 0; i < plane_paths.length; i++){
            renderPlanePath(plane_paths[i]["coords"])
        }

        //render scale
        renderScale(scale)
    }
}

window.electronAPI.on_message_redir() //for handling all message redirects
window.electronAPI.on_map_data((data) => {
    map_data = data //set map data to global on session
    process_map_data()
})
window.electronAPI.on_message("ask-for-render", () => {
    window.electronAPI.send_message("worker", ["render-map"])
})
window.electronAPI.on_message("update-plane-db", (data) => { //for updating plane list
    plane_data = data

    process_map_data()

    //rerender planes
    render_planes()

    //update current plane
    if (curr_plane != undefined){
        for (let i = 0; i < plane_data.length; i++){
            if (curr_plane["id"] == plane_data[i]["id"]){
                curr_plane = plane_data[i]
            }
        }
    }

    for (let i = 0; i < plane_paths.length; i++){
        renderPlanePath(plane_paths[i]["coords"])
    }

    //render scale
    renderScale(scale)
})
window.electronAPI.on_message("update-paths", (data) => {
    plane_paths = data
})
window.electronAPI.on_message("sim-event", (data) => {
    let elem = document.querySelector("a#stopbutton")
    if (data == "stopsim"){
        elem.className = "startsim"
        elem.innerHTML = "RUN"
    }
    else if (data == "startsim"){
        elem.className = "stopsim"
        elem.innerHTML = "STOP"
    }
})

window.electronAPI.on_init_info((data) => {
    APP_DATA = JSON.parse(data[1])
})