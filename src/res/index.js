//generic code for every window
const ipcRender = require("electron").ipcRenderer

//main menu code
function to_settings(){
    ipcRender.send("redirect", "settings")
}

function start(){
    ipcRender.send("redirect", "main-program")
}

//settings window code
function to_menu(){
    ipcRender.send("redirect-settings", "menu")
}