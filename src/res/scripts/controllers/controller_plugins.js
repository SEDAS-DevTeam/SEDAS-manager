//variables
var deg = 0
var initial_plugin_list; //for local plugins list

function refresh(elem){
    deg += 360
    elem.style.transform = 'rotate(' + deg + 'deg)'

    //TODO send request message to main
}

function onload_specific(){
    //blank
}

function process_specific(data){
    //blank
    console.log(data)
}

function getPlugins(){
    window.electronAPI.send_message("controller", ["get-plugin-list"])
}

window.electronAPI.on_message("plugin-list", (data) => {
    initial_plugin_list = data

    let headers = ["Plugin", "Version", "Last updated"]
    let elem = document.getElementById("plugin-tab")

    //update all the elements
    for (let i = 0; i < headers.length + 1; i++){
        let spec_elem = elem.children[0].children[0].children[i]
        if (i == headers.length){
            //append search tab
            spec_elem.innerHTML = '<th><form><input type="text" placeholder="Search.." name="search"></form></th>'
            break
        }

        spec_elem.innerHTML = headers[i]
    }

    for (let i = 1; i < data.length + 1; i++){
        let spec_elem = elem.children[0].children[i]
        let args = Object.entries(data[i - 1]["data"])

        for (let i2 = 0; i2 < spec_elem.children.length; i2++){
            if (typeof(args[i2][1]) == "boolean"){
                let button_container = document.createElement("div")
                let button = document.createElement("button")

                if (args[i2][1]){
                    //is installed
                    button.classList.add("indicator-but")
                    button.classList.add("installed")
                    button.innerHTML = "Installed"
                    button.id = data[i - 1]["header"]["id"]

                    let manage_button = document.createElement("button")
                    manage_button.classList.add("indicator-but", "manage-but")
                    manage_button.classList.add("manage")
                    manage_button.innerHTML = "Manage plugin"

                    button_container.appendChild(button)
                    button_container.appendChild(manage_button)
                }
                else{
                    //isn't installed
                    button.classList.add("indicator-but")
                    button.classList.add("not-installed")
                    button.innerHTML = "Not installed"
                    button.id = data[i - 1]["header"]["id"]
                    
                    button_container.appendChild(button)
                }
                spec_elem.children[i2].appendChild(button_container)
                continue
            }

            spec_elem.children[i2].innerHTML = args[i2][1]
        }
    }

    //reload all listeners
    let not_installed_buttons = document.querySelectorAll("button.not-installed")
    let manage_buttons = document.querySelectorAll("button.manage")
    
    for (let i = 0; i < not_installed_buttons.length; i++){
        not_installed_buttons[i].addEventListener("click", (event) => {
            window.electronAPI.send_message("controller", ["install-plugin", event.target.id, initial_plugin_list[i]["data"]["plugin"]])
        })
    }

    for (let i = 0; i < manage_buttons.length; i++){
        manage_buttons[i].addEventListener("click", (event) => {
            console.log("manage!")
        })
    }
})