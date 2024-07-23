window.onload = () => {
    //start simulation
    document.getElementsByClassName("menubutton")[0].addEventListener("click", () => {
        window.electronAPI.send_message('menu', ['redirect-to-main', md5_hash(["redirect-to-main"])])
    })
    
    //settings
    document.getElementsByClassName("menubutton")[1].addEventListener("click", () => {
        window.electronAPI.send_message('menu', ['redirect-to-settings', md5_hash(["redirect-to-settings"])])
    })

    //load simulation backup
    document.getElementsByClassName("menubutton")[2].addEventListener("click", () => {
        window.electronAPI.send_message('menu', ['restore-sim', md5_hash(["restore-sim"])])
    })
}
