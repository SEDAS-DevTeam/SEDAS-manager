/*
  Main file for plane-agent calculation
*/

#include "include/napi_utils.hpp"
#include "include/utils.hpp"

napi_value Test_import(napi_env env, napi_callback_info info){
  return test_module(env, info);
}

napi_value Calc_rate_of_turn(napi_env env, napi_callback_info info) {
  napi_value args[2];
  get_args(env, info, args);

  var_typecheck(env, args[0], napi_string);
  var_typecheck(env, args[1], napi_number);

  float std_bank_angle = get_variable<float>(env, args[0]);
  int plane_speed = get_variable<int>(env, args[1]);

  float result = calc_rate_of_turn(std_bank_angle, plane_speed);
  return create_variable(env, result);
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
    float heading = get_variable<float>(env, get_dict_property(env, arg_dict, "heading"));
    int screen_speed = get_variable<int>(env, get_dict_property(env, arg_dict, "screen_speed"));
    float refresh_rate = get_variable<float>(env, get_dict_property(env, arg_dict, "refresh_rate"));

    //normalize and convert vars
    float norm_screen_speed = ((float) screen_speed / 3600) * refresh_rate;

    std::vector<int> result;
    result = calc_pixel_change(x, y, norm_screen_speed, scale, heading);

    return create_array(env, result);
  }
  catch(const std::exception& e){
    handle_exception(env, e);
    return nullptr;
  }
}

napi_value Calc_plane_level(napi_env env, napi_callback_info info){
  try{
    napi_value args[1];
    get_args(env, info, args);
    napi_value arg_dict = args[0];

    // checking types of all variables passed as arguments
    var_typecheck(env, arg_dict, napi_object);

    float climb_angle = get_variable<float>(env, get_dict_property(env, arg_dict, "climb_angle"));
    float descent_angle = get_variable<float>(env, get_dict_property(env, arg_dict, "descent_angle"));
    float angles[2] = {climb_angle, descent_angle};

    float scale = get_variable<float>(env, get_dict_property(env, arg_dict, "scale"));
    int level = get_variable<int>(env, get_dict_property(env, arg_dict, "level"));
    int updated_level = get_variable<int>(env, get_dict_property(env, arg_dict, "updated_level"));
    int speed = get_variable<int>(env, get_dict_property(env, arg_dict, "speed"));
    float refresh_rate = get_variable<float>(env, get_dict_property(env, arg_dict, "refresh_rate"));

    // return variables
    float new_level = level;
    bool continue_change = false;
    float screen_speed = speed; //default screen speed to speed

    if (updated_level != level){
      // plane got update to new level
      continue_change = true;
      int k = (updated_level - level) / abs(updated_level - level);
      float sel_angle = angles[(int) ceil(k / 2)];

      // calculating updated level
      float change = ((k * sin(sel_angle)) * refresh_rate) / scale;
      new_level = level + change;

      // calculating screen speed
      screen_speed = cos(deg_to_rad(sel_angle)) * speed;

      // calculating if plane did converge to specified level
      if (abs(updated_level - level) < change) continue_change = false;
    }

    napi_value result = create_empty_array(env, 3);
    napi_value param1 = create_variable(env, (float) new_level);
    set_array_element(env, result, param1, 0);
    napi_value param2 = create_variable(env, continue_change);
    set_array_element(env, result, param2, 1);
    napi_value param3 = create_variable(env, (float) screen_speed);
    set_array_element(env, result, param3, 2);

    return result;
  }
  catch(const std::exception& e){
    handle_exception(env, e);
    return nullptr;
  }
}

napi_value Calc_plane_speed(napi_env env, napi_callback_info info){
  try{
    napi_value args[1];
    get_args(env, info, args);
    napi_value arg_dict = args[0];

    // checking types of all variables passed as arguments
    var_typecheck(env, arg_dict, napi_object);

    float accel = get_variable<float>(env, get_dict_property(env, arg_dict, "accel"));
    float refresh_rate = get_variable<float>(env, get_dict_property(env, arg_dict, "refresh_rate"));
    int speed = get_variable<int>(env, get_dict_property(env, arg_dict, "speed"));
    int updated_speed = get_variable<int>(env, get_dict_property(env, arg_dict, "updated_speed"));
    float screen_speed = get_variable<float>(env, get_dict_property(env, arg_dict, "screen_speed"));

    // normalize and convert vars
    float norm_accel = accel * refresh_rate;

    // return variables
    float new_speed = speed;
    bool continue_change = false;
    float new_screen_speed = screen_speed;

    if (updated_speed != speed){
      // plane got update to new speed
      continue_change = true;
      int k = (updated_speed - speed) / abs(updated_speed - speed);

      // calculating new speed
      new_speed = speed + k * norm_accel;

      // calculating new screen speed
      new_screen_speed = screen_speed + k * norm_accel;
      
      // calculating if plane did converge to specified speed
      if (abs(updated_speed - speed) < norm_accel) continue_change = false;
    }

    napi_value result = create_empty_array(env, 3);
    napi_value param1 = create_variable(env, (float) new_speed);
    set_array_element(env, result, param1, 0);
    napi_value param2 = create_variable(env, continue_change);
    set_array_element(env, result, param2, 1);
    napi_value param3 = create_variable(env, (float) new_screen_speed);
    set_array_element(env, result, param3, 2);

    return result;
  }
  catch(const std::exception& e){
    handle_exception(env, e);
    return nullptr;
  }
}

napi_value Calc_plane_heading(napi_env env, napi_callback_info info){
  try{
    napi_value args[1];
    get_args(env, info, args);
    napi_value arg_dict = args[0];

    // checking types of all variables passed as arguments
    var_typecheck(env, arg_dict, napi_object);

    float heading = get_variable<float>(env, get_dict_property(env, arg_dict, "heading"));
    float updated_heading = get_variable<float>(env, get_dict_property(env, arg_dict, "updated_heading"));
    float rate_of_turn = get_variable<float>(env, get_dict_property(env, arg_dict, "rate_of_turn"));
    float refresh_rate = get_variable<float>(env, get_dict_property(env, arg_dict, "refresh_rate"));

    // return variables
    float new_heading = heading;
    bool continue_change = false;

    if (updated_heading != heading){
      // plane got update to new speed
      continue_change = true;

      // piecewise definition of k
      int k;
      if (heading == 180) k = -1;
      else k = (heading - 180) / abs(heading - 180);

      int in_h = heading + k * in_h;

      // calculating new heading
      new_heading = heading + ((updated_heading - in_h) / abs(updated_heading - in_h)) * rate_of_turn * refresh_rate;
      
      // calculating if plane did converge to specified heading
      if (abs(updated_heading - heading) < rate_of_turn * refresh_rate) continue_change = false;
    }

    napi_value result = create_empty_array(env, 2);
    napi_value param1 = create_variable(env, (float) new_heading);
    set_array_element(env, result, param1, 0);
    napi_value param2 = create_variable(env, continue_change);
    set_array_element(env, result, param2, 1);

    return result;
  }
  catch(const std::exception& e){
    handle_exception(env, e);
    return nullptr;
  }
}

napi_value init(napi_env env, napi_value exports) {
  std::vector<std::string> str_vector{ 
    "calc_rate_of_turn",
    "calc_plane_forward",
    "calc_plane_level",
    "calc_plane_speed",
    "calc_plane_heading",
    "test_addon"
  };
  
  std::vector<napi_callback> func_vector{ 
    Calc_rate_of_turn,
    Calc_plane_forward,
    Calc_plane_level,
    Calc_plane_speed,
    Calc_plane_heading,
    Test_import
  };

  return register_functions(env, exports, str_vector, func_vector);
}

NAPI_MODULE(NODE_GYP_MODULE_NAME, init);