//variables

const conversion_top_header = {
    "set": 0,
    "mon": 1,
    "sim": 2,
    "plugin": 3,
    "wiki": 4
}

class ElementBind{
    constructor(element_query){
        this.element = document.querySelector(element_query)
        this.attributes = {}

        for (let i = 0; i < this.element.attributes.length; i++){
            let attribute_name = this.element.attributes[i].name
            let attribute_value = this.element.attributes[i].value

            this.attributes[attribute_name] = attribute_value
        }
    }
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

customElements.define("default-table", DefaultTable)
customElements.define("top-header", TopHeader)