//ELEMENT INIT DEFS
const MONITOR_INIT_STRING = '<div class="monitor-header">Monitor </div><select id="functions" class="monitor-functions" name="functions"><option value="TWR">TWR control</option><option value="APP">APP control</option><option value="ACC">ACC control</option><option value="weather">weather forecast</option><option value="dep_arr">departure/arrival list</option></select>'
const MODES = ["TWR", "APP", "ACC", "weather", "dep_arr"]
const MONITOR_X_SPACE = 250
const MONITOR_Y = 200

//other vars
var MAX_MONITORS_ROW = 3 //maximum monitor rows in monitor table, changeable in settings (TODO)
var MAX_MONITORS_COL = 3 //maximum monitor rows in monitor column, also changeable in settings (TODO)
var focus_out = false
var curr_text;
var input;
var is_in_form = false
var monitor_drag = false
var curr_monit_elem;
var init_monit_x;
var init_monit_y;
var curr_col;
var curr_row;

//element moving (in listeners)
function elem_mousedown(event, monitor_elem){
  var posX = event.clientX;
  var posY = event.clientY;

  init_monit_x = monitor_elem.getBoundingClientRect().left
  init_monit_y = monitor_elem.getBoundingClientRect().top

  monitor_elem.style.left = (posX - (monitor_elem.offsetWidth / 2)) + 'px';
  monitor_elem.style.top = (posY - (monitor_elem.offsetHeight / 2)) + 'px';
  monitor_elem.style.width = parseInt(monitor_elem.offsetWidth) + "px"

  //set monitor to draggable
  monitor_elem.classList.add("monitor-drag")

  monitor_drag = true
  curr_monit_elem = monitor_elem
}

//element init
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

function on_form_exit(curr_text, input){
  let parent = curr_text.parentNode
  parent.innerHTML = ""

  //user exited form
  let new_text = document.createElement("p")
  new_text.classList.add("monitor-header-text")
  new_text.innerHTML = input.value
  new_text.addEventListener("dblclick", (event) => {
    rename_monitor(event)
  })

  parent.appendChild(new_text)

  is_in_form = false
}

function rename_monitor(event){
  curr_text = event.target

  is_in_form = true
  var val = curr_text.innerHTML;
  input = document.createElement("input");
  input.id = "curr-input"

  input.value = val;
  input.onblur = () => {
    if (!focus_out){
      on_form_exit(curr_text, input)
    }
    focus_out = false
  }

  curr_text.innerHTML = "";
  curr_text.appendChild(input);
  input.focus();
}

function delete_monitor_elem(delete_element = undefined){
  if (delete_element != undefined){
    //standard procedure, delete all
    let content = document.querySelector("default-table#monitor-panel").children[0]
  
    for (let i_y = 0; i_y < content.children.length; i_y++){
      for (let i_x = 0; i_x < content.children[i_y].children.length; i_x++){
        content.children[i_y].children[i_x].innerHTML = ""
      }
    }
  }
  else{
    //delete only specific monitor elem
    delete_element.remove()
  }
}

function element_init(element_data, idx, elemParent){

  //align to specified x and y

  let worker_type = element_data["win_type"]

  let monitor_elem = document.createElement("div")

  monitor_elem.classList.add("monitor-content")
  monitor_elem.id = "monitor" + idx

  let monitor_header = document.createElement("div")
  monitor_header.classList.add("monitor-header")
  monitor_header.innerHTML = `<p class="monitor-header-text">Monitor ${idx}</p>`

  let mode_list = document.createElement("select")
  mode_list.classList.add("monitor-functions")
  for (let i = 0; i < MODES.length; i++){
    let mode_elem = document.createElement("option")
    mode_elem.value = MODES[i]
    mode_elem.innerHTML = MODES[i]

    if (worker_type == MODES[i]){
      mode_elem.selected = true
    }

    mode_list.appendChild(mode_elem)
  }

  monitor_elem.appendChild(monitor_header)
  monitor_elem.appendChild(mode_list)

  monitor_elem.getElementsByClassName("monitor-header")[0].addEventListener("mousedown", (event) => {
    elem_mousedown(event, monitor_elem)
  })

  document.addEventListener("mouseup", (event) => {
    let mouseX = event.x
    let mouseY = event.y

    //set monitor to undraggable
    if (monitor_drag){
      curr_monit_elem.classList.remove("monitor-drag")

      monitor_drag = false
    }

    //also append monitor to different part of table if moved
    let table = document.querySelector("default-table#monitor-panel")
    let table_coords = table.getBoundingClientRect()
    
    let table_start_x = table_coords.left
    let table_start_y = table_coords.top

    let table_stop_x = table_coords.right
    let table_stop_y = table_coords.bottom

    let table_step_x = (table_stop_x - table_start_x) / MAX_MONITORS_ROW
    let table_step_y = (table_stop_y - table_start_y) / MAX_MONITORS_COL

    let diff_x = Math.abs(mouseX - init_monit_x)
    let diff_y = Math.abs(mouseY - init_monit_y)

    if (mouseX > table_stop_x || mouseX < table_start_x){
      if (curr_monit_elem != undefined){
        curr_monit_elem.style.width = "100%"
      }
      return //do nothing (out of bounds x)
    }
    else if ((mouseY > table_stop_y || mouseY < table_start_y)){
      if (curr_monit_elem != undefined){
        curr_monit_elem.style.width = "100%"
      }
      return //do nothing (out of bounds y) (written on two ifs for better visibility)
    }
    else if (!(diff_x > table_step_x || diff_y > table_step_y)){
      if (curr_monit_elem != undefined){
        curr_monit_elem.style.width = "100%"
      }
      return //do nothing (didnt cross the cell)
    }
    else{
      //calculate row and column index
      let row = Math.floor((mouseY - table_start_y) / table_step_y);
      let column = Math.floor((mouseX - table_start_x) / table_step_x);

      let mode_idx = undefined
      let monit_functions = curr_monit_elem.getElementsByClassName("monitor-functions")[0]
      for (let i = 0; i < monit_functions.children.length; i++){
        if (monit_functions[i].selected){
          mode_idx = MODES.indexOf(monit_functions[i].value)
        }
      }

      let copy_monit_elem = curr_monit_elem.cloneNode(true)
      //add designated function to monitor
      for (let i = 0; i < copy_monit_elem.getElementsByClassName("monitor-functions")[0].children.length; i++){
        copy_monit_elem.getElementsByClassName("monitor-functions")[0].children[mode_idx].selected = true
      }

      delete_monitor_elem(curr_monit_elem)
      document.querySelector("default-table#monitor-panel").children[0].children[row].children[column].appendChild(copy_monit_elem)

      copy_monit_elem.getElementsByClassName("monitor-header")[0].addEventListener("mousedown", (event) => {
        elem_mousedown(event, copy_monit_elem)
      })
      copy_monit_elem.style.width = "100%"
    }
  })

  document.addEventListener("mousemove", (event) => {
    //monitor drag
    if (monitor_drag){
      var posX = event.clientX;
      var posY = event.clientY;

      curr_monit_elem.style.left = (posX - (curr_monit_elem.offsetWidth / 2)) + 'px';
      curr_monit_elem.style.top = (posY - (curr_monit_elem.offsetHeight / 2)) + 'px';
    }
  })

  elemParent.appendChild(monitor_elem)
  
  //set text to clickable
  document.getElementsByClassName("monitor-header-text")[idx].addEventListener('dblclick', (event) => {
    rename_monitor(event)
  })
}

document.addEventListener("keydown", () => {
  if (is_in_form){
    focus_out = true
    on_form_exit(curr_text, input)
  }
})