/*
    File that contains all the extended elements used by S-GUI
*/

import {size_conversion,
        check_margin
} from '../../source/sgui/sgui_def.js';

class Button extends HTMLElement{
    constructor(){
        super();
    }

    connectedCallback(){
    }

    on_click(callback){
        this.addEventListener("click", callback)
    }
}

class Icon extends HTMLElement{
    constructor(){
        super();
    }

    connectedCallback(){
        let type = this.getAttribute("type")
        switch(type){
            case "min": {
                this.classList.add("fa-solid fa-minimize")
                break
            }
            case "max": {
                this.classList.add("fa-solid fa-maximize")
                break
            }
            case "x": {
                this.classList.add("fa-solid fa-xmark")
                break
            }
        }
    }
}

/*
    Text classes
*/

class AlignCenter extends HTMLElement{
    constructor(){
        super();
    }

    connectedCallback(){
        
    }
}

class Text extends HTMLElement{
    constructor(){
        super();
    }

    connectedCallback(){
        check_margin(this)
    }
}

class Header extends HTMLElement{
    constructor(){
        super();
    }

    connectedCallback(){
        let size_level = this.getAttribute("s")
        this.style.fontSize = size_conversion[size_level] + "px"
        check_margin(this)
    }
}

/*
    Higher components
*/

class Loadbar extends HTMLElement{
    constructor(){
        super();
        this.seg_slice = 0
        this.n_seg = 0
        this.curr_n_seg = 0
    }

    connectedCallback(){
        let loadbar = document.createElement("div")
        loadbar.id = "loadbar"

        this.appendChild(loadbar)
    }

    set_segments(num_seg){
        this.n_seg = num_seg
        this.seg_slice = 100 / this.n_seg
    }

    move_up(){
        this.curr_n_seg += 1
        let width = this.curr_n_seg * this.seg_slice
        this.querySelector("#loadbar").style.width = width.toString() + "%"
    }
}

class Topnav extends HTMLElement{
    constructor(){
        super();
    }

    connectedCallback(){

    }
}

/*
    Div and other utils
*/

const components = {
    Button,
    Icon,
    Text,
    Header,
    AlignCenter,
    Loadbar,
    Topnav
}

export default components;