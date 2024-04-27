var win_id = undefined;

window.electronAPI.on_message("register", (data) => {
    win_id = data[1]
})

window.onload = () => {
    document.getElementById("minimize").addEventListener("click", (event) => {
        //minimize window
        window.electronAPI.send_message("worker-widget", ["min-widget", win_id])
    })

    document.getElementById("maximize").addEventListener("click", (event) => {
        //return window to normal size
        window.electronAPI.send_message("worker-widget", ["max-widget", win_id])
    })

    document.getElementById("exit").addEventListener("click", (event) => {
        //exit window
        window.electronAPI.send_message("worker-widget", ["exit-widget", win_id])
    })
}