#include <node_api.h>
#include <iostream>
#include <string>
#include <cstring>
#include <vector>
#include <cmath>
#include <type_traits>

#include "include/napi_utils.h"
#include "include/utils.h"
#include "include/read_dict.h"

napi_value Compute_plane_trajectory(napi_env env, napi_callback_info info) {
    // Parse the arguments
    napi_value args[1];
    get_args(env, info, args);
    napi_value arg_dict = args[0];

    var_typecheck(env, arg_dict, napi_object);
    
    napi_value map_data = get_dict_property(env, arg_dict, "map_data");
    napi_value plane_data = get_dict_property(env, arg_dict, "plane");
    napi_value transport_points = get_dict_property(env, arg_dict, "trans_points");
    std::string departure_point = get_variable<std::string>(env, get_dict_property(env, arg_dict, "dep_point"));
    std::string arrival_point = get_variable<std::string>(env, get_dict_property(env, arg_dict, "arr_point"));
    float bank_angle = get_variable<float>(env, get_dict_property(env, arg_dict, "bank_angle"));

    int trans_points_len = get_array_len(env, transport_points);

    // variable definitions
    std::pair<uint32_t, uint32_t> dep_point_coords;
    std::pair<uint32_t, uint32_t> arr_point_coords;
    std::vector<std::pair<uint32_t, uint32_t>> trans_point_coords;

    //get arrival & departure point coordinates
    napi_value points_list = get_dict_value<napi_value>(env, map_data, { "ACC", "POINTS" });
    int points_len = get_array_len(env, points_list);
    for (uint16_t i = 0; i < points_len; i++){
        napi_value point = get_array_element(env, points_list, i);
        std::string point_name = get_variable<std::string>(env, get_dict_element(env, point, "name"));
        
        if (point_name == departure_point){
            // add to departure
            dep_point_coords.first = get_variable<int>(env, get_dict_element(env, point, "x"));
            dep_point_coords.second = get_variable<int>(env, get_dict_element(env, point, "y"));
        }
        else if (point_name == arrival_point){
            // add to arrival
            arr_point_coords.first = get_variable<int>(env, get_dict_element(env, point, "x"));
            arr_point_coords.second = get_variable<int>(env, get_dict_element(env, point, "y"));
        }
        else{
            // add to transport points
            uint32_t point_x = get_variable<int>(env, get_dict_element(env, point, "x"));
            uint32_t point_y = get_variable<int>(env, get_dict_element(env, point, "y"));
            trans_point_coords.push_back({point_x, point_y});
        }
    }

    // create trajectory result object
    trajectory_result result;

    if (trans_points_len == 0){
        // plane trajectory is composed of just 2 points

        // calculate departure and set termination at x, y
        float heading = calc_heading_between_two_points(dep_point_coords.first,
                                        dep_point_coords.second,
                                        arr_point_coords.first,
                                        arr_point_coords.second);

        //TODO
    }
    else{
        // plane trajectory has more than 2 points
        // TODO
    }
    return result.transform_to_napi(env);
}

napi_value init(napi_env env, napi_value exports) {
    std::vector<std::string> str_vector{ 
        "compute_plane_trajectory"
    };

    std::vector<napi_callback> func_vector{
        Compute_plane_trajectory
    };

    return register_functions(env, exports, str_vector, func_vector);
}

NAPI_MODULE(NODE_GYP_MODULE_NAME, init)