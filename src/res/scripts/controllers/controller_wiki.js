//
//Controller Wiki
//

//wiki variables
var sources = [
    "https://sedas-docs.readthedocs.io/en/latest/",
    "https://wiki.ivao.aero/en/home"
]

function onload_specific(){
    let iframe_buttons = document.getElementsByClassName("change-iframe")

    //always try to load sedas docs
    if (window.navigator.onLine){
        document.getElementById("wiki-content").src = sources[0]
        iframe_buttons[0].classList.add("selected")
    }
    else{
        document.getElementById("wiki-content").src = "./internet.html"
        return //do not allow to set listeners for iframe buttons
    }

    for (let i = 0; i < iframe_buttons.length; i++){
        iframe_buttons[i].addEventListener("click", (event) => {
            //remove all residual class lists
            for (let elem of iframe_buttons) {
                console.log(elem)
                if (elem.classList.contains("selected")){
                    elem.classList.remove("selected")
                }
            }

            event.target.classList.add("selected")

            document.getElementById("wiki-content").src = sources[i]
        })
    }
}

function process_specific(){
    //empty
}