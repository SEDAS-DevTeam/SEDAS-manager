/*
    File that contains all the internal definitions and functions
*/


// Variables

export const size_conversion = {
    "1": "32",
    "2": "24",
    "3": "20",
    "4": "16",
    "5": "13",
    "6": "10"
}

export const conversion_top_header = {
    "set": 0,
    "mon": 1,
    "sim": 2,
    "plugin": 3,
    "wiki": 4
}

// element functions

export function check_margin(elem){
    let margin_space = elem.getAttribute("m")
    if (margin_space != null){
        elem.style.margin = margin_space.split(" ").map((x) => x + "px").join(" ")
    }
}

export function check_special(elem){
    let bold = elem.getAttribute("b")
    console.log(bold)
}

// global functions

export function get_elem(identifier, element = document){
    let elems = element.querySelectorAll(identifier)
    if (elems.length == 1){
        return elems[0]
    }
    else if (elems.length == 0){
        return undefined;
    }

    return elems
}

export function create_elem(type, 
                            id, 
                            inner_html,
                            parent){
    let elem = document.createElement(type)
    if(id.length != 0) elem.id = id
    elem.innerHTML = inner_html
    
    parent.appendChild(elem)
    return elem
}

export function on_win_load(callback){
    window.onload = () => {
        callback()
    }
}

export function on_mouse_drag(callback_down, callback_move, callback_up){
    var is_dragging = false

    if (callback_down != undefined) {document.onmousedown = (event) => {
        is_dragging = true
        callback_down(event)
    }}

    if (callback_up != undefined) {document.onmouseup = (event) => {
        is_dragging = false
        callback_up(event)
    }}

    if (callback_move != undefined) {document.onmousemove = (event) => {
        if (is_dragging){
            callback_move(event)
        }
    }}
}

export function on_key_events(callback_keydown, callback_keyup){
    if (callback_keydown != undefined) {document.addEventListener("keydown", (event) => {
        callback_keydown(event)
    })}

    if (callback_keyup != undefined) {document.addEventListener("keyup", (event) => {
        callback_keyup(event)
    })}
}

export function is_online(){
    return window.navigator.onLine
}

export function on_click(callback){
    document.addEventListener("click", (event) => {
        callback(event)
    })
}