var Windows = []

function AlignWindowInfo(data){
    console.log(data)
}

window.onload = () => {
    document.getElementById("send_message_redir").addEventListener("click", () => {
        window.electronAPI.send_message_redir("worker0", ["test msg"])
    })
    document.getElementById("main-header-button").addEventListener("click", () => {
        window.electronAPI.send_message("controller", ["exit"])
    })
}

window.electronAPI.on_message_redir()
window.electronAPI.on_window_info(AlignWindowInfo)