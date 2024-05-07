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
            spec_elem.children[i2].innerHTML = args[i2][1]
        }
    }
}