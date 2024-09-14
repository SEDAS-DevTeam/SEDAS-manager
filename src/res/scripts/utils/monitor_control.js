import sg from '../../source/sgui/sgui.js';

//ELEMENT INIT DEFS
const MODES = ["TWR", "APP", "ACC", "weather", "dep_arr", "embed"]

//other vars
var MAX_MONITORS_ROW = 3 //maximum monitor rows in monitor table, changeable in settings (TODO)
var MAX_MONITORS_COL = 3 //maximum monitor rows in monitor column, also changeable in settings (TODO)
var focus_out = false
var curr_text;
var input;
var is_in_form = false

function on_form_exit(curr_text, input){
  let parent = curr_text.parentNode
  parent.innerHTML = ""

  //user exited form
  let new_text = sg.create_elem("p", "", input.value, parent)
  new_text.add_class("monitor-header-text")
  new_text.on_dblclick((event) => {
    rename_monitor(event)
  })

  is_in_form = false
}

function rename_monitor(event){
  curr_text = event.target

  is_in_form = true
  var val = curr_text.innerHTML;
  input = sg.create_elem("input", "curr-input", "", curr_text);
  input.value = val;
  input.on_blur(() => {
    if (!focus_out){
      on_form_exit(curr_text, input)
    }
    focus_out = false
  })

  curr_text.innerHTML = "";
  input.focus();
}

export function delete_monitor_elem(delete_element = undefined){
  if (delete_element == undefined){
    //standard procedure, delete all
    let content = sg.get_elem("default-table#monitor-panel").children[0]
  
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

export function element_init(element_data, idx, elemParent){
  //align to specified x and y

  let worker_type = element_data["win"]["win_type"]


  let monitor_elem = sg.create_elem("div", "monitor" + idx, "", elemParent)
  monitor_elem.add_class("monitor-content")

  let monitor_header = sg.create_elem("div", "", `<p class="monitor-header-text">Monitor ${idx}</p>`, monitor_elem)
  monitor_header.add_class("monitor-header")

  let mode_list = sg.create_elem("select", "", "", monitor_elem)
  mode_list.add_class("monitor-functions")
  for (let i = 0; i < MODES.length; i++){
    let mode_elem = sg.create_elem("option", "", "", mode_list)
    mode_elem.value = MODES[i]
    mode_elem.innerHTML = MODES[i]

    if (worker_type == MODES[i]){
      mode_elem.selected = true
    }
  }
}