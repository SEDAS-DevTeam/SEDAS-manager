#include <node_api.h>
#include <iostream>
#include <string>
#include <cstring>
#include <vector>
#include <cmath>
#include <type_traits>

#include "include/napi_utils.h"
#include "include/utils.h"

napi_value Calc_rate_of_turn(napi_env env, napi_callback_info info) {
  napi_value args[2];
  get_args(env, info, args);

  var_typecheck(env, args[0], napi_string);
  var_typecheck(env, args[1], napi_number);

  float std_bank_angle = get_variable<float>(env, args[0]);
  int plane_speed = get_variable<int>(env, args[1]);

  float result = ((1.091 * tan(deg_to_rad(std_bank_angle))) / plane_speed) * 1000;
  return create_variable(env, result);
}

napi_value Calc_climb(napi_env env, napi_callback_info info){
  // Parse the arguments
  napi_value args[5];
  get_args(env, info, args);

  var_typecheck(env, args[0], napi_number);
  var_typecheck(env, args[1], napi_number);
  var_typecheck(env, args[2], napi_string);
  var_typecheck(env, args[3], napi_string);
  var_typecheck(env, args[4], napi_number);

  int plane_speed = get_variable<int>(env, args[0]);
  int level = get_variable<int>(env, args[1]);
  float climb_angle = std::stof(get_variable<std::string>(env, args[2]));
  float scale = get_variable<float>(env, args[3]);
  int updated_level = get_variable<int>(env, args[4]);

  float change = ((plane_speed / 3600) * sin(deg_to_rad(climb_angle)));
  float fallback_diff = level + change - updated_level;

  std::vector<float> result = {change, fallback_diff};
  return create_array(env, result);
}

napi_value Calc_descent(napi_env env, napi_callback_info info){
  napi_value args[5];
  get_args(env, info, args);

  var_typecheck(env, args[0], napi_number);
  var_typecheck(env, args[1], napi_number);
  var_typecheck(env, args[2], napi_string);
  var_typecheck(env, args[3], napi_string);
  var_typecheck(env, args[4], napi_number);

  int plane_speed = get_variable<int>(env, args[0]);
  int level = get_variable<int>(env, args[1]);
  float descent_angle = std::stof(get_variable<std::string>(env, args[2]));
  float scale = get_variable<float>(env, args[3]);
  int updated_level = get_variable<int>(env, args[4]);

  float change = plane_speed / 3600 * sin(deg_to_rad(descent_angle)) / scale;
  float fallback_diff = updated_level - level - change;

  std::vector<float> result = {change, fallback_diff};
  return create_array(env, result);
}

napi_value Calc_plane_forward(napi_env env, napi_callback_info info){
  try{
    napi_value args[1];
    get_args(env, info, args);
    napi_value arg_dict = args[0];

    var_typecheck(env, arg_dict, napi_object);

    int x = get_variable<int>(env, get_dict_property(env, arg_dict, "x"));
    int y = get_variable<int>(env, get_dict_property(env, arg_dict, "y"));
    float scale = get_variable<float>(env, get_dict_property(env, arg_dict, "scale"));
    int heading = get_variable<int>(env, get_dict_property(env, arg_dict, "heading"));
    int speed = get_variable<int>(env, get_dict_property(env, arg_dict, "speed"));
    int screen_speed = get_variable<int>(env, get_dict_property(env, arg_dict, "screen_speed"));
    float refresh_rate = get_variable<float>(env, get_dict_property(env, arg_dict, "refresh_rate"));

    //normalize and convert vars
    float norm_speed = ((float) speed / 3600) * refresh_rate;
    float norm_screen_speed = ((float) screen_speed / 3600) * refresh_rate;

    std::vector<int> result;
    if (norm_speed != norm_screen_speed) result = calc_pixel_change(x, y, norm_screen_speed, scale, heading);
    else result = calc_pixel_change(x, y, norm_speed, scale, heading);

    return create_array(env, result);
  }
  catch(const std::exception& e){
    //TODO: test this
    handle_exception(env, e);
    return nullptr;
  }
}

napi_value Calc_plane_level(napi_env env, napi_callback_info info){
  // Parse the arguments
  napi_value args[1];
  get_args(env, info, args);
  napi_value arg_dict = args[0];

  // checking types of all variables passed as arguments
  var_typecheck(env, arg_dict, napi_object);

  float climb_angle = get_variable<float>(env, get_dict_property(env, arg_dict, "climb_angle"));
  float descent_angle = get_variable<float>(env, get_dict_property(env, arg_dict, "descent_angle"));
  float scale = get_variable<float>(env, get_dict_property(env, arg_dict, "scale"));
  int level = get_variable<int>(env, get_dict_property(env, arg_dict, "level"));
  int updated_level = get_variable<int>(env, get_dict_property(env, arg_dict, "updated_level"));
  int speed = get_variable<int>(env, get_dict_property(env, arg_dict, "speed"));
  float refresh_rate = get_variable<float>(env, get_dict_property(env, arg_dict, "refresh_rate"));

  if (updated_level != level){
    float k = (updated_level - level) / abs(updated_level - level);
    std::cout << k << std::endl;
  }

  // calculating screen speed
  //float screen_speed = cos(deg_to_rad(angle)) * speed;

  //Test
  napi_value result = create_empty_array(env, 3);
  napi_value param1 = create_variable(env, (float) 0.5);
  set_array_element(env, result, param1, 0);
  napi_value param2 = create_variable(env, true);
  set_array_element(env, result, param2, 1);
  napi_value param3 = create_variable(env, (float) 0.7);
  set_array_element(env, result, param3, 2);

  return result;
}

napi_value Calc_turn_fallback_diff(napi_env env, napi_callback_info info){
  napi_value args[3];
  get_args(env, info, args);

  var_typecheck(env, args[0], napi_number);
  var_typecheck(env, args[1], napi_number);
  var_typecheck(env, args[2], napi_number);

  int heading = get_variable<int>(env, args[0]);
  float rate_of_turn = get_variable<float>(env, args[1]);
  int updated_heading = get_variable<int>(env, args[2]);

  float fallback_diff = abs(heading + rate_of_turn - updated_heading);

  return create_variable(env, fallback_diff);
}

napi_value init(napi_env env, napi_value exports) {
  std::vector<std::string> str_vector{ 
    "calc_rate_of_turn",
    "calc_descent",
    "calc_climb",
    "calc_plane_forward",
    "calc_plane_level",
    "calc_turn_fallback_diff"
  };
  
  std::vector<napi_callback> func_vector{ 
    Calc_rate_of_turn,
    Calc_descent, 
    Calc_climb,
    Calc_plane_forward,
    Calc_plane_level,
    Calc_turn_fallback_diff
  };

  return register_functions(env, exports, str_vector, func_vector);
}

NAPI_MODULE(NODE_GYP_MODULE_NAME, init)