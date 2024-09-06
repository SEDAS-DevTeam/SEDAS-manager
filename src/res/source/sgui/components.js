/*
    File that contains all the extended elements used by S-GUI
*/

import {size_conversion,
        check_margin
} from '../../source/sgui/sgui_def.js';


class BasicElement extends HTMLElement{
    constructor(){
        super();
        this.is_visible = true
    }

    show(){
        this.style.visibility = "visible"
        this.is_visible = true
    }

    hide(){
        this.style.visibility = "hidden"
        this.is_visible = false
    }

    toggle(){
        if (this.is_visible){
            this.style.visibility = "hidden"
            this.is_visible = false
        }
        else{
            this.style.visibility = "visible"
            this.is_visible = true
        }
    }
}

class Button extends BasicElement{
    constructor(){
        super();
    }

    connectedCallback(){
    }

    on_click(callback){
        this.addEventListener("click", callback)
    }
}

class Icon extends BasicElement{
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
            case "arrow-left": {
                this.classList.add("fa-solid fa-arrow-left")
                break
            }
        }
    }
}

/*
    Text classes
*/

class AlignCenter extends BasicElement{
    constructor(){
        super();
    }

    connectedCallback(){
        
    }
}

class Text extends BasicElement{
    constructor(){
        super();
    }

    connectedCallback(){
        check_margin(this)
    }
}

class Header extends BasicElement{
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

class Loadbar extends BasicElement{
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

class CircleLoadbar extends BasicElement{
    constructor(){
        super();
    }
    
    connectedCallback(){
        let loader_inner = document.createElement("div")
        loader_inner.id = "loader-inner"
        
        let loader = document.createElement("div")
        loader.id = "loader"

        let load_text = document.createElement("s-header")
        load_text.setAttribute("s", "2")
        let text_data = this.getAttribute("text")
        load_text.id = "loader-text"
        load_text.innerHTML = text_data

        loader_inner.appendChild(loader)
        loader_inner.appendChild(load_text)

        this.appendChild(loader_inner)
    }
}

class Topnav extends BasicElement{
    constructor(){
        super();
    }

    connectedCallback(){
    }
}

class PageMask extends BasicElement{
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
    CircleLoadbar,
    Topnav,
    PageMask
}

export default components;