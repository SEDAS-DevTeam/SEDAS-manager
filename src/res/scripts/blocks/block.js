//variables

const conversion_top_header = {
    "set": 0,
    "mon": 1,
    "sim": 2,
    "plugin": 3,
    "wiki": 4
}

//TODO
class MainButton extends HTMLElement{
    constructor(){
        super();
    }

    connectedCallback(){
        this.innerHTML = "<button></button>"
    }
}

class TopHeader extends HTMLElement{
    constructor(){
        super();
    }

    connectedCallback(){
        let id_conv = conversion_top_header[this.id]

        this.innerHTML = 
        `
        <div id="top-content">
            <div>
                <h1 id="main-header">SEDAC manager Controller</h1>
                <button id="exit-button">Exit</button>
                <button id="menu-button">Back to menu</button>
                <button id="save-button">Save</button>
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

customElements.define("top-header", TopHeader)