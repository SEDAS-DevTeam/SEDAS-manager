window.onload = () => {
    //start simulation
    document.getElementsByClassName("menubutton")[0].addEventListener("click", () => {
        send_message("menu", "redirect-to-main")
    })
    
    //settings
    document.getElementsByClassName("menubutton")[1].addEventListener("click", () => {
        send_message("menu", "redirect-to-settings")
    })

    //load simulation backup
    document.getElementsByClassName("menubutton")[2].addEventListener("click", () => {
        send_message("menu", "restore-sim")
    })
}
