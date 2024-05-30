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

class FrontendFunctions{
    show_description_airport(idx){
        let desc_data = document.querySelectorAll("div.popup-box")
        for (let i = 0; i < desc_data.length; i++){
            desc_data[i].style.visibility = "hidden"
        }
        desc_data[idx].style.visibility = "visible"
    
        desc_rendered = true
        clicked = true
        curr_desc = idx
    }

    ask_for_content(idx, type){
        window.electronAPI.send_message("controller", ["json-description", idx, type])
        desc_rendered = true
        clicked = true
        document.getElementsByClassName("desc-content")[0].style.visibility = "visible"
    }

    listener_on_select(){
        let select_buttons = document.getElementsByClassName("tablebutton")
        for (let i = 0; i < select_buttons.length; i++){
            select_buttons[i].addEventListener("click", () => {
                selection(select_buttons[i])
            })
        }
    }

    listener_on_description(){
        let desc_elem_airport = document.querySelectorAll("td i#airport")
        for(let i = 0; i < desc_elem_airport.length; i++){
            desc_elem_airport[i].addEventListener("click", () => {
                this.show_description_airport(i)
            })
        }
    }

    listener_on_inspection(selector){
        var desc_elem = document.querySelectorAll("td i#" + selector)
        for(let i = 0; i < desc_elem.length; i++){
            desc_elem[i].addEventListener("click", () => {
                this.ask_for_content(i, selector)
            })
        }
    }
}

class TableFunctions extends ElementBind{
    constructor(element_query, selection_type = ""){
        super(element_query);

        console.log(this.attributes)
        this.selection_type = selection_type
    }

    set_header(){
        let sel_header;
        switch(this.selection_type){
            case "airports":
                sel_header = head_airports
                break
            case "aircrafts":
                sel_header = head_aircrafts
                break
            case "commands":
                sel_header = head_commands
                break
            case "scenario":
                sel_header = head_scenarios
                break
        }
    
        for (let i = 0; i < sel_header.length + 1; i++){
            let spec_elem = this.element.children[0].children[0].children[i]
            if (i == sel_header.length){
                //append search tab
                spec_elem.innerHTML = '<th><form><input type="text" placeholder="Search.." name="search"></form></th>'
                break
            }
    
            spec_elem.innerHTML = sel_header[i]
        }
    }

    #check_even(){
        if (this.attributes.even_color == "true"){
            this.element.children[0].id = "color"
        }
    }

    /*
        Content generation
    */
    set_aircrafts_list(){
        let aircraft_data = INIT_DATA[5]
        for (let i = 0; i < aircraft_data.length; i++){
            let record = document.createElement("tr")
            let name = aircraft_data[i]["name"]
    
            let name_obj = document.createElement("td")
            name_obj.innerHTML = name
            let inspect_obj = document.createElement("td")
            let select_obj = document.createElement("td")
            let inspect = document.createElement("i")
            inspect.classList.add("fa")
            inspect.classList.add("fa-search")
            inspect.setAttribute("aria-hidden", "true")
            inspect.id = "aircraft"
    
            let select_button = document.createElement("button")
            select_button.classList.add("tablebutton")
            select_button.innerHTML = "Select"
            select_button.id = aircraft_data[i]["hash"]
            select_obj.append(select_button)
            inspect_obj.append(inspect)
    
            record.appendChild(name_obj)
            record.appendChild(inspect_obj)
            record.appendChild(select_obj)
            
            this.element.children[0].appendChild(record)

            this.#check_even()
        }
    }

    set_commands_list(){
        let command_data = INIT_DATA[6]
        for (let i = 0; i < command_data.length; i++){
            let record = document.createElement("tr")
            let name = command_data[i]["name"]
    
            let name_obj = document.createElement("td")
            name_obj.innerHTML = name
            let inspect_obj = document.createElement("td")
            let select_obj = document.createElement("td")
            let inspect = document.createElement("i")
            inspect.classList.add("fa")
            inspect.classList.add("fa-search")
            inspect.setAttribute("aria-hidden", "true")
            inspect.id = "command"
    
            let select_button = document.createElement("button")
            select_button.classList.add("tablebutton")
            select_button.innerHTML = "Select"
            select_button.id = command_data[i]["hash"]
            select_obj.append(select_button)
            
            inspect_obj.appendChild(inspect)
    
            record.appendChild(name_obj)
            record.appendChild(inspect_obj)
            record.appendChild(select_obj)
    
            this.element.children[0].appendChild(record)

            this.#check_even()
        }
    }

    set_airports_list(){
        let airport_data = INIT_DATA[2]
        for (let i = 0; i < airport_data.length; i++){
            let airport = airport_data[i]["content"]
            let airport_hash = airport_data[i]["hash"]
    
            let record = document.createElement("tr")
    
            let i2 = 0;
            for (const [key, value] of Object.entries(airport)) {
                if (i2 == 0){
                    //skip first FILENAME record
                    i2 += 1
                    continue
                }
                if (i2 == Object.keys(airport).length - 1){
                    //skip DESC
                    break
                }
    
                record.innerHTML += `<td>${value}</td>`
                i2 += 1
            }
    
            let desc_obj = document.createElement("td")
            let select_obj = document.createElement("td")
            let inspect = document.createElement("i")
            let popup_box = document.createElement("div")
            let desc = document.createElement("p")
            let select_button = document.createElement("button")
    
            inspect.classList.add("fa");
            inspect.classList.add("fa-search")
            inspect.setAttribute('aria-hidden', 'true')
            inspect.id = "airport"
    
            popup_box.classList.add("popup-box");
            select_button.classList.add("tablebutton")
            select_button.innerHTML = "Select"
            select_button.id = airport_hash
    
            desc.classList.add("desc");
            desc.innerHTML = airport["DESC"]
    
            popup_box.appendChild(desc)
    
            desc_obj.appendChild(inspect)
            desc_obj.appendChild(popup_box)
            select_obj.appendChild(select_button)
    
            record.appendChild(desc_obj)
            record.appendChild(select_obj)
    
            this.element.children[0].appendChild(record)

            this.#check_even()
        }
    }

    set_adjustments_list(){

    }

    set_scenarios_list(scenarios){
        //delete children
        for (let i = 1; i < this.element.children[0].children.length; i++){
            console.log(this.element.children[0].children[i])
            this.element.children[0].children[i].remove()
        }

        for (let i = 0; i < scenarios.length; i++){
            let scenario_name = scenarios[i]["name"]
            let scenario_id = scenarios[i]["id"]
            let scenario_weight_categories = scenarios[i]["weight_category"]
            let scenario_categories = scenarios[i]["category"]

            let record = document.createElement("tr")
            
            let name = document.createElement("td")
            name.innerHTML = scenario_name

            let category_tags_parent = document.createElement("td")
            for (let i = 0; i < scenario_categories.length; i++){
                category_tags_parent.innerHTML += `<span id="tag">${scenario_categories[i]}</span>`
            }

            let weight_category_tags_parent = document.createElement("td")
            for (let i = 0; i < scenario_weight_categories.length; i++){
                weight_category_tags_parent.innerHTML += `<span id="tag">${scenario_weight_categories[i]}</span>`
            }

            let select_button = document.createElement("button")
            select_button.classList.add("tablebutton")
            select_button.innerHTML = "Select"
            select_button.id = scenario_id
            

            record.appendChild(name)
            record.appendChild(category_tags_parent)
            record.appendChild(weight_category_tags_parent)
            record.appendChild(select_button)
    
            this.element.children[0].appendChild(record)

            this.#check_even()
        }
    }
}