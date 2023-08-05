"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var electron_1 = require("electron");
var main_menu_settings = {
    width: 800,
    height: 600,
    title: "SEDAC manager",
    webPreferences: {
        nodeIntegration: true,
        contextIsolation: false
    },
    resizable: false
};
var Window = /** @class */ (function () {
    function Window(config) {
        Window.window = new electron_1.BrowserWindow(config);
        Window.window.on("closed", this.onClose);
    }
    Window.prototype.onClose = function () {
        Window.window = null;
    };
    Window.prototype.show = function () {
        Window.window.loadFile("./res/index.html");
    };
    return Window;
}());
function start_app() {
    var mainMenu = new Window(main_menu_settings);
    mainMenu.show();
}
electron_1.app.on("ready", function () {
    start_app();
});
