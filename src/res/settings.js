window.onload = () => {
    //ask for settings to load
    window.electronAPI.send_message("settings", ["send-info"])

    document.getElementById("redir_to_menu").addEventListener("click", () => {
        window.electronAPI.send_message('settings', ['redirect-to-menu'])
    })
    
    document.getElementById("save_settings").addEventListener("click", () => {
        save_settings()
    })
}

//load settings
function load_settings(data){
    let app_data = data[0]
    data.shift()
    let config_data = data

    //load all app data
    var all_settings_elem = document.getElementsByClassName("settings-elem")

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
                if (all_settings_elem[i].children[i_child].value == value){
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

    //load all configs
    let all_config_elem = document.getElementsByClassName("skip")

    for (let i_config = 0; i_config < config_data.length; i_config++){
        //append all select values
        let all_algs = ""
        config_data[i_config]["algorithms"].forEach(alg => {
            all_algs += `<option value="${alg["name"]}">${alg["name"]} (${alg["acc"]})</option>`
        })
        all_config_elem[i_config].innerHTML = all_algs
    }

    //load saved data to configs
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
}

//save settings
function save_settings(){
    //parse form data

    //general data
    let loc_data = document.getElementById("location").value
    let limit_data = document.getElementById("limit").value
    let align_data = document.getElementById("alignment").value
    let saving_freq = document.getElementById("backup").value
    let path_limit = document.getElementById("path_limit").value
    let logging = (document.getElementById("logging").value == "true")
    let database_port = document.getElementById("port").value

    //simulation data
    let ai_aggression = document.getElementById("ai_aggression").value
    let results = document.getElementById("result").checked
    let voice_alg = document.getElementById("voice_recog").value
    let text_alg = document.getElementById("text_process").value
    let speech_alg = document.getElementById("speech_synth").value

    //plane data
    let bank_angle = document.getElementById("bank_angle").value
    let min_speed = document.getElementById("min_speed").value
    let max_speed = document.getElementById("max_speed").value
    let min_altitude = document.getElementById("min_level").value
    let max_altitude = document.getElementById("max_level").value 
    let trans_altitude = document.getElementById("trans_alt").value
    let standard_pitch_up = document.getElementById("std_pitch_up").value
    let standard_pitch_down = document.getElementById("std_pitch_down").value
    let standard_acceleration = document.getElementById("std_accel").value

    let data = {
        //general data
        "controller-loc": loc_data,
        "worker-spawn": limit_data,
        "alignment": align_data,
        "saving_frequency": saving_freq,
        "plane_path_limit": path_limit,
        "logging": logging,
        "port": database_port,
        //simulation data
        "ai_aggression": ai_aggression,
        "results": results,
        "voice_alg-skip": voice_alg, //-skip is for values that are skipped on initial loading
        "text_alg-skip": text_alg,
        "speech_alg-skip": speech_alg,
        //plane data
        "std_bank_angle": bank_angle,
        "min_speed": min_speed,
        "max_speed": max_speed,
        "min_alt": min_altitude,
        "max_alt": max_altitude,
        "standard_pitch_up": standard_pitch_up,
        "standard_pitch_down": standard_pitch_down,
        "standard_accel": standard_acceleration,
        "transition_altitude": trans_altitude
    }
    let data_str = JSON.stringify(data, null, 4)
    console.log(data_str)

    window.electronAPI.send_message('settings', ['save-settings', data_str])
}

window.electronAPI.on_message("app-data", (data) => {
    //load everything
    load_settings(data)
})