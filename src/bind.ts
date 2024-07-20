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

function handle_exception_js(error: Error){
    /* Function for handling error on javascript side
    */
    console.log(error.message)
}

export namespace plane_calculations{
    /*
        Function that calculates rate of descent, also calculates difference from desired level
    */
    export function calc_descent(descent_angle: number, level: number, plane_speed: string, scale: number, updated_level: number){
        try{
            return plane_import.calc_descent(descent_angle,
                level,
                plane_speed,
                scale,
                updated_level)
        }
        catch(err){
            handle_exception_js(err)
        }
    }
    /*
        Function that calculates rate of climb, also calculates difference from desired level
    */
    export function calc_climb(climb_angle: number, level: number, plane_speed: string, scale: number, updated_level: number){
        try{
            return plane_import.calc_climb(climb_angle,
                level,
                plane_speed,
                scale,
                updated_level)
        }
        catch(err){
            handle_exception_js(err)
        }
    }
    /*
        Function that calculates true screen speed (because of climb or descent, the speed is slower on the monitors)
    */
    export function calc_screen_speed(angle: string, speed: number){
        try{
            return plane_import.calc_screen_speed(angle, speed)
        }
        catch(err){
            handle_exception_js(err)
        }
    }
    /*
        Function that calculates rate of turn regarding the standard bank angle used for airliners and aircraft TAS
    */
    export function calc_rate_of_turn(std_bank_angle: string, speed: number){
        try{
            return plane_import.calc_rate_of_turn(std_bank_angle, speed)
        }
        catch(err){
            handle_exception_js(err)
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
            handle_exception_js(err)
        }
    }

    export function calc_turn_fallback_diff(heading: number, rate_of_turn: number, updated_heading: number){
        try{
            return plane_import.calc_turn_fallback_diff(heading,
                                                        rate_of_turn,
                                                        updated_heading)
        }
        catch(err){
            handle_exception_js(err)
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
            handle_exception_js(err)
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
            handle_exception_js(err)
        }
    }
}