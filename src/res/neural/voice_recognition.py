import redis

import speech_recognition as sr
import whisper
import numpy as np
from pocketsphinx import LiveSpeech
import sys

from queue import Queue
import threading
from time import sleep

#for index, name in enumerate(sr.Microphone.list_microphone_names()):
#    print("Microphone with name \"{1}\" found for `Microphone(device_index={0})`".format(index, name))

Recognizer = sr.Recognizer()
data_queue = Queue()

#Speech Recognition models
class Whisper:
    def __init__(self, type):
        self.type = type
        self.model = whisper.load_model(type)

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
                        audio = Recognizer.listen(source, phrase_time_limit=4)
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
    def __init__(self):
        self.running = False

    def run_recognition(self):
        ModelThread = threading.Thread(target=self.process, args=(data_queue, r_instance))
        while True:
            value = r_instance.get("start-voice")
            if value == "true" and not self.running:# and not self.running:
                ModelThread.start()
                self.running = True

                r_instance.set("out-voice", "recog-start")
            elif value == "false":
                ModelThread.join()
                self.running = False

    def process(self):
        for phrase in LiveSpeech():
            print(phrase)
            r_instance.set("out-voice", phrase)

class DeepSpeech:
    def __init__(self, type):
        pass


#redis
r_instance = redis.Redis(host='localhost', port=6379, decode_responses=True)
#model
#m_instance = Whisper("small.en")
m_instance = CMUSphinx()

m_instance.run_recognition()