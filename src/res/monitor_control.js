var pos_init_X = 0, pos_init_Y = 0, pos_new_X = 0, pos_new_Y = 0
var dragged_element = undefined

function drag_element(element){
  document.getElementById("monitor-header").onmousedown = (event) => {
    event.preventDefault()

    dragged_element = element

    pos_init_X = event.clientX
    pos_init_Y = event.clientY

    document.onmouseup = stop_drag
    document.onmousemove = drag_elem_to_loc
  }
}

function stop_drag(){
  document.onmouseup = null
  document.onmousemove = null
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