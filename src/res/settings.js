window.onload = () => {
    document.getElementById("redir_to_menu").addEventListener("click", () => {
        window.electronAPI.send_message('settings', ['redirect-to-menu'])
    })
    
    document.getElementById("save_settings").addEventListener("click", () => {
        save_settings()
    })
}

//save settings
function save_settings(){
    //parse form data
    let loc_data = document.getElementById("location").value
    let limit_data = document.getElementById("limit").value
    let align_data = document.getElementById("alignment").value

    let data = {
        "controller-loc": loc_data,
        "worker-spawn": limit_data,
        "alignment": align_data
    }
    let data_str = JSON.stringify(data)
    console.log(data_str.length)

    window.electronAPI.send_message('settings', ['save-settings', data_str])
}