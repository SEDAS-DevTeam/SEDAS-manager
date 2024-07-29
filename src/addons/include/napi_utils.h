/*
    Glob utils
*/

void handle_napi_exception(napi_status status, napi_env env, std::string message){
    if (status != napi_ok){
        napi_value napi_message;
        napi_create_string_utf8(env, message.c_str(), message.length(), &napi_message);

        napi_value napi_error;
        napi_create_error(env, 0, napi_message, &napi_error);
        napi_throw(env, napi_error);
    }
}

void handle_exception(napi_env env, std::exception error){
    napi_value napi_message;
    const char* error_text = error.what();
    size_t error_length = strlen(error_text);

    napi_create_string_utf8(env, error.what(), error_length, &napi_message);

    napi_value napi_error;
    napi_create_error(env, 0, napi_message, &napi_error);
    napi_throw(env, napi_error);
}

int get_array_len(napi_env env, napi_callback_info array){
    size_t arg_size;
    napi_status status;

    status = napi_get_cb_info(env, array, &arg_size, nullptr, nullptr, nullptr);
    handle_napi_exception(status, env, "Failed to get argument list length");

    return arg_size;
}

int get_array_len(napi_env env, napi_value napi_array){
    uint32_t array_size;
    napi_status status;

    status = napi_get_array_length(env, napi_array, &array_size);
    handle_napi_exception(status, env, "Failed to get napi_value array length");

    return array_size;
}

template <typename T>
int get_array_len(napi_env env, T array){
    return sizeof(array) / sizeof(array[0]); 
}

void get_args(napi_env env, napi_callback_info info, napi_value* args){
    napi_status status;
    size_t arg_size = get_array_len(env, info);

    status = napi_get_cb_info(env, info, &arg_size, args, nullptr, nullptr);
    handle_napi_exception(status, env, "Failed to get args");
}

napi_value register_functions(napi_env env, napi_value exports, std::vector<std::string> strings, std::vector<napi_callback> callbacks) {
    napi_status status;

    size_t len = strings.size();
    for (uint8_t i = 0; i < len; i++){
        // register function to N-API
        const char* fn_name = strings[i].c_str();
        napi_callback callback = callbacks[i];
        napi_value fn;

        status = napi_create_function(env, nullptr, 0, callback, nullptr, &fn);
        handle_napi_exception(status, env, "Failed to create a function");

        status = napi_set_named_property(env, exports, fn_name, fn);
        handle_napi_exception(status, env, "Failed to create named property");
    }
    return exports;
}

std::vector<std::string> get_string_array(napi_env env, napi_value napi_array) {
    uint32_t array_length;
    napi_status status;
    std::vector<std::string> string_array;

    array_length = get_array_len(env, napi_array);

    for (uint32_t i = 0; i < array_length; ++i) {
        napi_value element;
        status = napi_get_element(env, napi_array, i, &element);
        handle_napi_exception(status, env, "Failed to get element");

        size_t element_length;
        status = napi_get_value_string_utf8(env, element, nullptr, 0, &element_length);
        handle_napi_exception(status, env, "Failed to get string length");

        char* element_buf = new char[element_length + 1];
        status = napi_get_value_string_utf8(env, element, element_buf, element_length + 1, &element_length);
        handle_napi_exception(status, env, "Failed to get string contents");
        string_array.push_back(std::string(element_buf));
        delete[] element_buf;
    }

    return string_array;
}

napi_value get_dict_property(napi_env env, napi_value napi_dict, const char* key) {
    napi_value dict_value;
    napi_status status;

    status = napi_get_named_property(env, napi_dict, key, &dict_value);
    handle_napi_exception(status, env, "Failed to get dictionary property");

    return dict_value;
}

bool var_typecheck(napi_env env, napi_value napi_var, napi_valuetype type) {
    bool result_status = true;

    napi_status status;
    napi_valuetype valuetype;

    status = napi_typeof(env, napi_var, &valuetype);
    handle_napi_exception(status, env, "Failed to do variable typecheck");

    if (valuetype != type) result_status = false;
    return result_status;
}

bool var_is_array(napi_env env, napi_value napi_var) {
    bool is_array;

    napi_status status;
    status = napi_is_array(env, napi_var, &is_array);
    handle_napi_exception(status, env, "Failed to check if variable is array");

    return is_array;
}

//Definitions for get_variable (compatible with templates)

template <typename T>
T get_variable(napi_env env, napi_value napi_elem);

template <>
std::string get_variable<std::string>(napi_env env, napi_value napi_elem){
    napi_status status;
    size_t str_len;

    //get string length
    status = napi_get_value_string_utf8(env, napi_elem, nullptr, 0, &str_len);
    handle_napi_exception(status, env, "Failed to get string variable length");

    //omit string into char*
    char* str_buf = new char[str_len + 1];
    status = napi_get_value_string_utf8(env, napi_elem, str_buf, str_len + 1, &str_len);
    handle_napi_exception(status, env, "Failed to get string variable");

    std::string str(str_buf);
    delete[] str_buf;

    return str;
}

template <>
float get_variable<float>(napi_env env, napi_value napi_elem){
    napi_status status;
    double result;

    status = napi_get_value_double(env, napi_elem, &result);
    handle_napi_exception(status, env, "Failed to get float variable");

    return result;
}

template <>
int get_variable<int>(napi_env env, napi_value napi_elem){
    napi_status status;
    int result;

    status = napi_get_value_int32(env, napi_elem, &result);
    handle_napi_exception(status, env, "Failed to get integer variable");

    return result;
}

//Definitions for create_variable (compatible with templates)

napi_value create_variable(napi_env env, int value) {
    napi_status status;
    napi_value elem;

    status = napi_create_int32(env, value, &elem);
    handle_napi_exception(status, env, "Failed to create integer variable");

    return elem;
}

napi_value create_variable(napi_env env, std::string value) {
    napi_status status;
    napi_value elem;

    status = napi_create_string_utf8(env, value.c_str(), value.length(), &elem);
    handle_napi_exception(status, env, "Failed to create string variable");

    return elem;
}

napi_value create_variable(napi_env env, float value) {
    napi_status status;
    napi_value elem;

    status = napi_create_double(env, value, &elem);
    handle_napi_exception(status, env, "Failed to create float variable");

    return elem;
}

napi_value create_variable(napi_env env, bool value) {
    napi_status status;
    napi_value elem;

    status = napi_get_boolean(env, value, &elem);
    handle_napi_exception(status, env, "Failed to create float variable");

    return elem;
}

template <typename T>
napi_value create_pair_array(napi_env env, const std::vector<std::pair<T, T>>& pairs) {
    napi_value result_array;
    napi_status status = napi_create_array_with_length(env, pairs.size(), &result_array);
    handle_napi_exception(status, env, "Failed to create array");

    for (size_t i = 0; i < pairs.size(); i++) {
        napi_value pair;
        status = napi_create_array_with_length(env, 2, &pair);
        handle_napi_exception(status, env, "Failed to create array");

        napi_value first = create_variable(env, pairs[i].first);
        napi_value second = create_variable(env, pairs[i].second);

        status = napi_set_element(env, pair, 0, first);
        handle_napi_exception(status, env, "Failed to set element");
        status = napi_set_element(env, pair, 1, second);
        handle_napi_exception(status, env, "Failed to set element");

        status = napi_set_element(env, result_array, i, pair);
        handle_napi_exception(status, env, "Failed to set element");
    }

    return result_array;
}

template <typename T>
napi_value create_array(napi_env env, const std::vector<T> vector){
    napi_value result_array;
    napi_status status;
    
    status = napi_create_array_with_length(env, vector.size(), &result_array);
    handle_napi_exception(status, env, "Failed to create array");

    for (size_t i = 0; i < vector.size(); i++){
        napi_value elem = create_variable(env, vector[i]);
        
        status = napi_set_element(env, result_array, i, elem);
        handle_napi_exception(status, env, "Failed to set array element");
    }

    return result_array;
}

napi_value create_empty_array(napi_env env, size_t arr_length){
    napi_value result_array;
    napi_status status;

    status = napi_create_array_with_length(env, arr_length, &result_array);
    handle_napi_exception(status, env, "Failed to create array");

    return result_array;
}

void set_array_element(napi_env env, napi_value array, napi_value value, uint16_t position){
    napi_status status;

    status = napi_set_element(env, array, position, value);
    handle_napi_exception(status, env, "Failed to set array element");
}

napi_value get_array_element(napi_env env, napi_value array, uint32_t index){
    napi_value elem;
    napi_status status = napi_get_element(env, array, index, &elem);
    handle_napi_exception(status, env, "Cannot read element at specified index");

    return elem;
}