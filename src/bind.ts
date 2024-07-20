/*
    File that imports all C++ libraries and passes them to main app code
*/
try {
    var plane_import = require("./build/Release/plane_calculations.node")
    var enviro_import = require("./build/Release/enviro_calculations.node")
    var main_import = require("./build/Release/main.node")
}
catch (err){
    console.log("Problem registering functions")
    console.log("Quitting program...")
    process.exit(0)
}

export namespace plane_calculations{
    /*
        Function that calculates rate of descent, also calculates difference from desired level
    */
    export function calc_descent(descent_angle: number, level: number, plane_speed: number, scale: number, updated_level: number){
        try{
            return plane_import.calc_descent(descent_angle,
                level,
                plane_speed,
                scale,
                updated_level)
        }
        catch(err){
            console.error(err.message)
        }
    }
    /*
        Function that calculates rate of climb, also calculates difference from desired level
    */
    export function calc_climb(climb_angle: number, level: number, plane_speed: number, scale: number, updated_level: number){
        try{
            return plane_import.calc_climb(climb_angle,
                level,
                plane_speed,
                scale,
                updated_level)
        }
        catch(err){
            console.error(err.message)
        }
    }
    /*
        Function that calculates true screen speed (because of climb or descent, the speed is slower on the monitors)
    */
    export function calc_screen_speed(angle: number, speed: number){
        try{
            return plane_import.calc_screen_speed(angle, 
                speed)
        }
        catch(err){
            console.error(err.message)
        }
    }
    /*
        Function that calculates rate of turn regarding the standard bank angle used for airliners and aircraft TAS
    */
    export function calc_rate_of_turn(std_bank_angle: number, speed: number){
        try{
            return plane_import.calc_rate_of_turn(std_bank_angle,
                speed)
        }
        catch(err){
            console.error(err.message)
        }
    }
    /*
        Function that calculates number of pixels a plane has to move after doing following caluclations
    */
    export function calc_pixel_change(plane_x: number, plane_y: number, type: string, scale: number, heading: number, change: number){
        try{
            return plane_import.calc_pixel_change(plane_x,
                plane_y,
                type,
                scale,
                heading,
                change)
        }
        catch(err){
            console.error(err.message)
        }
    }
}

export namespace enviro_calculations{
    /*
        Function that calculates all headings and timestamps a plane has to do to follow designated route
    */
    export function compute_heading_up(...args: any): any[]{
        try{
            return enviro_import.compute_heading_up(...args)
        }
        catch(err){
            console.error(err.message)
        }
    }
}

export namespace main{
    /*
        Hello World!
    */
    export function main_hello(){
        try{
            console.log(main_import.hello_world())
        }
        catch(err){
            console.error(err.message)
        }
    }
}