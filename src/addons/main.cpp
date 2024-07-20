#include "include/utils.h"

napi_value Method(napi_env env, napi_callback_info args) {
  napi_value greeting;
  napi_status status;

  status = napi_create_string_utf8(env, "hello", NAPI_AUTO_LENGTH, &greeting);
  handle_napi_exception(status, env, "Test");
  return greeting;
}

napi_value init(napi_env env, napi_value exports) {
  std::vector<std::string> str_vector{ "hello_world" };
  std::vector<napi_callback> func_vector{ Method };

  return register_functions(env, exports, str_vector, func_vector);
}

NAPI_MODULE(NODE_GYP_MODULE_NAME, init)