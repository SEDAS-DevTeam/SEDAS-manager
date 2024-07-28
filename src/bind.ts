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
    console.log(err.message)
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

    /**
     * Function that calculates plane forward step
     * 
     * **Parameters**:
     * @param climb_angle -> plane climb angle
     * @param descent_angle -> plane descent angle
     * @param scale -> scale (map scale) at which the calculations are made
     * @param level -> current level of the plane
     * @param updated_level -> target level for plane
     * @param speed -> speed of a plane
     * @param refresh_rate -> refresh rate of the screen (ATC zones have different SSR refresh rate)
     * 
     * @returns [new level (number), continue (boolean), screen_speed (number)]
    */
    export function calc_plane_level(arg: object){
        try{
            return plane_import.calc_plane_level(arg)
        }
        catch(err){
            handle_exception_js(err)
        }
    }
    /*
        Function that calculates rate of turn regarding the standard bank angle used for airliners and aircraft TAS
    */
    export function calc_rate_of_turn(std_bank_angle: number, speed: number){
        try{
            return plane_import.calc_rate_of_turn(std_bank_angle, speed)
        }
        catch(err){
            handle_exception_js(err)
        }
    }

    /**
     * Function that calculates plane level change
     * 
     * **Parameters**:
     * @param x -> current x coord
     * @param y -> current y coord
     * @param scale -> scale (map scale) at which the calculations are made
     * @param heading -> current heading of the plane
     * @param screen_speed -> the speed that the plane is moving on screen (smaller on plane climb/descent)
     * @param refresh_rate -> refresh rate of the screen (ATC zones have different SSR refresh rate)
     * 
     * @returns updated [x, y] coordinates of the plane
    */
    export function calc_plane_forward(arg: object){
        try{
            return plane_import.calc_plane_forward(arg)
        }
        catch(err){
            handle_exception_js(err)
        }
    }

    /**
     * 
     * @param accel -> acceleration of specific plane 
     * @param refresh_rate -> refresh rate of the screen (ATC zones have different SSR refresh rate) 
     * @param speed ->  speed of the plane
     * @param updated_speed -> target speed for plane
     * @param screen_speed -> the speed that the plane is moving on screen (smaller on plane climb/descent)
     * @returns [ new speed (number), continue (boolean), new screen speed (number)]
    */
    export function calc_plane_speed(arg: object){
        try{
            return plane_import.calc_plane_speed(arg)
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