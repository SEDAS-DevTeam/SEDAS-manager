window.electronAPI.on_message((data) => {
    document.getElementById("info-text").innerHTML = data[1][0]
})