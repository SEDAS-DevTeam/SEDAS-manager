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
        let margin_space = this.getAttribute("m")
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
    Div and other utils
*/

const components = {
    Button,
    Text,
    Header,
    AlignCenter
}

export default components;