window.onload = () => {
    document.getElementById("redir_to_menu").addEventListener("click", () => {
        send_message('settings', ['redirect-to-menu'])
    })
    
    document.getElementById("save_settings").addEventListener("click", () => {
        save_settings('settings')
    })
}