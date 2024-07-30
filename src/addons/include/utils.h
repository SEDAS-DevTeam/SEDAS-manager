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
    return pow(plane_speed, 2) / (11.26 * tan(bank_angle));
}

class trajectory_result{
    public:
        // This notation is nested, because the result is [[x, y], heading, ...]
        std::vector<std::pair<std::pair<int, int>, uint16_t>> result;

        void add_point(int x, int y, int heading){
            result.push_back({ {x, y}, heading });
        }

        napi_value transform_to_napi(napi_env env){
            std::vector<std::pair<int, int>> int_pairs = {
                {300, 0}, {50, 60}, {150, 120} // Test (TODO)
            };

            // Create and return the result array
            napi_value result_array = create_pair_array(env, int_pairs);
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
    return ((1.091 * tan(deg_to_rad(bank_angle))) / plane_speed) * 1000;
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
    std::cout << heading_converted << std::endl;

    return heading_converted;
}

std::vector<int> calc_pixel_change(int x, int y, float speed, float scale, int heading){
    int new_y = y - ((sin(deg_to_rad(heading_conversion(heading))) * speed) / scale);
    int new_x = x + ((cos(deg_to_rad(heading_conversion(heading))) * speed) / scale);

    std::vector<int> result = {new_x, new_y};
    return result;
}