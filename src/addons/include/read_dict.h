#include <node_api.h>
#include <string>
#include <vector>

template <typename T>
T get_dict_value(napi_env env, napi_value napi_dict, std::vector<std::string> args);

template <>
std::string get_dict_value(napi_env env, napi_value path, std::vector<std::string> args){
    for (uint8_t i = 0; i < args.size(); i++){
        
    }
}

template <>
float get_dict_value(napi_env env, napi_value path, std::vector<std::string> args){

}