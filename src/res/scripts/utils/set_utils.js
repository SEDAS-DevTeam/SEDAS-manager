import sg from '../../source/sgui/sgui.js';

const head_airports = ["Scenario preset name", "Type", "Code", "Country", "City", "Description"]
const head_aircrafts = ["Aircraft preset name", "Inspect"]
const head_commands = ["Command preseet name", "Inspect"]
const head_scenarios = ["Scenario name", "category tags", "weight category tags"]

const head_category = ["AI", "HE", "GL", "AE"]
const head_weight_category = ["UL", "L", "M", "H", "S"]

export class FrontendFunctions{
    constructor(){
        this.init_data = undefined;
    }

    #selection(event){
        let sel_id = event.target.id
        let prefix = sel_id.split("-")[0]
    
        let selection_path;
        let selection_name;
        let selection_hash;

        switch(prefix){
            case "aircraft":
                for (let i = 0; i < this.init_data[5].length; i++){
                    if (sel_id == this.init_data[5][i]["hash"]){
                        selection_path = this.init_data[5][i]["path"]
                        selection_name = this.init_data[5][i]["name"]
                    }
                }
                sg.get_elem("#confirmresult-aircraft").innerHTML = selection_name
                selected_aircraft_preset = selection_path
                
                break
            case "command":
                for (let i = 0; i < this.init_data[6].length; i++){
                    if (sel_id == this.init_data[6][i]["hash"]){
                        selection_path = this.init_data[6][i]["path"]
                        selection_name = this.init_data[6][i]["name"]
                    }
                }
                sg.get_elem("#confirmresult-command").innerHTML = selection_name
                selected_command_preset = selection_path
    
                break
            case "airport":
                for (let i = 0; i < this.init_data[2].length; i++){
                    if (sel_id == this.init_data[2][i]["hash"]){
                        selection_path = this.init_data[2][i]["content"]["FILENAME"]
                        selection_name = this.init_data[2][i]["content"]["AIRPORT_NAME"]
                    }
                }
                sg.get_elem("#confirmresult-airport").innerHTML = selection_name
                selected_map = selection_path
    
                send_message("controller", "send-scenario-list", [selected_map])
                break
            case "scenario": {
                for (let i = 0; i < all_selected_scenarios.length; i++){
                    if (sel_id == all_selected_scenarios[i]["hash"]){
                        selection_name = all_selected_scenarios[i]["name"]
                        selection_hash = all_selected_scenarios[i]["hash"]
                        break
                    }
                }
    
                sg.get_elem("#confirmresult-scenario").innerHTML = selection_name
                selected_scenario = selection_hash
    
                break
            }
        }
    }

    set_init_data(init_data){
        this.init_data = init_data
        console.log(this.init_data)
    }

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
            //remove click listeners (just in case)
            select_buttons[i].removeEventListener("click", (event) => this.#selection(event))
            select_buttons[i].addEventListener("click", (event) => this.#selection(event))
        }
    }

    listener_on_select_dropdown(){
        let select1 = document.getElementById("time-mode")
        //TODO
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

export class TableFunctions{
    constructor(element, selection_type = ""){
        this.element = element
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

    #check_even(elem){
        if (elem.attributes.even_color == "true"){
            elem.id = "color"
        }
    }

    /*
        Content generation
    */
    set_aircrafts_list(data){
        let aircraft_data = data[5]
        console.log(aircraft_data)
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

            this.#check_even(record)
        }
    }

    set_commands_list(data){
        let command_data = data[6]
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

            this.#check_even(record)
        }
    }

    set_airports_list(data){
        let airport_data = data[2]
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

            this.#check_even(record)
        }
    }

    set_adjustments_list(type){
        let sel_category;
        switch(type){
            case "category": {
                sel_category = head_category
                break
            }
            case "weight": {
                sel_category = head_weight_category
                break
            }
        }

        let row = this.element.children[0].children[0]
        for (let i = 0; i < sel_category.length; i++){
            let col = row.children[i]
            let select = document.createElement("select")
            select.innerHTML = "<option>True</option><option>False</option>"
            select.id = sel_category[i]
            select.classList.add("sel-category")

            let text = document.createElement("p")
            text.innerHTML = sel_category[i]
            text.classList.add("sel-text")

            col.appendChild(select)
            col.appendChild(text)

        }
    }

    set_scenarios_list(scenarios){
        //delete children
        this.delete_list()

        //hide warn text
        document.getElementById("map-not-selected").style.display = "none"
        for (let i = 0; i < scenarios.length; i++){
            let scenario_name = scenarios[i]["name"]
            let scenario_id = scenarios[i]["hash"]
            let scenario_content = scenarios[i]["content"]

            let scenario_weight_categories = scenario_content["wtc_category"]
            let scenario_categories = scenario_content["category"]
            
            console.log(scenario_weight_categories, scenario_categories)

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

            this.#check_even(record)
        }
    }

    delete_list(){
        for (let i = 1; i < this.element.children[0].children.length; i++){
            this.element.children[0].children[i].remove()
        }
    }
}