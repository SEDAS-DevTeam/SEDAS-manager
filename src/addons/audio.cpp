#include "include/napi_utils.hpp"
#include "include/utils.hpp"

napi_value Test_import(napi_env env, napi_callback_info info){
  return test_module(env, info);
}

napi_value init(napi_env env, napi_value exports) {
    std::vector<std::string> str_vector{ 
        "test_addon"
    };

    std::vector<napi_callback> func_vector{
        Test_import
    };

    return register_functions(env, exports, str_vector, func_vector);
}

NAPI_MODULE(NODE_GYP_MODULE_NAME, init);