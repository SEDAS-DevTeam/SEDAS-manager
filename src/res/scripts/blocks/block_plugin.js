class PluginTable extends HTMLElement{
    constructor(){
        super();
    }

    connectedCallback(){
        let main_table = document.createElement("table")
        main_table.id = "plugins-tab"

        //fetch plugins and render them
        //TODO
        main_table.innerHTML = 
        `
        <tr>
            <th>Plugin</th>
            <th>Version</th>
            <th>Last updated</th>
            <th>
                <form><input type="text" placeholder="Search.." name="search"></form>
            </th>
        </tr>
        <tr>
            <td>SEDAC MapBuilder</td>
            <td>ver 1.0.0</td>
            <td>Last week</td>
            <td><button class="indicator-but" id="installed">Installed</button></td>
        </tr>
        <tr>
            <td>Lorem Ipsum</td>
            <td>ver 1.0.0</td>
            <td>Last year</td>
            <td><button class="indicator-but" id="not-installed">Install</button></td>
        </tr>
        `

        this.appendChild(main_table)
    }
}

customElements.define('plugin-table', PluginTable);