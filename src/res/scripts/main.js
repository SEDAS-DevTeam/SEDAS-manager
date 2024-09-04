import sg from '../source/sgui/sgui.js';

window.onload = () => {
    //start simulation
    sg.get_elem(".menubutton")[0].on_click(() => send_message("menu", "redirect-to-main"))
    
    //settings
    sg.get_elem(".menubutton")[1].on_click(() => send_message("menu", "redirect-to-settings"))

    //load simulation backup
    sg.get_elem(".menubutton")[2].on_click(() => send_message("menu", "restore-sim"))
}
