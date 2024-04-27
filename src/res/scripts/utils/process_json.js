function process_JSON(data){
    let res_str = '<p id="desc-content-text">'

    let data_json = JSON.parse(data["content"])
    for (const [key, value] of Object.entries(data_json)) {
        //create header
        res_str += `<span class="man-header">${value["manufacturer"]}</span><br>`

        //create planes
        for (const [plane_key, plane_value] of Object.entries(value["planes"])){
            res_str += `<span class="plane-header">${plane_value["name"]}</span><br>`
            
        }
    }
    return res_str + "</p>"
}