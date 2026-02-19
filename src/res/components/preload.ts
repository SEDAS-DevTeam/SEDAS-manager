"use strict";
// @ts-ignore
const { contextBridge, ipcRenderer, IpcRendererEvent } = require("electron")

contextBridge.exposeInMainWorld("electronAPI", {
    send_message: (message_info: string, message: any) => {
        ipcRenderer.invoke("message", [message_info, message]);
        console.log("sent message");
    },
    on_message: (channel: string, callback: (data: any) => void) => {
        ipcRenderer.on(channel, (event: typeof IpcRendererEvent, data: any) => {
            callback(data);
        });
    }
});