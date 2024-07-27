float deg_to_rad(float deg){
    return deg * (M_PI / 180);
}

float rad_to_deg(float rad){
    return round(rad * (180 / M_PI));
}

float calc_rate_of_turn(uint32_t std_bank_angle){
    return 1.091 * tan(deg_to_rad((float) std_bank_angle));
}

/*
    Utils for enviro calculations
*/

uint8_t calc_angle_between_two_points(std::vector<uint32_t> point_A_coords, std::vector<uint32_t> point_B_coords){
    uint8_t angle = 0;
    return angle;
}

uint32_t calc_turn_time(float angle_start, float angle_final){
    uint32_t iter_time = 0;
    return iter_time;
}

/*
    Utils for main
*/


/*
    Utils for plane calculations
*/

int heading_conversion(int heading){
    return (450 - heading) % 360;
}

std::vector<int> calc_pixel_change(int x, int y, float speed, float scale, int heading){
    int new_y = y - ((sin(deg_to_rad(heading_conversion(heading))) * speed) / scale);
    int new_x = x + ((cos(deg_to_rad(heading_conversion(heading))) * speed) / scale);

    std::vector<int> result = {new_x, new_y};
    return result;
}