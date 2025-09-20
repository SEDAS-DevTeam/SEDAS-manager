/*
    Main file for SEDAS app (dev version)
*/
//read runtime args + settings ABS_PATH (first thing that needs to be done on app start)
const runtime_args = parse_args();
process.env.ABS_PATH = runtime_args["devel_path"];
import { app, BrowserWindow, ipcMain } from "electron";
const { PATH_TO_PRELOAD } = await import("../app_config.js");
let main_window;
function parse_args() {
    let proc_args = process.argv;
    let args = [];
    if (proc_args[0].includes("electron"))
        args = proc_args.slice(2); // Development mode
    else
        args = proc_args.slice(1); // Production
    let processed_args = {};
    args.forEach(elem => {
        let name = elem.split("=")[0].substring(2);
        let value = elem.split("=")[1];
        processed_args[name] = value;
    });
    return processed_args;
}
function create_window() {
    main_window = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            preload: PATH_TO_PRELOAD
        }
    });
    main_window.loadURL("http://localhost:5173/main");
    main_window.webContents.openDevTools();
}
app.on("ready", () => {
    ipcMain.handle("message", (message_data) => {
        console.log(message_data);
    });
    create_window();
});
app.commandLine.appendSwitch('remote-debugging-port', '9223');
app.commandLine.appendSwitch('remote-debugging-address', '127.0.0.1');
