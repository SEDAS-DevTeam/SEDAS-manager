"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var electron_1 = require("electron");
//TODO: work with screens
//window variable declarations
var mainMenu;
var settings;
var controllerWindow;
var workerWindow;
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
    function Window(config, path) {
        Window.window = new electron_1.BrowserWindow(config);
        Window.window.setMenu(null);
        Window.path_load = path;
    }
    Window.prototype.close = function () {
        Window.window.close();
    };
    Window.prototype.show = function () {
        Window.window.loadFile(Window.path_load);
    };
    return Window;
}());
electron_1.app.on("ready", function () {
    mainMenu = new Window(main_menu_dict, "./res/index.html");
    mainMenu.show();
});
electron_1.ipcMain.on("redirect", function (event, data) {
    //redirect event handler from menu
    mainMenu.close();
    if (data == "settings") {
        settings = new Window(settings_dict, "./res/settings.html");
        settings.show();
    }
    else if (data == "main-program") {
        controllerWindow = new Window(controller_dict, "./res/controller.html");
        workerWindow = new Window(worker_dict, "./res/worker.html");
        controllerWindow.show();
        workerWindow.show();
    }
});
electron_1.ipcMain.on("redirect-settings", function (event, data) {
    settings.close(); //TODO: this doesnt seem to work for some reason
    if (data == "menu") {
        mainMenu = new Window(main_menu_dict, "./res/index.html");
        mainMenu.show();
    }
});
