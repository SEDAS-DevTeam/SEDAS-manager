#include <iostream>
#include <cmath>
#include <algorithm>

float deg_to_rad(float deg){
    return deg * (M_PI / 180);
}

float rad_to_deg(float rad){
    return round(rad * (180 / M_PI));
}

/*
    Utils for enviro calculations
*/

float calc_radius_of_turn(float bank_angle, int plane_speed){
    return pow(plane_speed, 2) / (11.26 * tan(deg_to_rad(bank_angle)));
}

float calc_change_by_radius(float radius, float angle_between_points){
    return radius / tan(deg_to_rad(angle_between_points / 2));
}

class trajectory_result{
    private:
        napi_value create_traj_array(napi_env env, uint16_t size){
            napi_status status;
            napi_value result;
            status = napi_create_array_with_length(env, size, &result);
            handle_napi_exception(status, env, "Failed to create array");

            return result;
        }

        void set_traj_element(napi_env env, napi_value array, uint32_t pos, napi_value elem){
            napi_status status;

            status = napi_set_element(env, array, pos, elem);
            handle_napi_exception(status, env, "Failed to set element");
        }
    
    public:
        // This notation is nested, because the result is [[x, y], heading, ...]
        std::vector<std::pair<std::pair<int, int>, int>> result;
        std::vector<std::pair<std::pair<int, int>, int>> get_result(){
            return result;
        }

        void add_point(int x, int y, int heading){
            result.push_back({ {x, y}, heading });
        }

        uint32_t size(){
            return result.size();
        }

        napi_value transform_to_napi(napi_env env){
            napi_status status;
            napi_value result_array = create_traj_array(env, result.size());

            for (size_t i = 0; i < result.size(); i++){
                // point object
                napi_value point_data = create_traj_array(env, 2);

                // coord object nested into point_data
                napi_value coords = create_traj_array(env, 2);

                napi_value x = create_variable(env, result[i].first.first);
                napi_value y = create_variable(env, result[i].first.second);
                napi_value heading = create_variable(env, result[i].second);

                set_traj_element(env, coords, 0, x);
                set_traj_element(env, coords, 1, y);

                set_traj_element(env, point_data, 0, coords);
                set_traj_element(env, point_data, 1, heading);

                set_traj_element(env, result_array, i, point_data);
            }
            return result_array;
        }
};

/*
    Utils for main
*/


/*
    Utils for plane calculations
*/

float calc_rate_of_turn(float bank_angle, int plane_speed){
    return (1091 * tan(deg_to_rad(bank_angle))) / plane_speed;
}

int atan2_to_heading_conversion(int heading){
    return ((270 - heading) + 360) % 360;
}

int heading_conversion(int heading){
    return (450 - heading) % 360;
}

float calc_heading_between_two_points(uint32_t x1, uint32_t y1, uint32_t x2, uint32_t y2){
    int dx = x2 - x1;
    int dy = y2 - y1;
    
    float heading = rad_to_deg(atan2(dy, dx));
    int heading_converted = atan2_to_heading_conversion(heading);

    return heading_converted;
}

std::vector<int> calc_pixel_change(int x, int y, float speed, float scale, float heading){
    int new_y = round(y - ((sin(deg_to_rad(heading_conversion(heading))) * speed) / scale));
    int new_x = round(x + ((cos(deg_to_rad(heading_conversion(heading))) * speed) / scale));

    std::vector<int> result = {new_x, new_y};
    return result;
}