var Windows = []

function process_window_data(data){
    console.log(data)
}

window.onload = () => {
    //window is loaded, send command to send all info from backend
    window.electronAPI.send_message("controller", ["send-info"])

    document.getElementById("send_message_redir").addEventListener("click", () => {
        window.electronAPI.send_message_redir("worker0", ["test msg"])
    })
    document.getElementById("main-header-button").addEventListener("click", () => {
        window.electronAPI.send_message("controller", ["exit"])
    })

    window.electronAPI.on_message_redir()
    window.electronAPI.on_init_info((data) => {
        process_window_data(data)
    })
}