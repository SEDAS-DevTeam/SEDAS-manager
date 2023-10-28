window.onload = () => {
    //render all essential things
    renderCanvas()

    document.querySelector("a#plankmsg").addEventListener("click", () => {
        window.electronAPI.send_message_redir("controller", ["test msg2"])
    })
    
    document.querySelector("a#plankmsg2").addEventListener("click", () => {
        renderPlane(50, 50)
    })
    
    document.querySelector("a#exit").addEventListener("click", () => {
        window.electronAPI.send_message("worker", ["exit"])
    })
}

window.electronAPI.on_message_redir() //for handling all message redirects