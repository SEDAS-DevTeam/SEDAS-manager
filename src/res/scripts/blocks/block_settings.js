class SettingsArea extends HTMLElement{
    constructor(){
        super();
    }

    connectedCallback(){
        //TODO
    }
}

customElements.define("settings-area", SettingsArea)


class SettingsFunctions extends ElementBind{
    constructor(element_query, selection_type = ""){
        super(element_query);

        console.log(this.attributes)
        this.selection_type = selection_type
    }

    load_parsed_layout(layout){
        this.element.appendChild(layout)
    }
}