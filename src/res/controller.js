var Windows = []

function process_window_data(data){
    console.log(data)
}

window.onload = () => {
    //window is loaded, send command to send all info from backend
    window.electronAPI.send_message("controller", ["send-info"])

    var path = window.location.pathname;
    var page_name = path.split("/").pop();

    //didn't want to put it into separated files for better organisation
    switch(page_name){
        case "controller_gen.html":
            break

        case "controller_mon.html":
            //set page content div height
            let page_content = document.getElementById("page-content")
            let top_content = document.getElementById("top-content")

            let absolute_height = window.screen.height
            let top_height = top_content.offsetHeight

            page_content.setAttribute("style",`height:${absolute_height - top_height}px`);
            
            //set all the monitor elements

            //set all the monitor elements to draggable
            let monitor = document.getElementById("monitor-content")
            
            element_init(monitor)
            drag_element(monitor)
            draw_connection()

            //event listeners
            break

        case "controller_sim.html":
            
            //event listeners
            document.getElementById("send_message_redir").addEventListener("click", () => {
                window.electronAPI.send_message_redir("worker0", ["test msg"])
            })
            break
        
    }

    //set for all pages
    document.getElementById("main-header-button").addEventListener("click", () => {
        window.electronAPI.send_message("controller", ["exit"])
    })

    window.electronAPI.on_message_redir()
    window.electronAPI.on_init_info((data) => {
        process_window_data(data)
    })
}