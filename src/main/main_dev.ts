import { app, BrowserWindow } from "electron"

let main_window: BrowserWindow;

function create_window(){
    main_window = new BrowserWindow({
        width: 1200,
        height: 800
    })

    main_window.loadURL("http://localhost:5173")
    main_window.webContents.openDevTools()
}

app.on("ready", () => {
    create_window()
})