"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var electron_1 = require("electron");
//TODO: work with screens
//window variable declarations
var mainMenu;
var settings;
var controllerWindow;
var workerWindow;
//other declarations
var sender_win_name = "";
var displays = [];
var main_menu_dict = {
    width: 800,
    height: 600,
    title: "SEDAC manager",
    webPreferences: {
        nodeIntegration: true,
        contextIsolation: false
    },
    resizable: false,
    icon: "./res/img/sedac-manager-logo.png"
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
    icon: "./res/img/sedac-manager-logo.png"
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
    icon: "./res/img/sedac-manager-logo.png"
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
    icon: "./res/img/sedac-manager-logo.png"
};
var Window = /** @class */ (function () {
    function Window(config, path, _a) {
        var x = _a[0], y = _a[1];
        config.x = x;
        config.y = y;
        console.log(config.x, config.y);
        this.window = new electron_1.BrowserWindow(config);
        this.window.setMenu(null);
        this.window.webContents.openDevTools();
        this.path_load = path;
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
    //leftmost tactic
    var x = displays[displays.length - 1].x;
    var y = displays[displays.length - 1].y;
    console.log(x, y);
    mainMenu = new Window(main_menu_dict, "./res/index.html", [x, y]);
    mainMenu.show();
});
electron_1.ipcMain.on("redirect", function (event, data) {
    //redirect event handler from menu
    mainMenu.close();
    if (data == "settings") {
        //calculate x, y
        //leftmost tactic
        var x = displays[displays.length - 1].x;
        var y = displays[displays.length - 1].y;
        settings = new Window(settings_dict, "./res/settings.html", [x, y]);
        settings.show();
    }
    else if (data == "main-program") {
        //calculate x, y
        //leftmost tactic
        var x1 = displays[displays.length - 2].x;
        var y1 = displays[displays.length - 2].y;
        var x2 = displays[displays.length - 3].x;
        var y2 = displays[displays.length - 3].y;
        controllerWindow = new Window(controller_dict, "./res/controller.html", [x1, y1]);
        workerWindow = new Window(worker_dict, "./res/worker.html", [x2, y2]);
        controllerWindow.show();
        workerWindow.show();
    }
});
electron_1.ipcMain.on("redirect-settings", function (event, data) {
    settings.close(); //TODO: this doesnt seem to work for some reason
    //calculate x, y
    //leftmost tactic
    var x = displays[displays.length - 1].x;
    var y = displays[displays.length - 1].y;
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
