#include <node_api.h>
#include <iostream>
#include <string>
#include <vector>

/*
    Glob utils
*/

void get_args(napi_env env, napi_callback_info info, size_t arg_size, napi_value* args){
    napi_status status;

    status = napi_get_cb_info(env, info, &arg_size, args, nullptr, nullptr);
    if (status != napi_ok) throw;
}

napi_value register_functions(napi_env env, napi_value exports, std::vector<std::string>& strings, std::vector<napi_callback>& callbacks) {
    napi_status status;

    size_t len = strings.size();
    for (uint8_t i = 0; i < len; i++){
        // register function to N-API
        const char* fn_name = strings[i].c_str();
        napi_callback callback = callbacks[i];
        napi_value fn;

        status = napi_create_function(env, nullptr, 0, callback, nullptr, &fn);
        if (status != napi_ok) throw;

        status = napi_set_named_property(env, exports, fn_name, fn);
        if (status != napi_ok) throw;
    }
    return exports;
}

std::string get_string(napi_env env, napi_value napi_string) {
    napi_status status;
    size_t str_len;

    //get string length
    status = napi_get_value_string_utf8(env, napi_string, nullptr, 0, &str_len);
    if (status != napi_ok) throw;

    //omit string into char*
    char* str_buf = new char[str_len + 1];
    status = napi_get_value_string_utf8(env, napi_string, str_buf, str_len + 1, &str_len);
    if (status != napi_ok) {
        delete[] str_buf;
        throw;
    }

    
    std::string str(str_buf);
    delete[] str_buf;

    return str;
}

std::vector<std::string> get_string_array(napi_env env, napi_value napi_array) {
    uint32_t array_length;
    napi_status status;
    std::vector<std::string> string_array;

    status = napi_get_array_length(env, napi_array, &array_length);
    if (status != napi_ok) throw;

    for (uint32_t i = 0; i < array_length; ++i) {
        napi_value element;
        status = napi_get_element(env, napi_array, i, &element);
        if (status != napi_ok) throw;

        size_t element_length;
        status = napi_get_value_string_utf8(env, element, nullptr, 0, &element_length);
        if (status != napi_ok) throw;

        char* element_buf = new char[element_length + 1];
        status = napi_get_value_string_utf8(env, element, element_buf, element_length + 1, &element_length);
        if (status != napi_ok) {
            delete[] element_buf;
            throw;
        }
        string_array.push_back(std::string(element_buf));
        delete[] element_buf;
    }

    return string_array;
}

napi_value get_dict_property(napi_env env, napi_value napi_dict, char* key) {
    napi_value dict_value;
    napi_status status;

    status = napi_get_named_property(env, napi_dict, key, &dict_value);
    if (status != napi_ok) throw;

    return dict_value;
}

bool var_typecheck(napi_env env, napi_value napi_var, napi_valuetype type) {
    bool result_status = true;

    napi_status status;
    napi_valuetype valuetype;

    status = napi_typeof(env, napi_var, &valuetype);
    if (status != napi_ok) throw;

    if (valuetype != type) result_status = false;
    return result_status;
}

bool var_is_array(napi_env env, napi_value napi_var) {
    bool is_array;

    napi_status status;
    status = napi_is_array(env, napi_var, &is_array);
    if (status != napi_ok) throw;

    return is_array;
}

/*
    Utils for enviro calculations
*/

napi_value create_trajectory_array(napi_env env, const std::vector<std::pair<int, int>>& pairs) {
    napi_value result_array;
    napi_status status = napi_create_array_with_length(env, pairs.size(), &result_array);
    if (status != napi_ok) return nullptr;

    for (size_t i = 0; i < pairs.size(); ++i) {
        napi_value int_pair;
        status = napi_create_array_with_length(env, 2, &int_pair);
        if (status != napi_ok) return nullptr;

        napi_value first, second;
        status = napi_create_int32(env, pairs[i].first, &first);
        if (status != napi_ok) return nullptr;
        status = napi_create_int32(env, pairs[i].second, &second);
        if (status != napi_ok) return nullptr;

        status = napi_set_element(env, int_pair, 0, first);
        if (status != napi_ok) return nullptr;
        status = napi_set_element(env, int_pair, 1, second);
        if (status != napi_ok) return nullptr;

        status = napi_set_element(env, result_array, i, int_pair);
        if (status != napi_ok) return nullptr;
    }

    return result_array;
}

/*
    Utils for main
*/


/*
    Utils for plane calculations
*/