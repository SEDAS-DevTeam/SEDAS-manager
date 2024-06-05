class SettingsArea extends HTMLElement{
    constructor(){
        super();
    }

    connectedCallback(){
        
    }
}

customElements.define("settings-area", SettingsArea)


class SettingsFunctions extends ElementBind{
    constructor(element_query, selection_type = ""){
        super(element_query);

        console.log(this.attributes)
        this.selection_type = selection_type
    }

    
}