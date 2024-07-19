#include <node_api.h>
#include <iostream>
#include <string>
#include <vector>
#include <cmath>
#include <type_traits>

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

float deg_to_rad(float deg){
    return deg * (M_PI / 180);
}

float rad_to_deg(float rad){
    return round(rad * (180 / M_PI));
}

float calc_rate_of_turn(uint32_t std_bank_angle){
    return 1.091 * tan(deg_to_rad((float) std_bank_angle));
}

//Definitions for get_variable (compatible with templates)

template <typename T>
T get_variable(napi_env env, napi_value napi_elem){
    static_assert(sizeof(T) == -1, "get_variable is not implemented for this type.");
}

template<>
std::string get_variable<std::string>(napi_env env, napi_value napi_elem){
    napi_status status;
    size_t str_len;

    //get string length
    status = napi_get_value_string_utf8(env, napi_elem, nullptr, 0, &str_len);
    if (status != napi_ok) throw;

    //omit string into char*
    char* str_buf = new char[str_len + 1];
    status = napi_get_value_string_utf8(env, napi_elem, str_buf, str_len + 1, &str_len);
    if (status != napi_ok){
        delete[] str_buf;
        throw;
    }

    std::string str(str_buf);
    delete[] str_buf;

    return str;
}

template<>
float get_variable<float>(napi_env env, napi_value napi_elem){
    napi_status status;
    double result;

    status = napi_get_value_double(env, napi_elem, &result);
    if (status != napi_ok) throw;

    return result;
}

template<>
int get_variable<int>(napi_env env, napi_value napi_elem){
    napi_status status;
    int result;

    status = napi_get_value_int32(env, napi_elem, &result);
    if (status != napi_ok) throw;

    return result;
}

//Definitions for create_variable (compatible with templates)

template <typename T>
napi_value create_variable(napi_env env, T value);

template <>
napi_value create_variable<int>(napi_env env, int value) {
    napi_status status;
    napi_value elem;

    status = napi_create_int32(env, value, &elem);
    if (status != napi_ok) throw;

    return elem;
}

template <>
napi_value create_variable<std::string>(napi_env env, std::string value) {
    napi_status status;
    napi_value elem;

    status = napi_create_string_utf8(env, value.c_str(), value.length(), &elem);
    if (status != napi_ok) throw;

    return elem;
}

template <>
napi_value create_variable<float>(napi_env env, float value) {
    napi_status status;
    napi_value elem;

    status = napi_create_double(env, value, &elem);
    if (status != napi_ok) throw;

    return elem;
}

template <typename T>
napi_value create_pair_array(napi_env env, const std::vector<std::pair<T, T>>& pairs) {
    napi_value result_array;
    napi_status status = napi_create_array_with_length(env, pairs.size(), &result_array);
    if (status != napi_ok) throw;

    for (size_t i = 0; i < pairs.size(); i++) {
        napi_value pair;
        status = napi_create_array_with_length(env, 2, &pair);
        if (status != napi_ok) throw;

        napi_value first = create_variable(env, pairs[i].first);
        napi_value second = create_variable(env, pairs[i].second);

        status = napi_set_element(env, pair, 0, first);
        if (status != napi_ok) throw;
        status = napi_set_element(env, pair, 1, second);
        if (status != napi_ok) throw;

        status = napi_set_element(env, result_array, i, pair);
        if (status != napi_ok) throw;
    }

    return result_array;
}

template <typename T>
napi_value create_array(napi_env env, const std::vector<T> vector){
    napi_value result_array;
    napi_status status = napi_create_array_with_length(env, vector.size(), &result_array);

    for (size_t i = 0; i < vector.size(); i++){
        napi_value elem = create_variable(env, vector[i]);
        
        status = napi_set_element(env, result_array, i, elem);
        if (status != napi_ok) throw;
    }

    return result_array;
}

/*
    Utils for enviro calculations
*/

uint8_t calc_angle_between_two_points(std::vector<uint32_t> point_A_coords, std::vector<uint32_t> point_B_coords){
    
}

uint32_t calc_turn_time(float angle_start, float angle_final){
    uint32_t iter_time = 0;
}

/*
    Utils for main
*/


/*
    Utils for plane calculations
*/