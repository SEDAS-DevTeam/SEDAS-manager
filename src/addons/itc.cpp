/*
    Main file for Inter-Thread-Communication
*/

#include "include/napi_utils.hpp"
#include "include/utils.hpp"

napi_value Test_import(napi_env env, napi_callback_info info){
  return test_module(env, info);
}

napi_value Register_module(napi_env env, napi_callback_info info){
    try{
        napi_value args[2];
        get_args(env, info, args);

        var_typecheck(env, args[0], napi_string);
        var_typecheck(env, args[1], napi_string);

        std::string name = get_variable<std::string>(env, args[0]);
        std::string integration_path = get_variable<std::string>(env, args[1]);
    }
        catch(const std::exception& e){
        handle_exception(env, e);
        return nullptr;
    }
}

napi_value init(napi_env env, napi_value exports) {
    std::vector<std::string> str_vector{ 
        "test_addon",
        "register_module"
    };

    std::vector<napi_callback> func_vector{
        Test_import,
        Register_module
    };

    return register_functions(env, exports, str_vector, func_vector);
}

NAPI_MODULE(NODE_GYP_MODULE_NAME, init);