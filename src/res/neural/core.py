import threading
import json
import os
import sys
import queue
import time

#append all cache files to PATH
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from alg_cache.voice_models import VOICE_MODEL_DICT
from alg_cache.text_models import TEXT_MODEL_DICT
from alg_cache.speech_models import SPEECH_MODEL_DICT

#variables
thread_voice = None
thread_text = None
thread_speech = None

if __name__ == "__main__":
    app_settings_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))) + "/data/settings.json")
    app_settings_raw = open(app_settings_path)
    app_settings = json.load(app_settings_raw)

    #initialize queues
    queue_in_voice = queue.Queue()
    queue_in_text = queue.Queue()
    queue_in_speech = queue.Queue()

    queue_out_voice = queue.Queue()
    queue_out_text = queue.Queue()
    queue_out_speech = queue.Queue()

    #model selection
    m_voice_instance = VOICE_MODEL_DICT[app_settings["voice_alg-skip"]](queue_in_voice, queue_out_voice)
    m_text_instance = TEXT_MODEL_DICT[app_settings["text_alg-skip"]](queue_in_text, queue_out_text)
    m_speech_instance = SPEECH_MODEL_DICT[app_settings["speech_alg-skip"]](queue_in_speech, queue_out_speech)

    thread_voice = threading.Thread(target=m_voice_instance.process)
    thread_text = threading.Thread(target=m_text_instance.process)
    thread_speech = threading.Thread(target=m_speech_instance.process)

    sys.stdout.write("debug: Initialized all model threads")

    while True:
        #
        # Backend to core.py communication
        #
        data_from_parent = sys.stdin.readline().rstrip().split()
        
        if data_from_parent[0] == "action":
            if data_from_parent[1] == "start-neural":
                thread_voice.start()
                thread_text.start()
                thread_speech.start()
            elif data_from_parent[1] == "stop-neural":
                queue_in_voice.put("interrupt")
                queue_in_text.put("interrupt")
                queue_in_speech.put("interrupt")

                #timeout for threads to process
                time.sleep(2)

                thread_voice.join()
                thread_voice.join()
                thread_voice.join()
        elif data_from_parent[0] == "data-for-speech":
            queue_in_speech.put(data_from_parent[1])

        #
        # core.py to Voice/Speech/Text algorithms
        #
        if not queue_in_voice.empty():
            data_from_voice = queue_out_voice.get()
            queue_in_text.put(data_from_voice)

        if not queue_out_text.empty():
            data_from_text = queue_out_text.get()
            sys.stdout.write(f"data: {data_from_text}")