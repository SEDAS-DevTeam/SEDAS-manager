/*
    Getting dictionary value (nested)
*/

template <typename T>
T get_dict_value(napi_env env, napi_value napi_dict, std::vector<std::string> args);

napi_value _get_dict_value(napi_env env, napi_value napi_dict, std::vector<std::string> args){
    napi_value dict_value = get_dict_property(env, napi_dict, args[0].c_str());
    args.erase(args.begin());
    for (uint8_t i = 0; i < args.size(); i++){
        dict_value = get_dict_property(env, dict_value, args[i].c_str());
    }
    return dict_value;
}

template <>
std::string get_dict_value(napi_env env, napi_value napi_dict, std::vector<std::string> args){
    napi_value dict_value = _get_dict_value(env, napi_dict, args);
    return get_variable<std::string>(env, dict_value);
}

template <>
float get_dict_value(napi_env env, napi_value napi_dict, std::vector<std::string> args){
    napi_value dict_value = _get_dict_value(env, napi_dict, args);
    return get_variable<float>(env, dict_value);
}

template <>
int get_dict_value(napi_env env, napi_value napi_dict, std::vector<std::string> args){
    napi_value dict_value = _get_dict_value(env, napi_dict, args);
    return get_variable<int>(env, dict_value);
}

template <>
napi_value get_dict_value(napi_env env, napi_value napi_dict, std::vector<std::string> args){
    return _get_dict_value(env, napi_dict, args);
}

/*
    Getting dictionary value (normal)
*/

napi_value get_dict_element(napi_env env, napi_value napi_dict, std::string key){
    return _get_dict_value(env, napi_dict, { key });
}