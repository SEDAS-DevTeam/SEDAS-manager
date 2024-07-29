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

    //get arrival & departure point coordinates
    napi_value acc_zone = get_dict_property(env, map_data, "ACC");
    napi_value acc_points = get_dict_property(env, acc_zone, "POINTS");
    int acc_points_len = get_array_len(env, acc_points);
    for (uint16_t i = 0; i < acc_points_len; i++){
        napi_value point;
        napi_status status = napi_get_element(env, acc_points, i, &point);
        handle_napi_exception(status, env, "Cannot read point at specified index");

        std::string point_name = get_variable<std::string>(env, get_dict_property(env, point, "name"));
        if (departure_point == point_name){

        }
        
        if (arrival_point == point_name){

        }
    }

    if (trans_points_len == 0){
        // plane trajectory is composed of just 2 points
    }
    else{
        // plane trajectory has more than 2 points

    }

    // Process data and create result
    std::vector<std::pair<int, int>> int_pairs = {
        {300, 0}, {50, 60}, {150, 120} // Test (TODO)
    };

    // Create and return the result array
    napi_value result_array = create_pair_array(env, int_pairs);

    return result_array;
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