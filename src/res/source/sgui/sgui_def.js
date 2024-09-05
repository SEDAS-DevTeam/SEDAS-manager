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

// element functions

export function check_margin(elem){
    let margin_space = elem.getAttribute("m")
    if (margin_space != null){
        elem.style.margin = margin_space.split(" ").map((x) => x + "px")
    }
}

// global functions

export function get_elem(identifier){
    let elems = document.querySelectorAll(identifier)
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
    elem.id = id
    elem.innerHTML = inner_html
    
    parent.appendChild(elem)
    return elem
}

export function on_win_load(callback){
    window.onload = () => {
        callback()
    }
}