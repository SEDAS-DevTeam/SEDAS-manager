"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
//system imports
var electron_1 = require("electron");
var fs = require("fs");
var worker_threads_1 = require("worker_threads");
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
var JSON_raw = fs.readFileSync("./res/data/settings.json", "utf-8");
var app_settings = JSON.parse(JSON_raw);
var main_menu_dict = {
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
var settings_dict = {
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
var controller_dict = {
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
var worker_dict = {
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
    var x;
    var y;
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
var Window = /** @class */ (function () {
    function Window(config, path, coords) {
        config.x = coords[0];
        config.y = coords[1];
        this.window = new electron_1.BrowserWindow(config);
        this.window.setMenu(null);
        this.window.webContents.openDevTools();
        this.path_load = path;
        this.window.maximize();
    }
    Window.prototype.close = function () {
        this.window.close();
    };
    Window.prototype.show = function () {
        this.window.loadFile(this.path_load);
    };
    Window.prototype.send_message = function (channel, message) {
        this.window.webContents.postMessage(channel, message);
    };
    return Window;
}());
electron_1.app.on("ready", function () {
    BackendMessager();
    //get screen info
    var displays_info = electron_1.screen.getAllDisplays();
    var displays_mod = [];
    for (var i = 0; i < displays_info.length; i++) {
        displays_mod.push(displays_info[i].bounds);
    }
    displays_mod.sort(function (a, b) { return a.x - b.x; });
    displays = displays_mod;
    //calculate x, y
    var _a = get_window_coords(-1), x = _a[0], y = _a[1];
    mainMenu = new Window(main_menu_dict, "./res/index.html", [x, y]);
    //mainMenu.show()
    //voice recognition setup
    voice_worker.postMessage("start-recognition");
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
var worker = new worker_threads_1.Worker("./controller_backend.js");
var voice_worker = new worker_threads_1.Worker("./voice_backend.js");
//worker listeners
worker.on("message", function (message) {
    console.log(message);
});
//IPC listeners
electron_1.ipcMain.on("message", function (event, data) {
    var coords = [0, 0];
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
            for (var i = 0; i < displays.length; i++) {
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
            for (var i = 0; i < workers.length; i++) {
                workers[i].show();
            }
            controllerWindow.show();
            break;
        case "exit":
            controllerWindow.close();
            for (var i = 0; i < workers.length; i++) {
                workers[i].close();
            }
            break;
        case "invoke":
            break;
    }
});
electron_1.ipcMain.on("message-redirect", function (event, data) {
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
