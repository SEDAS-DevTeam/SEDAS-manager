window.onload = () => {
    document.getElementById("yes").onclick = () => {
        window.electronAPI.send_message("popup-widget", ["confirm-install", true])
    }

    document.getElementById("no").onclick = () => {
        window.electronAPI.send_message("popup-widget", ["confirm", false])
    }
}

window.electronAPI.on_message("header", (data) => {
    document.getElementById("main-text").innerHTML = data
})