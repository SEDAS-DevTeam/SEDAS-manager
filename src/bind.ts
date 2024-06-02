/*
    File that imports all C++ libraries and passes them to main
*/

const plane_calculations = require("./build/Release/plane_calculations.node")
const main = require("./build/Release/main.node")

export function plane_hello(){
    console.log(plane_calculations.hello_world())
}

export function main_hello(){
    console.log(main.hello_world())
}