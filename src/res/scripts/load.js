var n_seg = 0
var seg_slice = 0
var curr_n_seg = 0
var header = ""

//get progress info
window.electronAPI.on_message("progress", (data) => {
    document.getElementById("info-text").innerHTML = data[0]
    curr_n_seg += 1
    let width = curr_n_seg * seg_slice
    document.getElementById("loadbar").style.width = width.toString() + "%"
})

//get segment slicing
window.electronAPI.on_message("setup", (data) => {
    n_seg = data[0]
    seg_slice = 100 / n_seg

    header = data[1]
    document.getElementById("header-text").innerHTML = header
})