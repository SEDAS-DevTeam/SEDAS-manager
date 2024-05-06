class DescPopup extends HTMLElement{
    constructor(){
        super();
    }

    connectedCallback(){
        let parent_div = document.createElement("div")
        parent_div.classList.add("desc-content")
        
        let i = document.createElement("i")
        i.classList.add("fa-solid")
        i.classList.add("fa-xmark")
        i.id = "close-desc"
        i.append(parent_div)

        let div = document.createElement("div")
        div.id = "inner-content"
        div.append(parent_div)
    }
}

customElements.define("desc-popup", DescPopup)