#include "include/utils.h"

napi_value Calc_rate_of_turn(napi_env env, napi_callback_info info) {
  napi_value args[2];
  get_args(env, info, 2, args);

  float std_bank_angle = get_variable<float>(env, args[0]);
  int plane_speed = get_variable<int>(env, args[1]);
  return create_variable<float>(env, ((1.091 * tan(deg_to_rad(std_bank_angle))) / plane_speed) * 1000);
}

napi_value Calc_climb(napi_env env, napi_callback_info info){
  // Parse the arguments
  napi_value args[5];
  get_args(env, info, 5, args);

  int plane_speed = get_variable<int>(env, args[0]);
  int level = get_variable<int>(env, args[1]);
  float climb_angle = get_variable<float>(env, args[2]);
  float scale = get_variable<float>(env, args[3]);
  int updated_level = get_variable<int>(env, args[4]);

  float change = (plane_speed / 3600) * sin(deg_to_rad(climb_angle)) / scale;
  float fallback_diff = level + change - updated_level;

  std::vector<float> result = {change, fallback_diff};
  return create_array(env, result); //TODO, wut
}

napi_value Calc_descent(napi_env env, napi_callback_info info){
  napi_value args[4];
  get_args(env, info, 4, args);

  int plane_speed = get_variable<int>(env, args[0]);
  int level = get_variable<int>(env, args[1]);
  float descent_angle = get_variable<float>(env, args[2]);
  float scale = get_variable<float>(env, args[3]);
  int updated_level = get_variable<int>(env, args[4]);

  float change = plane_speed / 3600 * sin(deg_to_rad(descent_angle)) / scale;
  float fallback_diff = updated_level - level - change;

  std::vector<float> result = {change, fallback_diff};
  return create_array(env, result);
}

napi_value Calc_pixel_change(napi_env env, napi_callback_info info){
  napi_value args[6];
  get_args(env, info, 6, args);

  int plane_x = get_variable<int>(env, args[0]);
  int plane_y = get_variable<int>(env, args[0]);

  std::string type = get_variable<std::string>(env, args[0]);
  float scale = get_variable<float>(env, args[1]);
  int heading = get_variable<int>(env, args[2]);
  float change = get_variable<float>(env, args[3]);

  uint8_t angle_head = floor(heading / 90);
  float rel_angle = heading % 90;
  if (rel_angle == 0 && heading != 0){
    rel_angle = heading - (angle_head - 1) * heading;
  }

  float dy_n_scale = sin(deg_to_rad(rel_angle)) * change;
  float dx_n_scale = cos(deg_to_rad(rel_angle)) * change;

  float dy = 0;
  float dx = 0;
  if (type == "movement"){
    dy = dy_n_scale / scale;
    dx = dx_n_scale / scale;
  }
  else if (type == "rotation"){
    dy = dy_n_scale;
    dx = dx_n_scale;
  }

  // automatically aproximmate scale
  dy = ceil(dy);
  dx = ceil(dx);

  int x_fin = 0;
  int y_fin = 0;

  switch(angle_head){
    case 0:
      x_fin = plane_x + dy;
      y_fin = plane_y - dx;
      break;
    case 1:
      x_fin = plane_x + dy;
      y_fin = plane_y + dx;
      break;
    case 2:
      x_fin = plane_x - dy;
      y_fin = plane_y + dx;
      break;
    case 3:
      x_fin = plane_x - dy;
      y_fin = plane_y - dx;
      break;
  }

  if (heading == 90){
    x_fin = plane_x + dy;
    y_fin = plane_y;
  }
  else if (heading == 180){
    x_fin = plane_x;
    y_fin = plane_y + dx;
  }
  else if (heading == 270){
    x_fin = plane_x - dy;
    y_fin = plane_y;
  }

  std::vector<int> result = {x_fin, y_fin};
  return create_array(env, result);
}

napi_value Calc_screen_speed(napi_env env, napi_callback_info info){
  // Parse the arguments
  napi_value args[2];
  get_args(env, info, 2, args);

  // checking types of all variables passed as arguments
  var_typecheck(env, args[0], napi_number);
  var_typecheck(env, args[1], napi_number);

  float angle = get_variable<float>(env, args[0]);
  float plane_speed = get_variable<float>(env, args[1]);

  return create_variable<float>(env, cos(deg_to_rad(angle)) * plane_speed);
}

napi_value Calc_speed_change(napi_env env, napi_callback_info info){

}

napi_value Calc_turn_change(napi_env env, napi_callback_info info){

}

napi_value init(napi_env env, napi_value exports) {
  std::vector<std::string> str_vector{ "calc_rate_of_turn", "calc_pixel_change", "calc_descent", "calc_climb" };
  std::vector<napi_callback> func_vector{ Calc_rate_of_turn, Calc_pixel_change, Calc_descent };

  return register_functions(env, exports, str_vector, func_vector);
}

NAPI_MODULE(NODE_GYP_MODULE_NAME, init)