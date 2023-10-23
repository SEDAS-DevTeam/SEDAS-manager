window.onload = () => {
    document.getElementsByClassName("menubutton")[0].addEventListener("click", () => {
        send_message('menu', ['redirect-to-main'])
    })
    
    document.getElementsByClassName("menubutton")[1].addEventListener("click", () => {
        send_message('menu', ['redirect-to-settings'])
    })    
}
