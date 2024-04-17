/*
    Just a config file to keep all window definitions or anything that is predefined and isnt changed
    while running the program
*/

import path from "path"

//init
const ABS_PATH = path.resolve("")

/*
    Window configs for electron
*/
export const main_menu_dict = {
    width: 800,
    height: 600,
    title: "SEDAC manager",
    resizable: false,
    icon: "./res/img/sedac-manager-logo.png",
    webPreferences: {
        preload: path.join(ABS_PATH, "src/res/scripts/preload.js")
    }
}

export const settings_dict = {
    width: 1920,
    height: 1080,
    title: "SEDAC manager - settings",
    resizable: true,
    icon: "./res/img/sedac-manager-logo.png",
    webPreferences: {
        preload: path.join(ABS_PATH, "src/res/scripts/preload.js")
    }
}

export const exit_dict = {
    width: 500,
    height: 300,
    title: "SEDAC manager - exit tray",
    resizable: false,
    icon: "./res/img/sedac-manager-logo.png",
    frame: false,
    webPreferences: {
        preload: path.join(ABS_PATH, "src/res/scripts/preload.js")
    }
}

export const controller_dict = {
    width: 1920,
    height: 1080,
    title: "SEDAC manager - control",
    resizable: true,
    icon: "./res/img/sedac-manager-logo.png",
    frame: true,
    //focusable: true,
    webPreferences: {
        preload: path.join(ABS_PATH, "src/res/scripts/preload.js")
    }
}

export const worker_dict = {
    width: 1920,
    height: 1080,
    title: "SEDAC",
    resizable: false,
    icon: "./res/img/sedac-manager-logo.png",
    //frame: false,
    //focusable: false,
    webPreferences: {
        preload: path.join(ABS_PATH, "src/res/scripts/preload.js")
    }
}