window.onload = () => {
    document.getElementById("yes").onclick = () => {
        window.electronAPI.send_message("popup-widget", ["confirm", "true"])
    }

    document.getElementById("no").onclick = () => {
        window.electronAPI.send_message("popup-widget", ["confirm", "false"])
    }
}