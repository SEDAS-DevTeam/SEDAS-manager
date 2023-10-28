window.onload = () => {
    document.getElementById("redir_to_menu").addEventListener("click", () => {
        window.electronAPI.send_message('settings', ['redirect-to-menu'])
    })
    
    document.getElementById("save_settings").addEventListener("click", () => {
        window.electronAPI.save_settings('settings')
    })
}

//save settings
function save_settings(send_as){
    //parse form data
    let loc_data = document.getElementById("location").value
    let limit_data = document.getElementById("limit").value
    let align_data = document.getElementById("alignment").value

    let data = {
        "controller-loc": loc_data,
        "worker-spawn": limit_data,
        "alignment": align_data
    }

    send_message(send_as, ['save-settings', JSON.stringify(data, null, 2)])
}