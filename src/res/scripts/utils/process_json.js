function process_JSON(data){
    let res_str = ""

    let data_json = JSON.parse(data["content"])
    for (const [key, value] of Object.entries(data_json)) {
        //create header
        res_str += `<span class="man-header">${value["manufacturer"]}</span><br>`

        //create planes
        for (const [plane_key, plane_value] of Object.entries(value["planes"])){
            res_str += '<div class="plane">'
            res_str += `<span class="plane-header">${plane_value["name"]}`
            
            //add content switch
            res_str += `<i class="plane-content-switch fa-solid fa-caret-right"></i></span><br>`

            //add plane hidden content
            res_str += `<div class="plane-content">`
            for (const [plane_inner_key, plane_inner_value] of Object.entries(plane_value)){
                if (plane_inner_key == "name"){
                    continue
                }

                //more nested elements
                if (plane_inner_key == "roc" || plane_inner_key == "rod"){
                    res_str += `<b>${plane_inner_key}:</b><br>`
                    for (const [plane_ro_key, plane_ro_value] of Object.entries(plane_inner_value)){
                        res_str += `<b class="nested">${plane_ro_key}:</b> ${plane_ro_value}<br>`
                    }
                    continue
                }

                res_str += `<b>${plane_inner_key}:</b> ${plane_inner_value}<br>`
            }
            res_str += "</div><br>"
            res_str += "</div>"
        }
    }
    return res_str
}