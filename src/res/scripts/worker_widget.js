document.onload(() => {
    document.getElementById("minimize").addEventListener("click", (event) => {
        //minimize window
        window.electronAPI.send_message("worker-widget", ["min-widget"])
    })

    document.getElementById("maximize").addEventListener("click", (event) => {
        //return window to normal size
        window.electronAPI.send_message("worker-widget", ["max-widget"])
    })

    document.getElementById("exit").addEventListener("click", (event) => {
        //exit window
        window.electronAPI.send_message("worker-widget", ["exit-widget"])
    })
})