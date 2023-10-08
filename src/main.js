"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
//system imports
const electron_1 = require("electron");
const fs = require("fs");
const worker_threads_1 = require("worker_threads");
//own imports
//import * as comm from "./res/communication" //importing communication module 
//TODO: work with screens
//window variable declarations
var mainMenu;
var settings;
var controllerWindow;
var workerWindow;
//other declarations
var sender_win_name = "";
var displays = [];
var workers = [];
//read JSON
const JSON_raw = fs.readFileSync("./res/data/settings.json", "utf-8");
const app_settings = JSON.parse(JSON_raw);
const main_menu_dict = {
    width: 800,
    height: 600,
    title: "SEDAC manager",
    webPreferences: {
        nodeIntegration: true,
        contextIsolation: false
    },
    resizable: false,
    icon: "./res/img/sedac-manager-logo.png",
};
const settings_dict = {
    width: 1920,
    height: 1080,
    title: "SEDAC manager - settings",
    webPreferences: {
        nodeIntegration: true,
        contextIsolation: false
    },
    resizable: true,
    icon: "./res/img/sedac-manager-logo.png",
};
const controller_dict = {
    width: 1920,
    height: 1080,
    title: "SEDAC manager - control",
    webPreferences: {
        nodeIntegration: true,
        contextIsolation: false
    },
    resizable: true,
    icon: "./res/img/sedac-manager-logo.png",
    frame: true
};
const worker_dict = {
    width: 1920,
    height: 1080,
    title: "SEDAC",
    webPreferences: {
        nodeIntegration: true,
        contextIsolation: false
    },
    resizable: false,
    icon: "./res/img/sedac-manager-logo.png",
    frame: false,
    focusable: false
};
function get_window_coords(idx) {
    let x;
    let y;
    if (app_settings["alignment"] == "free") {
        x = undefined;
        y = undefined;
        return [x, y];
    }
    if (displays.length == 1) {
        x = displays[0].x;
        y = displays[0].y;
        return [x, y];
    }
    if (idx == -1) {
        if (app_settings["controller-loc"] == "leftmost") {
            x = displays[0].x;
            y = displays[0].y;
        }
        else if (app_settings["controller-loc"] == "rightmost") {
            x = displays[displays.length - 1].x;
            y = displays[displays.length - 1].y;
        }
    }
    else { //idx != -1: other worker windows
        if (app_settings["controller-loc"] == "leftmost") {
            if (displays.length == idx + 1) {
                return [-2, -2];
            }
            x = displays[idx + 1].x;
            y = displays[idx + 1].y;
        }
        else if (app_settings["controller-loc"] == "rightmost") {
            if (displays.length == idx) {
                return [-2, -2]; //signalizes "break"
            }
            if (idx == 0) {
                return [-3, -3]; //signalizes "skip"
            }
            x = displays[idx - 1].x;
            y = displays[idx - 1].y;
        }
    }
    return [x, y];
}
class Window {
    close() {
        this.window.close();
    }
    show() {
        this.window.loadFile(this.path_load);
    }
    send_message(channel, message) {
        this.window.webContents.postMessage(channel, message);
    }
    constructor(config, path, coords) {
        config.x = coords[0];
        config.y = coords[1];
        this.window = new electron_1.BrowserWindow(config);
        this.window.setMenu(null);
        this.window.webContents.openDevTools();
        this.path_load = path;
        this.window.maximize();
    }
}
electron_1.app.on("ready", () => {
    //BackendMessager()
    //get screen info
    var displays_info = electron_1.screen.getAllDisplays();
    var displays_mod = [];
    for (let i = 0; i < displays_info.length; i++) {
        displays_mod.push(displays_info[i].bounds);
    }
    displays_mod.sort((a, b) => a.x - b.x);
    displays = displays_mod;
    //calculate x, y
    let [x, y] = get_window_coords(-1);
    mainMenu = new Window(main_menu_dict, "./res/index.html", [x, y]);
    //mainMenu.show()
    //voice recognition setup
    //voice_worker.postMessage("start")
    //setInterval(VoiceMessager, 1000)
    //worker interval loops
    //setInterval(VoiceMessager, 1000)
});
function BackendMessager() {
    worker.postMessage("event1");
}
function VoiceMessager() {
    voice_worker.postMessage("There is that curiosity beside me");
}
//communication workers
const worker = new worker_threads_1.Worker("./controller_backend.js");
const voice_worker = new worker_threads_1.Worker("./voice_backend.js");
//worker listeners
worker.on("message", (message) => {
    console.log(message);
});
//IPC listeners
electron_1.ipcMain.on("message", (event, data) => {
    let coords = [0, 0];
    switch (data[1][0]) {
        case "redirect-to-menu":
            //message call to redirect to main menu
            settings.close();
            //calculate x, y
            coords = get_window_coords(-1);
            mainMenu = new Window(main_menu_dict, "./res/index.html", coords);
            mainMenu.show();
            break;
        case "save-settings":
            fs.writeFileSync("./res/data/settings.json", data[1][1]);
            break;
        case "redirect-to-settings":
            //message call to redirect to settings
            mainMenu.close();
            //calculate x, y
            coords = get_window_coords(-1);
            settings = new Window(settings_dict, "./res/settings.html", coords);
            settings.show();
            break;
        case "redirect-to-main":
            //message call to redirect to main program (start)
            mainMenu.close();
            //calculate x, y
            //leftmost tactic
            console.log(displays);
            for (let i = 0; i < displays.length; i++) {
                coords = get_window_coords(i);
                //stop sequence (display limit reached)
                if (coords[0] == -2) {
                    break;
                }
                if (coords[0] == -3) {
                    continue;
                }
                workerWindow = new Window(worker_dict, "./res/worker.html", coords);
                workers.push(workerWindow);
            }
            coords = get_window_coords(-1);
            controllerWindow = new Window(controller_dict, "./res/controller.html", coords);
            for (let i = 0; i < workers.length; i++) {
                workers[i].show();
            }
            controllerWindow.show();
            break;
        case "exit":
            controllerWindow.close();
            for (let i = 0; i < workers.length; i++) {
                workers[i].close();
            }
            break;
        case "invoke":
            break;
    }
});
electron_1.ipcMain.on("message-redirect", (event, data) => {
    if (data[0] == "controller") {
        console.log("from worker");
        controllerWindow.send_message("message-redirect", data[1][0]);
        sender_win_name = "worker";
    }
    else if (data[0] == "worker") {
        workers[0].send_message("message-redirect", data[1][0]);
        sender_win_name = "worker";
    }
});
//# sourceMappingURL=main.js.map