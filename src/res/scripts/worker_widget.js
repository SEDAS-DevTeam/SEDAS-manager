var win_id = undefined;

import { send_message } from '../scripts/utils/ipc_wrapper.js';

window.electronAPI.on_message("register", (data) => {
    win_id = data[1]
})

window.onload = () => {
    document.getElementById("minimize").addEventListener("click", (event) => {
        //minimize window
        send_message("worker-widget", "min-widget", [win_id])
    })

    document.getElementById("maximize").addEventListener("click", (event) => {
        //return window to normal size
        send_message("worker-widget", "max-widget", [win_id])
    })

    document.getElementById("exit").addEventListener("click", (event) => {
        //exit window
        send_message("worker-widget", "exit-widget", [win_id])
    })
}