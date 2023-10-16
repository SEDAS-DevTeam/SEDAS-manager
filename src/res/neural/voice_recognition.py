import redis

import speech_recognition as sr
import whisper
import numpy as np
from pocketsphinx import LiveSpeech
import random
import string

from queue import Queue
import threading
from time import sleep

#for index, name in enumerate(sr.Microphone.list_microphone_names()):
#    print("Microphone with name \"{1}\" found for `Microphone(device_index={0})`".format(index, name))

data_queue = Queue()

#Speech Recognition models
class Whisper:
    def __init__(self, type, db_instance):
        self.type = type
        self.model = whisper.load_model(type)
        self.Recognizer = sr.Recognizer()
        self.db_instance = db_instance

    def run_recognition(self):
        #transcription queue
        ModelThread = threading.Thread(target=self.process, args=(data_queue, r_instance))

        with sr.Microphone() as source:
            while True:
                print(running)
                value = r_instance.get("start-voice")

                #recognition check
                if value == "true": #start recognition
                    running = True
                    ModelThread.start()
                    r_instance.set("start-voice", "none") #prevents invoking random functions
                elif value == "false": #stop recognition
                    running = False
                    r_instance.set("start-voice", "none")
                    ModelThread.join()

                #the recognizer part
                try:
                    if running == True:
                        audio = self.Recognizer.listen(source, phrase_time_limit=4)
                        audio_data = audio.get_wav_data()

                        numpydata = np.frombuffer(audio_data, np.int16).copy()
                        numpydata = numpydata.flatten().astype(np.float32) / 32768.0

                        data_queue.put(numpydata)
                except KeyboardInterrupt:
                    ModelThread.join()

    def process(self, spec_queue, r_instance):
        while True:
            if not spec_queue.empty():
                numpydata = spec_queue.get()

                numpydata = whisper.pad_or_trim(numpydata)

                result = self.model.transcribe(numpydata, language="en", fp16=True, verbose=False)
                print("decoded text: " + result["text"])
                r_instance.set("out-voice", result["text"])

class CMUSphinx:
    def __init__(self, db_instance):
        self.running = False
        self.db_instance = db_instance

    def run_recognition(self, debug = False):
        ModelThread = threading.Thread(target=self.recognize, args=(debug,))
        if not debug:
            while True:
                value = r_instance.get("start-voice")
                if value == "true" and not self.running:# and not self.running:
                    ModelThread.start()
                    self.running = True

                elif value == "false":
                    ModelThread.join()
                    self.running = False
        else: #debug == False
            ModelThread.start()

    def recognize(self, debug):
        for phrase in LiveSpeech():
            self.db_instance.set("out-voice", str(phrase))
        

class DeepSpeech:
    def __init__(self, type):
        pass

if __name__ == "__main__":
    #redis
    r_instance = redis.Redis(host='localhost', port=6379, decode_responses=True)
    #model
    #m_instance = Whisper("small.en")
    m_instance = CMUSphinx(r_instance)

    m_instance.run_recognition()