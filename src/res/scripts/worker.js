import sg from '../source/sgui/sgui.js';
import {
    render_vars,
    renderPlane,
    renderPlaneInfo,
    renderPlanePath,
    renderAirspace,
    renderRunway,
    renderPoint,
    renderAirport,
    renderText,
    renderScale
} from '../scripts/utils/render.js';
import { on_message, send_message } from '../scripts/utils/ipc_wrapper.js';

var map_data = undefined
var plane_data = []
var plane_label_coords = []
var APP_DATA = undefined
var plane_paths = []
var scale = 0

var main_canvas = undefined

var curr_rel_dist = [0, 0] //x, y
var is_dragging = false

var curr_plane = undefined

function process_map_data(){

    //rewrite all canvas data
    main_canvas.render(render_vars.BACKROUND_COLOR, [1, 2, 3])

    if (map_data[0] == undefined){
        //render empty map placeholder on init
        renderText(50, 100, "Empty map placeholder", "white", "48px", "canvas1")
        return;
    }

    let spec_data = map_data[0][map_data[1]] //load map data type (ACC/APP/TWR)
    scale = map_data[0]["scale"]
    if (spec_data == undefined){
        //map resource for type does not exist
        renderText(50, 100, `Map resource for type "${map_data[1]}" does not exist`, "white", "48px", "canvas1")
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
                        renderPoint(value[i]["x"], value[i]["y"], value[i]["name"], render_vars.POINT_COLOR, render_vars.POINT_TRIAG_LENGTH)
                    }
                    break
                case "SID":
                    //rendering SID instruments
                    for (let i = 0; i < value.length; i++){
                        renderPoint(value[i]["x"], value[i]["y"], value[i]["name"], render_vars.SID_COLOR, render_vars.SID_TRIAG_LENGTH)
                    }
                    break
                case "STAR":
                    //rendering STAR instruments
                    for (let i = 0; i < value.length; i++){
                        renderPoint(value[i]["x"], value[i]["y"], value[i]["name"], render_vars.STAR_COLOR, render_vars.STAR_TRIAG_LENGTH)
                    }
                    break
                case "SECTOR":
                    //rendering airspace
                    let SECTOR_points = []
                    for (let i = 0; i < value.length; i++){
                        SECTOR_points.push([value[i]["x"], value[i]["y"]])
                    }
                    renderAirspace(render_vars.SECTOR_COLOR, render_vars.SECTOR_BORDER_COLOR, render_vars.SECTOR_BORDER_WIDTH, SECTOR_points)

                    break
                case "TERRAIN":
                    //rendering terrain
                    let TERRAIN_points = []
                    for (let i = 0; i < value.length; i++){
                        TERRAIN_points.push([value[i]["x"], value[i]["y"]])
                    }
                    renderAirspace(render_vars.TERRAIN_COLOR, render_vars.TERRAIN_BORDER_COLOR, render_vars.TERRAIN_BORDER_WIDTH, TERRAIN_points)
                    break
                case "RESTRICTED_AREA":
                    //rendering no-fly zones
                    let AREA_points = []
                    for (let i = 0; i < value.length; i++){
                        AREA_points.push([value[i]["x"], value[i]["y"]])
                    }
                    renderAirspace(render_vars.NO_FLY_ZONE_COLOR, render_vars.NO_FLY_ZONE_BORDER_COLOR, render_vars.NO_FLY_ZONE_BORDER_WIDTH, AREA_points)
                    break
            }
        }
    }

    //render scale
    renderScale(scale)
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

        renderPlane(plane_data[i]["x"], plane_data[i]["y"], plane_data[i]["heading"], plane_data[i]["speed"], APP_DATA["max_speed"], APP_DATA["min_speed"])
        let label_coords = renderPlaneInfo(plane_data[i]["x"], plane_data[i]["y"], label_x, label_y, {
            "callsign": plane_data[i]["callsign"],
            "level": parseInt(plane_data[i]["level"]),
            "speed": parseInt(plane_data[i]["speed"]),
            "code": undefined
        }, parseInt(APP_DATA["transition_altitude"]))

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
    //TODO: finish this someday
}

sg.on_win_load(() => {
    main_canvas = sg.get_elem("s-canvas")
    
    //ask for map data
    send_message("worker", "render-map")

    //ask for app data
    send_message("worker", "send-info")

    //ask for plane data
    send_message("worker", "send-plane-data")

    //render all essential things
    main_canvas.render(render_vars.BACKROUND_COLOR, [1, 2, 3])

    //render empty map placeholder on init
    renderText(50, 100, "Empty map placeholder", "white", "48px", "canvas3")
    
    sg.get_elem("a#exit").on_click(() => {
        send_message("worker", "exit")
    })

    sg.get_elem("a#sim_button").on_click(() => {
        let elem = sg.get_elem("a#sim_button")
        if (elem.className == "stopsim"){
            send_message("worker", "stop-sim") //stop simulation
        }
        else if (elem.className == "startsim"){
            send_message("worker", "start-sim") //start simulation
        }
    })
    sg.get_elem("a#mic_button").on_click(() => {
        let elem = sg.get_elem("a#mic_button")
        if (elem.className == "startmic"){
            elem.className = "stopmic"
            elem.innerHTML = "Mic ON"
            send_message("worker", "start-mic")
        }
        else if (elem.className == "stopmic"){
            elem.className = "startmic"
            elem.innerHTML = "Mic OFF"
            send_message("worker", "stop-mic")
        }
    })
})

/*
MOUSE EVENTS
*/

function mouse_down(event){
    let curr_x = event.clientX
    let curr_y = event.clientY

    for(let i = 0; i < plane_label_coords.length; i++){
        let curr_coords = plane_label_coords[i]["coords"]

        if (curr_coords[2] < curr_x && curr_coords[0] > curr_x){
            if (curr_coords[1] > curr_y){
                curr_plane = plane_data[i]
                curr_rel_dist = [Math.abs(curr_x - curr_coords[2]), Math.abs(curr_y - curr_coords[3])]
            }
        }
    }
}

function mouse_up(){
    curr_rel_dist = [0, 0]
}

function mouse_move(event){
    update_labels(event.clientX, event.clientY)

    //also still render paths
    for (let i = 0; i < plane_paths.length; i++){
        renderPlanePath(plane_paths[i]["coords"])
    }

    //render scale
    renderScale(scale)
}

// set all callbacks
sg.on_mouse_drag(mouse_down, mouse_move, mouse_up)


window.electronAPI.on_map_data((data) => {
    map_data = data //set map data to global on session
    process_map_data()
})
on_message("ask-for-render", () => {
    send_message("worker", "render-map")
})
on_message("update-plane-db", (data) => { //for updating plane list
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
on_message("update-paths", (data) => {
    plane_paths = data
})
on_message("sim-event", (data) => {
    let elem = sg.get_elem("a#sim_button")
    if (data == "stopsim"){
        elem.className = "startsim"
        elem.innerHTML = "RUN"
    }
    else if (data == "startsim"){
        elem.className = "stopsim"
        elem.innerHTML = "STOP"
    }
})
on_message("time", (time_data) => {
    let date_str = time_data[0].toDateString()
    let time_str = time_data[0].toLocaleTimeString();

    sg.get_elem("#date").innerHTML = date_str
    sg.get_elem("#time").innerHTML = time_str
})

window.electronAPI.on_init_info((data) => {
    APP_DATA = JSON.parse(data[1])
})