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
        parent_div.appendChild(i)

        let div = document.createElement("div")
        div.id = "inner-content"
        parent_div.appendChild(div)

        this.appendChild(parent_div)
    }
}

customElements.define("desc-popup", DescPopup)