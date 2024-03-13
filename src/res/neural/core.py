import threading
import json
import os
import sys
import queue
import time
import socket

#append all cache files to PATH
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from alg_cache.voice_models import VOICE_MODEL_DICT
from alg_cache.text_models import TEXT_MODEL_DICT
from alg_cache.speech_models import SPEECH_MODEL_DICT

#variables
thread_voice = None
thread_text = None
thread_speech = None
PORT = 36000

threads_active = True

def check_server(client_socket):
    while True:
        global threads_active
        #
        # Backend to core.py communication
        #
        data_from_parent_str = client_socket.recv(1024).decode()
        data_from_parent = data_from_parent_str.split(":")

        #check debug messages
        if len(debug_queue) != 0:
            debug_message = debug_queue.pop(0)
            client_socket.sendall(f"debug: {debug_message}".encode())

        if data_from_parent[0] == "action":
            if "start-neural" in data_from_parent[1]:
                thread_voice.start()
                thread_text.start()
                thread_speech.start()

                client_socket.sendall(b"debug: started neural")
            elif "stop-neural" in data_from_parent[1]:
                queue_in_voice.append("interrupt")
                queue_in_text.append("interrupt")
                queue_in_speech.append("interrupt")

                threads_active = False

                client_socket.close()
        elif data_from_parent[0] == "data-for-speech":
            queue_in_speech.append(data_from_parent[1])

if __name__ == "__main__":
    app_settings_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))) + "/data/settings.json")
    app_settings_raw = open(app_settings_path)
    app_settings = json.load(app_settings_raw)

    #initialize socket server
    client_socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    host = "127.0.0.1"

    #initialize queues
    queue_in_voice = []
    queue_in_text = []
    queue_in_speech = []

    queue_out_voice = []
    queue_out_text = []
    queue_out_speech = []

    debug_queue = []

    #connect
    client_socket.connect((host, PORT))

    #start a thread that checks for input/output from parent
    server_checker = threading.Thread(target=check_server, args=(client_socket, ))
    server_checker.start()

    #model selection
    m_voice_instance = VOICE_MODEL_DICT[app_settings["voice_alg-skip"]](queue_in_voice, queue_out_voice, debug_queue)
    m_text_instance = TEXT_MODEL_DICT[app_settings["text_alg-skip"]](queue_in_text, queue_out_text, debug_queue)
    m_speech_instance = SPEECH_MODEL_DICT[app_settings["speech_alg-skip"]](queue_in_speech, queue_out_speech, debug_queue)

    thread_voice = threading.Thread(target=m_voice_instance.process)
    thread_text = threading.Thread(target=m_text_instance.process)
    thread_speech = threading.Thread(target=m_speech_instance.process)

    client_socket.sendall(b"debug: Initialized all model threads")

    while threads_active:

        #
        # core.py to Voice/Speech/Text algorithms
        #
        if len(queue_out_voice) != 0:
            print("test")
            data_from_voice = queue_out_voice.pop(0)
            client_socket.sendall(f"debug: {data_from_voice}".encode())
            
            queue_in_text.put(f"input: {data_from_voice}")

        if len(queue_out_text) != 0:
            data_from_text = queue_out_text.pop(0)
            client_socket.sendall(f"data: {data_from_text}".encode())

thread_voice.join()
thread_voice.join()
thread_voice.join()
server_checker.join()

client_socket.close()