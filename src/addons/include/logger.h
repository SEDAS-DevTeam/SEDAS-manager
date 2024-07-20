/*
    This file is a simple logger to log errors that happened during launching any of the .cpp codes
    NOTE: this file does not log any Debug information, it just logs errors when they happen!
*/

#include <iostream>
#include <fstream>
#include <string>
#include <ctime>

const std::string addon_log_path = "../logs/app_addon_log.txt";

class ErrorLogger {
    public:
        std::ofstream stream;
        std::string stream_path = addon_log_path;
        ErrorLogger(std::string message){

            //open stream
            stream.open(stream_path);
            stream << "#########################################" << std::endl;
            stream << "SEDAS addon logger" << std::endl;
            stream << "#########################################" << std::endl;
            log("DEBUG", message);
            log("DEBUG", "closed stream");
            stream.close();
        }

        void log(std::string category, std::string message){
            std::string time_str = get_time();
            std::string line = "[" + time_str + "] (" + category + ") " + message;
            stream << line << std::endl;
        }
    private:
        std::string get_time(){
            std::time_t time = std::time(0);
            std::tm* time_now = std::localtime(&time);
            
            std::string result = std::to_string(time_now->tm_hour) + ":" +
                                std::to_string(time_now->tm_min) + ":" + 
                                std::to_string(time_now->tm_sec);
            return result;
        }

        void create_header(std::ofstream stream){
            stream << "#########################################" << std::endl;
            stream << "SEDAS addon logger" << std::endl;
            stream << "#########################################" << std::endl;
        }
};