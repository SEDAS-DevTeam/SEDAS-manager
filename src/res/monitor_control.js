//ELEMENT DRAGGING DEFS
var pos_init_X = 0, pos_init_Y = 0, pos_new_X = 0, pos_new_Y = 0
var dragged_element = undefined

//ELEMENT INIT DEFS
const MONITOR_INIT_STRING = '<!-- Include a header DIV with the same name as the draggable DIV, followed by "header" --><div class="monitor-header">Monitor </div><select id="functions" name="functions"><option value="TWR">TWR control</option><option value="APP">APP control</option><option value="ACC">ACC control</option><option value="weather">weather forecast</option><option value="dep_arr">departure list</option></select>'
const MODES_TO_IDX = {
  "worker.html": 2, //predefine this to ACC because we didnt set up any other rendering //TODO:
  "weather.html": 3, //weather forecast
  "dep_arr.html": 4 //departure/arrivals
}
const MONITOR_X_SPACE = 250
const MONITOR_Y = 200

//ELEMENT DRAGGING
function drag_element(element, idx){
  let monitor_header = document.getElementById("monitor" + idx).getElementsByClassName("monitor-header")[0]

  monitor_header.onmousedown = (event) => {
    event.preventDefault()

    dragged_element = element

    pos_init_X = event.clientX
    pos_init_Y = event.clientY

    document.onmouseup = stop_drag
    document.getElementById("field").onmousemove = drag_elem_to_loc
    //monitor_header.onmousemove = drag_elem_to_loc //This breaks whole bounding box thing //TODO:
  }
}

function stop_drag(){

  document.onmouseup = null
  document.getElementById("field").onmousemove = null
  let monitors = document.getElementsByClassName("monitor-header")
  for (let i = 0; i < monitors.length; i++){
    monitors[i].onmousemove = null
  };
}

function drag_elem_to_loc(event){
  event.preventDefault()

  pos_new_X = pos_init_X - event.clientX
  pos_new_Y = pos_init_Y - event.clientY
  pos_init_X = event.clientX;
  pos_init_Y = event.clientY;

  dragged_element.style.top = (dragged_element.offsetTop - pos_new_Y) + "px"
  dragged_element.style.left = (dragged_element.offsetLeft - pos_new_X) + "px"

}

//ELEMENT INIT

function insert_selected(idx){
  var regex = /option/gi, result, indices = [], indices_mod = [];
  while ( (result = regex.exec(MONITOR_INIT_STRING)) ) {
      indices.push(result.index);
  }
  for (let i = 0; i < indices.length; i++){
    if (i % 2 == 0){
      indices_mod.push(indices[i])
    }
  }

  let option_index = indices_mod[idx] + "option ".length
  let out = MONITOR_INIT_STRING.slice()
  return out.slice(0, option_index) + "selected " + out.slice(option_index)
}

function rename(innerhtml_string, idx){
  let header_idx = innerhtml_string.indexOf("Monitor ") + "Monitor ".length
  return innerhtml_string.slice(0, header_idx) + idx + innerhtml_string.slice(header_idx)
}

function element_init(element_data, idx){
  //align to specified x and y

  let worker_winname = element_data["path_load"].split("/")
  worker_winname = worker_winname[worker_winname.length - 1]

  let monitor_innerhtml = insert_selected(MODES_TO_IDX[worker_winname])
  monitor_innerhtml = rename(monitor_innerhtml, idx + 1)

  let monitor_elem = document.createElement("div")

  monitor_elem.innerHTML = monitor_innerhtml
  monitor_elem.classList.add("monitor-content")
  monitor_elem.id = "monitor" + idx

  //set monitor to specific x,y
  monitor_elem.style.top = document.getElementById("top-content").offsetHeight + MONITOR_Y + "px"
  monitor_elem.style.left = (idx + 1) * MONITOR_X_SPACE + "px"


  document.getElementById("page-content").appendChild(monitor_elem)

}

function draw_connection(){
  
}