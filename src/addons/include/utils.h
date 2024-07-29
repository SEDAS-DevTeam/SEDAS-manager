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

        napi_value transform_to_napi(){
            // TODO
        }
}

/*
    Utils for main
*/


/*
    Utils for plane calculations
*/

float calc_rate_of_turn(float bank_angle, int plane_speed){
    return ((1.091 * tan(deg_to_rad(bank_angle))) / plane_speed) * 1000;
}

int heading_conversion(int heading){
    return (450 - heading) % 360;
}

std::vector<int> calc_pixel_change(int x, int y, float speed, float scale, int heading){
    int new_y = y - ((sin(deg_to_rad(heading_conversion(heading))) * speed) / scale);
    int new_x = x + ((cos(deg_to_rad(heading_conversion(heading))) * speed) / scale);

    std::vector<int> result = {new_x, new_y};
    return result;
}