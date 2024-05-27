function getPlugins(elem){
    //TODO rework into production
    let headers = ["Plugin", "Version", "Last updated"]
    let initial_list = [
        {
            "plugin": "SEDAC MapBuilder",
            "version": "ver 1.0.0",
            "last-updated": "Last week",
            "installed": true
        },
        {
            "plugin": "Lorem Ipsum",
            "version": "ver 1.0.0",
            "last-updated": "Last year",
            "installed": false
        },
        {
            "plugin": "Map Randgen",
            "version": "ver 1.0.0",
            "last-updated": "Last year",
            "installed": false
        }
    ]
    for (let i = 0; i < headers.length + 1; i++){
        let spec_elem = elem.children[0].children[0].children[i]
        if (i == headers.length){
            //append search tab
            spec_elem.innerHTML = '<th><form><input type="text" placeholder="Search.." name="search"></form></th>'
            break
        }

        spec_elem.innerHTML = headers[i]
    }

    for (let i = 1; i < initial_list.length + 1; i++){
        let spec_elem = elem.children[0].children[i]
        let args = Object.entries(initial_list[i - 1])

        for (let i2 = 0; i2 < spec_elem.children.length; i2++){
            if (typeof(args[i2][1]) == "boolean"){
                let button_container = document.createElement("div")
                let button = document.createElement("button")

                if (args[i2][1]){
                    //is installed
                    button.classList.add("indicator-but")
                    button.id = "installed"
                    button.innerHTML = "Installed"

                    let manage_button = document.createElement("button")
                    manage_button.classList.add("indicator-but", "manage-but")
                    manage_button.id = "manage"
                    manage_button.innerHTML = "Manage plugin"

                    button_container.appendChild(button)
                    button_container.appendChild(manage_button)
                }
                else{
                    //isn't installed
                    button.classList.add("indicator-but")
                    button.id = "not-installed"
                    button.innerHTML = "Not installed"
                    
                    button_container.appendChild(button)
                }
                spec_elem.children[i2].appendChild(button_container)
                continue
            }

            spec_elem.children[i2].innerHTML = args[i2][1]
        }
    }

    //reload all listeners
    let not_installed_buttons = document.querySelectorAll("button#not-installed")
    let manage_buttons = document.querySelectorAll("button#manage")
    //TODO
}