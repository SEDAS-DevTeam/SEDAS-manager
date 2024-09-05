import sg from '../source/sgui/sgui.js';
import { on_message } from '../scripts/utils/ipc_wrapper.js';

//get progress info
on_message("progress", (data) => {
    sg.get_elem("#info-text").innerHTML = data[0]
    sg.get_elem("s-loadbar").move_up()
})

//get segment slicing
on_message("setup", (data) => {
    sg.get_elem("s-loadbar").set_segments(data[0])

    sg.get_elem("#header-text").innerHTML = data[1]
    sg.get_elem("#info-text").innerHTML = data[2]
})
