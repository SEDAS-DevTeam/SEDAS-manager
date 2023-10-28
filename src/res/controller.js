window.onload = () => {
    document.getElementById("send_message_redir").addEventListener("click", () => {
        window.electronAPI.send_message_redir("worker", ["test msg"])
    })
}

window.electronAPI.on_message_redir()