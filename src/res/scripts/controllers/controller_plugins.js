//variables
deg = 0

function refresh(elem){
    deg += 360
    elem.style.transform = 'rotate(' + deg + 'deg)'

    //TODO send request message to main
}

function onload_specific(){
    //blank
}

function process_specific(data){
    //blank
    console.log(data)
}