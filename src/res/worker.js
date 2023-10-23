window.onload = () => {
    document.querySelector("a#plankmsg").addEventListener("click", () => {
        send_message_redir("controller", ["sex?"])
    })
    
    document.querySelector("a#plankmsg2").addEventListener("click", () => {
        renderPlane(50, 50)
    })
    
    document.querySelector("a#exit").addEventListener("click", () => {
        send_message("worker", ["exit"])
    })
}