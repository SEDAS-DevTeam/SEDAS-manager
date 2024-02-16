import redis
import threading
import json
import os
import sys

#append all cache files to PATH
sys.path.append(os.path.join(os.path.dirname(os.path.abspath(__file__)), "cache"))

from cache.voice_models import VOICE_MODEL_DICT
from cache.text_models import TEXT_MODEL_DICT
from cache.speech_models import SPEECH_MODEL_DICT

#variables
thread_voice = None
thread_text = None
thread_speech = None

if __name__ == "__main__":
    #get redis port
    app_settings_path = os.getcwd()[:os.getcwd().index("SEDAC") + len("SEDAC")] + "/src/res/data/settings.json"
    app_settings_raw = open(app_settings_path)
    app_settings = json.load(app_settings_raw)

    #redis
    r_instance = redis.Redis(host='localhost', port=app_settings["port"], decode_responses=True)
    r_instance.set("debug-core", "Redis instance setting completed")

    #model selection
    m_voice_instance = VOICE_MODEL_DICT[app_settings["voice_alg-skip"]](r_instance)
    m_text_instance = TEXT_MODEL_DICT[app_settings["text_alg-skip"]](r_instance)
    m_speech_instance = SPEECH_MODEL_DICT[app_settings["speech_alg-skip"]](r_instance)
    
    #set all channels to default
    r_instance.set("start", "false")
    r_instance.set("terminate", "false") #used by core.py when terminating all threads
    r_instance.set("gen-speech", "")
    r_instance.set("proc-voice", "")
    r_instance.set("out-voice", "")
    r_instance.set("in-terrain", "")
    r_instance.set("out-terrain", "")
    r_instance.set("proc-voice-out", "")

    thread_voice = threading.Thread(target=m_voice_instance.process)
    thread_text = threading.Thread(target=m_text_instance.process)
    thread_speech = threading.Thread(target=m_speech_instance.process)

    r_instance.set("debug-core", "All threads initialized successfully")

    thread_voice.start()
    thread_text.start()
    thread_speech.start()

    r_instance.set("debug-core", "All threads deployed successfully")