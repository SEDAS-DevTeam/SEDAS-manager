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

// Functions

export function check_margin(elem){
    let margin_space = elem.getAttribute("m")
    if (margin_space != null){
        elem.style.margin = margin_space.split(" ").map((x) => x + "px")
    }
}