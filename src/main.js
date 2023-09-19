"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var electron_1 = require("electron");
var fs = require("fs");
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
    fullscreen: false,
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
    function Window(config, path, _a) {
        var x = _a[0], y = _a[1];
        config.x = x;
        config.y = y;
        this.window = new electron_1.BrowserWindow(config);
        this.window.setMenu(null);
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
    mainMenu.show();
});
electron_1.ipcMain.on("redirect", function (event, data) {
    //redirect event handler from menu
    mainMenu.close();
    if (data == "settings") {
        //calculate x, y
        var _a = get_window_coords(-1), x = _a[0], y = _a[1];
        settings = new Window(settings_dict, "./res/settings.html", [x, y]);
        settings.show();
    }
    else if (data == "main-program") {
        //calculate x, y
        //leftmost tactic
        console.log(displays);
        for (var i = 0; i < displays.length; i++) {
            var _b = get_window_coords(i), x_1 = _b[0], y_1 = _b[1];
            //stop sequence (display limit reached)
            if (x_1 == -2 && y_1 == -2) {
                break;
            }
            if (x_1 == -3 && x_1 == -3) {
                continue;
            }
            workerWindow = new Window(worker_dict, "./res/worker.html", [x_1, y_1]);
            workers.push(workerWindow);
        }
        var _c = get_window_coords(-1), x = _c[0], y = _c[1];
        controllerWindow = new Window(controller_dict, "./res/controller.html", [x, y]);
        for (var i = 0; i < workers.length; i++) {
            workers[i].show();
        }
        controllerWindow.show();
    }
});
electron_1.ipcMain.on("redirect-settings", function (event, data) {
    settings.close();
    //calculate x, y
    var _a = get_window_coords(-1), x = _a[0], y = _a[1];
    if (data == "menu") {
        mainMenu = new Window(main_menu_dict, "./res/index.html", [x, y]);
        mainMenu.show();
    }
});
electron_1.ipcMain.on("message-redirect", function (event, data) {
    console.log(data);
    if (data[0] == "worker") {
        workerWindow.send_message("recv", data[1]);
        sender_win_name = "controller";
    }
    if (data[0] == "controller") {
        console.log("from worker");
        controllerWindow.send_message("recv", data[1]);
        sender_win_name = "worker";
    }
    else if (data[0] == "validate") { //validation arrived from receiver
        console.log("msg received!");
        if (sender_win_name == "worker") {
            workerWindow.send_message("valid", "success");
        }
        if (sender_win_name == "controller") {
            controllerWindow.send_message("valid", "success");
        }
    }
});
