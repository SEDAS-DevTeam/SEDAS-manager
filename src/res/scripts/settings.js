import sg from '../source/sgui/sgui.js';
import { parse_settings_layout } from '../scripts/utils/layout_loader.js';
import { on_message, send_message } from '../scripts/utils/ipc_wrapper.js';

//variables
var app_data_template = []

function onload_specific(){
    //ask for settings to load
    send_message("settings", "send-info")

    sg.get_elem("#redir_to_menu").on_click(() => {
        send_message("settings", "redirect-to-menu")
    })
    
    sg.get_elem("#save_settings").on_click(() => {
        save_settings()
    })

    let wiki_block_iframe = sg.get_elem("#wiki-block-iframe")
    let wiki_block = sg.get_elem("#wiki-block")
    if (sg.is_online()) wiki_block_iframe.src = "https://sedas-docs.readthedocs.io/en/latest/"
    else{
        wiki_block_iframe.remove()
        
        let warn_text = sg.create_elem("s-header", "", "Not connected to internet, cannot show documentation in Iframe", wiki_block)
        warn_text.style.marginLeft = "15px"
    }

    //everything is set up and loaded
    document.body.id = "loaded-body"
    sg.get_elem("page-mask").hide()
}

//load settings
function load_settings(data){
    let app_data = data[0]
    let config_data = data.slice(1, 4)
    let device_data = data.slice(4, 6)
    let layout_data = data[6]

    //spawn gui for settings area
    let layout = parse_settings_layout(layout_data)
    sg.get_elem("#settings-area").appendChild(layout)

    for (const [key, value] of Object.entries(app_data)) {
        app_data_template.push(key)
    }

    //load all app data
    var all_settings_elem = sg.get_elem(".settings-elem")

    let i = 0;
    for (const [key, value] of Object.entries(app_data)) {
        //skip
        if (key.includes("-skip")){
            i += 1
            continue
        }

        if (all_settings_elem[i].tagName == "SELECT"){
            //select element
            for(let i_child = 0; i_child < all_settings_elem[i].children.length; i_child++){
                if (all_settings_elem[i].children[i_child].value == value.toString()){
                    all_settings_elem[i].children[i_child].setAttribute('selected', true);
                    break
                }
            }
        }
        else{
            //input element
            if (all_settings_elem[i].type == "checkbox"){
                all_settings_elem[i].checked = value
            }
            else{
                all_settings_elem[i].value = value
            }
        }
        i += 1
    }

    //load all algorithms
    let all_config_elem = document.querySelectorAll('[id*="skip"]');

    //load all devices
    for (let i_device = 0; i_device < device_data.length; i_device++){
        //append all select values
        let all_devices = ""
        device_data[i_device]["devices"].forEach(device => {
            all_devices += `<option value="${device["index"]}">${device["name"]} (device index: ${device["index"]})</option>`
        })
        all_config_elem[i_device].innerHTML = all_devices
    }

    for (let i_config = 0; i_config < config_data.length; i_config++){
        //append all select values
        let all_algs = ""
        config_data[i_config]["algorithms"].forEach(alg => {
            all_algs += `<option value="${alg["name"]}">${alg["name"]} (${alg["acc"]})</option>`
        })
        all_config_elem[i_config + device_data.length].innerHTML = all_algs
    }

    //select already "selected" data for "-skip" elements
    i = 0;
    for (const [key, value] of Object.entries(app_data)) {
        if (key.includes("-skip")){
            for(let i_child = 0; i_child < all_config_elem[i].children.length; i_child++){
                if (all_config_elem[i].children[i_child].value == value){
                    all_config_elem[i].children[i_child].setAttribute('selected', true);
                }
            }

            i += 1
        }
    }

    //set wiki block to same height as settings-block
    let height = sg.get_elem("#settings-block").offsetHeight
    sg.get_elem("#wiki-block").setAttribute("style", `height: ${height}px`)
}

//save settings
function save_settings(){
    //parse form data

    if (app_data_template.length == 0){
        //values not loaded yet
        alert("Values are not loaded yet! Please wait or restart if problem persists")
    }

    let data = {}
    for (let i = 0; i < app_data_template.length; i++){
        let data_source = document.getElementById(app_data_template[i])
        let source_out;
        if (data_source.classList.contains("bin-choice")){
            source_out = (data_source.value == "true")
        }
        else if (data_source.tagName == "SELECT"){
            source_out = data_source.value
        }
        else if (data_source.tagName == "INPUT" && data_source.type == "checkbox"){
            source_out = data_source.checked
        }
        else if (data_source.tagName == "INPUT" && data_source.type == "text"){
            source_out = data_source.value
        }

        data[app_data_template[i]] = source_out
    }

    let data_str = JSON.stringify(data, null, 4)

    send_message("settings", "save-settings", [data_str])
}

sg.on_win_load(() => {
    onload_specific() //onloads set for specific page
    on_message("app-data", load_settings)
})