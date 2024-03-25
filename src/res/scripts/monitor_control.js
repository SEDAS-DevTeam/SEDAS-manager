//ELEMENT INIT DEFS
const MONITOR_INIT_STRING = '<div class="monitor-header">Monitor </div><select id="functions" class="monitor-functions" name="functions"><option value="TWR">TWR control</option><option value="APP">APP control</option><option value="ACC">ACC control</option><option value="weather">weather forecast</option><option value="dep_arr">departure/arrival list</option></select>'
const MODES = ["TWR", "APP", "ACC", "weather", "dep_arr"]
const MONITOR_X_SPACE = 250
const MONITOR_Y = 200

//other vars
var focus_out = false
var curr_text;
var input;
var is_in_form = false

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

function element_init(element_data, idx){
  //align to specified x and y

  let worker_type = element_data["win_type"]

  //let monitor_innerhtml = insert_selected(MODES_TO_IDX[worker_type])
  //console.log(monitor_innerhtml)
  //monitor_innerhtml = rename(monitor_innerhtml, idx + 1)

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

  //set monitor to specific x,y
  monitor_elem.style.top = document.getElementById("top-content").offsetHeight + MONITOR_Y + "px"
  monitor_elem.style.left = (idx + 1) * MONITOR_X_SPACE + "px"


  document.getElementById("page-content").appendChild(monitor_elem)
  
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