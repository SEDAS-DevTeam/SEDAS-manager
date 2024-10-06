import sg from '../source/sgui/sgui.js';
import { send_message } from '../scripts/utils/ipc_wrapper.js';

sg.on_win_load(() => {
    //start simulation
    sg.get_elem(".menubutton")[0].on_click(() => send_message("menu", "redirect-to-main"))
    
    //settings
    sg.get_elem(".menubutton")[1].on_click(() => send_message("menu", "redirect-to-settings"))

    //load simulation backup
    sg.get_elem(".menubutton")[2].on_click(() => send_message("menu", "restore-sim"))
})
