import sys
import time
import redis

#init setup
r_instance = redis.Redis(host='localhost', port=6379, decode_responses=True)

while True:
    value = r_instance.get("start-voice")
    if value == "true": #start recognition
        r_instance.set("out-voice", "test string")
    elif value == "false": #stop recognition
        r_instance.set("out-voice", "none")
    time.sleep(1)