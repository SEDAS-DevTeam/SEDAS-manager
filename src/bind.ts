/*
    File that imports all C++ libraries and passes them to main app code
*/
const plane_import = require("./build/Release/plane_calculations.node")
const main_import = require("./build/Release/main.node")

export namespace plane_calculations{
    export function plane_hello(){
        console.log(plane_import.hello_world())
    }
}

export namespace enviro_calculations{
    export function compute_heading_up(...args: any): string{
        return plane_import.compute_heading_up(...args)
    }
}

export namespace main{
    export function main_hello(){
        console.log(main_import.hello_world())
    }
}