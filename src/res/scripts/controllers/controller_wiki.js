import sg from '../../source/sgui/sgui.js';
import { on_message, send_message } from '../../scripts/utils/ipc_wrapper.js';
import { set_controller_buttons, set_controller_window, process_init_data } from '../utils/controller_utils.js'

//
//Controller Wiki
//

//wiki variables
var INIT_DATA = undefined
var sources = [
    "https://sedas-docs.readthedocs.io/en/latest/",
    "https://wiki.ivao.aero/en/home"
]

var frontend_vars = {}

function onload_wiki(){
    let iframe_buttons = sg.get_elem(".change-iframe")

    //always try to load sedas docs
    if(sg.is_online()){
        sg.get_elem("#wiki-resource").set_source(sources[0])
        iframe_buttons[0].add_class("selected")
    }
    else{
        document.get_elem("#wiki-resource").hide()
        let warn_text = sg.create_elem("s-header", "warn-text", "Not connected to internet, cannot show documentation in Iframe", sg.get_elem("#content"))
        warn_text.change_size("2")

        return //do not allow to set listeners for iframe buttons
    }

    for (let i = 0; i < iframe_buttons.length; i++){
        iframe_buttons[i].on_click(() => {
            //remove all residual class lists
            for (let elem of iframe_buttons) {
                if (elem.has_class("selected")){
                    elem.remove_class("selected")
                }
            }

            iframe_buttons[i].add_class("selected")

            sg.get_elem("#wiki-resource").set_source(sources[i])
        })
    }
}

sg.on_win_load(() => {
    set_controller_window(frontend_vars)
    set_controller_buttons()
    onload_wiki()
    
    window.electronAPI.on_init_info((data) => {
        INIT_DATA = data
        process_init_data(data)
    })
})