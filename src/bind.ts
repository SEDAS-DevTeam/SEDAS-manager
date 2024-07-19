/*
    File that imports all C++ libraries and passes them to main app code
*/
const plane_import = require("./build/Release/plane_calculations.node")
const enviro_import = require("./build/Release/enviro_calculations.node")
const main_import = require("./build/Release/main.node")

export namespace plane_calculations{
    /*
        Function that calculates rate of descent, also calculates difference from desired level
    */
    export function calc_descent(descent_angle: number, level: number, plane_speed: number, scale: number, updated_level: number){
        return plane_import.calc_descent(descent_angle,
                                                level,
                                                plane_speed,
                                                scale,
                                                updated_level)
    }
    /*
        Function that calculates rate of climb, also calculates difference from desired level
    */
    export function calc_climb(climb_angle: number, level: number, plane_speed: number, scale: number, updated_level: number){
        return plane_import.calc_climb(climb_angle,
                                        level,
                                        plane_speed,
                                        scale,
                                        updated_level)
    }
    /*
        Function that calculates true screen speed (because of climb or descent, the speed is slower on the monitors)
    */
    export function calc_screen_speed(angle: number, speed: number){
        return plane_import.calc_screen_speed(angle, 
                                                speed)
    }
    /*
        Function that calculates rate of turn regarding the standard bank angle used for airliners and aircraft TAS
    */
    export function calc_rate_of_turn(std_bank_angle: number, speed: number){
        return plane_import.calc_rate_of_turn(std_bank_angle,
                                                speed)
    }
    /*
        Function that calculates number of pixels a plane has to move after doing following caluclations
    */
    export function calc_pixel_change(plane_x: number, plane_y: number, type: string, scale: number, heading: number, change: number){
        return plane_import.calc_pixel_change(plane_x,
                                                plane_y,
                                                type,
                                                scale,
                                                heading,
                                                change)
    }
}

export namespace enviro_calculations{
    /*
        Function that calculates all headings and timestamps a plane has to do to follow designated route
    */
    export function compute_heading_up(...args: any): any[]{
        return enviro_import.compute_heading_up(...args)
    }
}

export namespace main{
    /*
        Hello World!
    */
    export function main_hello(){
        console.log(main_import.hello_world())
    }
}