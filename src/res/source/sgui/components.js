/*
    File that contains all the extended elements used by S-GUI
*/

import {size_conversion,
        check_margin,
        conversion_top_header
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

    on_click(callback){
        this.addEventListener("click", (event) => {
            callback(event)
        })
    }

    on_load(callback){
        this.onload = (event) => {
            callback(event)
        }
    }

    has_class(classname){
        return this.classList.contains(classname)
    }

    remove_class(classname){
        this.classList.remove(classname)
    }

    add_class(classname){
        this.classList.add(classname)
    }
}

class Button extends BasicElement{
    constructor(){
        super();
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
            case "refresh": {
                this.classList.add("fa fa-refresh")
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
        if (size_level != ""){
            this.style.fontSize = size_conversion[size_level] + "px"
        }
        check_margin(this)
    }

    change_size(size_level){
        this.style.fontSize = size_conversion[size_level] + "px"
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
        let id_conv = conversion_top_header[this.id]

        this.innerHTML = 
        `
        <div id="top-content">
            <div>
                <s-header s="1" id="main-header">SEDAC manager Controller</s-header>
                <s-button id="exit-button">Exit</s-button>
                <s-button id="menu-button">Back to menu</s-button>
                <s-button id="save-button">Save</s-button>
            </div>
            <hr>
            <div class="topnav" id="controller-topnav">
                <a href="controller_set.html">Setup</a>
                <a href="controller_mon.html">Monitors</a>
                <a href="controller_sim.html">Simulation</a>
                <a href="plugins.html">Plugins</a>
                <a href="wiki.html">Wiki</a>
            </div>
        </div>
        `
        
        this.querySelector("#controller-topnav").children[id_conv].classList.add("active")
    }
}

class PageMask extends BasicElement{
    constructor(){
        super();
    }

    connectedCallback(){

    }
}

class IframeExtension extends BasicElement{
    constructor(){
        super();
    }

    connectedCallback(){
        let iframe = document.createElement("iframe")
        iframe.setAttribute("frameborder", "0")
        iframe.setAttribute("allowfullscreen", "")

        this.appendChild(iframe)
    }

    set_source(src){
        this.children[0].src = src
    }
}

class WorkerCanvas extends HTMLElement{
    constructor(){
        super();
    }

    connectedCallback(){
        for (let i = 0; i < 3; i++){
            let canvas = document.createElement("canvas")
            canvas.id = "canvas" + (i + 1).toString()
            canvas.setAttribute("width", "640")
            canvas.setAttribute("width", "480")

            this.appendChild(canvas)
        }
    }

    render(background_color, canvas_ids){
        for (let i = 0; i < canvas_ids.length; i++){
            let canvas_id = "#canvas" + canvas_ids[i].toString()
            let canvas = this.querySelector(canvas_id)
            let context = canvas.getContext("2d")

            context.fillStyle = background_color
            canvas.width = window.screen.width
            canvas.height = window.screen.height
            
            if (canvas_ids[i] == 1){
                context.fillRect(0, 0, canvas.width, canvas.height)
            }       
        }
    }
}

class DefaultTable extends HTMLElement{
    constructor(){
        super();
    }

    connectedCallback(){
        /*
        parameter list config
            dim=nxm -> defines initial table size
            onload=func() -> defines what function should it run on default
            header="true" | "false" -> defines if
            even_color="true"
        */

        //variable retrival
        let dim = this.getAttribute("dim").split("x").map((x) => {
            return parseInt(x)
        })
        let onload_callback = this.getAttribute("onload")
        let header = Boolean(this.getAttribute("header"))
        let even_color = Boolean(this.getAttribute("even_color"))
        let padding = parseInt(this.getAttribute("padding"))

        //table setup
        let main_table = document.createElement("table")

        for (let i1 = 0; i1 < dim[0]; i1++){
            let tr = document.createElement("tr")
            tr.style.padding = padding

            for (let i2 = 0; i2 < dim[1]; i2++){
                let block_elem = "td"
                if (header && i1 == 0){
                    block_elem = "th" //rewrite to header
                }
                let elem = document.createElement(block_elem)
                elem.style.padding = padding

                tr.appendChild(elem)
            }
            if (even_color){
                tr.id = "color"
            }
            main_table.appendChild(tr)
        }
        this.appendChild(main_table)

        if (onload_callback != null){
            this.evaluateFunction(onload_callback)
        }
    }

    evaluateFunction(functionStr) {
        return Function(functionStr).call(this);
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
    PageMask,
    IframeExtension,
    DefaultTable,
    WorkerCanvas
}

export default components;