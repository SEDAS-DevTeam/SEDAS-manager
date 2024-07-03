#include <node_api.h>
#include <iostream>
#include <string>
#include <vector>

napi_value Compute_heading_up(napi_env env, napi_callback_info info) {
    napi_value napi_result;
    napi_status status;

    // Parse the arguments
    size_t argc = 3;
    napi_value args[3];

    status = napi_get_cb_info(env, info, &argc, args, nullptr, nullptr);
    if (status != napi_ok) return nullptr;

    //argument retrival
    char* dep_point_buf;
    char* arr_point_buf;

    // Get the length of the first string
    size_t str_len0;
    status = napi_get_value_string_utf8(env, args[0], nullptr, 0, &str_len0);
    if (status != napi_ok) return nullptr;

    // Get the length of the second string
    size_t str_len1;
    status = napi_get_value_string_utf8(env, args[1], nullptr, 0, &str_len1);
    if (status != napi_ok) return nullptr;

    // Copy the first string to the result
    status = napi_get_value_string_utf8(env, args[0], dep_point_buf, str_len0 + 1, &str_len0);
    if (status != napi_ok) return nullptr;

    // Copy the second string to the result
    status = napi_get_value_string_utf8(env, args[1], arr_point_buf, str_len1 + 1, &str_len1);
    if (status != napi_ok) return nullptr;

    //convert char to std::string
    std::string dep_point(dep_point_buf);
    std::string arr_point(arr_point_buf);
    
    //Test
    std::string result = dep_point += arr_point;

    status = napi_create_string_utf8(env, result.data(), NAPI_AUTO_LENGTH, &napi_result);
    if (status != napi_ok) return nullptr;
    return napi_result;
}

napi_value init(napi_env env, napi_value exports) {
    napi_status status;
    napi_value fn_com_he_up;

    status = napi_create_function(env, nullptr, 0, Compute_heading_up, nullptr, &fn_com_he_up);
    if (status != napi_ok) return nullptr;

    status = napi_set_named_property(env, exports, "compute_heading_up", fn_com_he_up);
    if (status != napi_ok) return nullptr;
    return exports;
}

NAPI_MODULE(NODE_GYP_MODULE_NAME, init)