class MonitorTable extends HTMLElement{
    constructor(){
        super();
    }

    connectedCallback(){
        let main_table = document.createElement("table")
        main_table.id = "monitor-panel"

        //TODO: add to settings
        for (let i1 = 0; i1 < 3; i1++){
            let tr = document.createElement("tr")
            for (let i2 = 0; i2 < 3; i2++){
                tr.appendChild(document.createElement("td"))
            }
            main_table.appendChild(tr)
        }

        this.appendChild(main_table)
    }
}

customElements.define('monitor-table', MonitorTable);