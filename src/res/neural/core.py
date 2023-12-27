import redis
import threading
import signal
import time
import json
import os

from cache.voice_models import CMUSphinx, DeepSpeech, Whisper, GoogleSpeechToText
from cache.text_models import simplePOS
from cache.speech_models import Google

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
    
    #models
    m_voice_instance = GoogleSpeechToText(r_instance)
    m_text_instance = simplePOS(r_instance)
    m_speech_instance = Google(r_instance)
    

    thread_voice = threading.Thread(target=m_voice_instance.run_recognition)
    thread_text = threading.Thread(target=m_text_instance.process)
    thread_speech = threading.Thread(target=m_speech_instance.process)

    thread_voice.start()
    thread_text.start()
    thread_speech.start()

    #register signal for SIGINT
    signal.signal(signal.SIGINT, signal_handler)

    time.sleep(10)