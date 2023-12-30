import redis
import threading
import signal
import time
import json
import os

from cache.voice_models import VOICE_MODEL_DICT, whisper
from cache.text_models import TEXT_MODEL_DICT
from cache.speech_models import SPEECH_MODEL_DICT

#variables
thread_voice = None
thread_text = None
thread_speech = None

def signal_handler(sig, frame):
    print("siginterrupt detected, stopping threads")

    r_instance.set("terminate", "true")
    exit(0)

if __name__ == "__main__":
    #get redis port
    app_settings_path = os.getcwd()[:os.getcwd().index("SEDAC") + len("SEDAC")] + "/src/res/data/settings.json"
    app_settings_raw = open(app_settings_path)
    app_settings = json.load(app_settings_raw)

    #redis
    r_instance = redis.Redis(host='localhost', port=app_settings["port"], decode_responses=True)

    #model selection
    m_voice_instance = VOICE_MODEL_DICT[app_settings["voice_alg-skip"]](r_instance)
    m_text_instance = TEXT_MODEL_DICT[app_settings["text_alg-skip"]](r_instance)
    m_speech_instance = SPEECH_MODEL_DICT[app_settings["speech_alg-skip"]](r_instance)
    

    thread_voice = threading.Thread(target=m_voice_instance.process)
    thread_text = threading.Thread(target=m_text_instance.process)
    thread_speech = threading.Thread(target=m_speech_instance.process)

    thread_voice.start()
    thread_text.start()
    thread_speech.start()

    #register signal for SIGINT
    signal.signal(signal.SIGINT, signal_handler)

    time.sleep(10)