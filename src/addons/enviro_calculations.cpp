#include "include/utils.h"

napi_value Compute_heading_up(napi_env env, napi_callback_info info) {
    // Parse the arguments
    napi_value args[5];
    get_args(env, info, 5, args);

    // checking types of all variables passed as arguments
    var_typecheck(env, args[0], napi_object);
    var_typecheck(env, args[1], napi_object);
    var_typecheck(env, args[2], napi_string);
    var_is_array(env, args[3]);
    var_typecheck(env, args[4], napi_string);

    // Process the dictionary
    napi_value acc_config = get_dict_property(env, args[0], "ACC");

    std::string dep_point = get_variable<std::string>(env, args[2]);
    std::vector<std::string> trans_points = get_string_array(env, args[3]);
    std::string arr_point = get_variable<std::string>(env, args[4]);

    // Process data and create result
    std::vector<std::pair<int, int>> int_pairs = {
        {300, 0}, {50, 60}, {150, 120} // Test (TODO)
    };

    // Create and return the result array
    napi_value result_array = create_pair_array(env, int_pairs);

    return result_array;
}

napi_value init(napi_env env, napi_value exports) {
    std::vector<std::string> str_vector{ "compute_heading_up" };
    std::vector<napi_callback> func_vector{ Compute_heading_up };

    return register_functions(env, exports, str_vector, func_vector);
}

NAPI_MODULE(NODE_GYP_MODULE_NAME, init)