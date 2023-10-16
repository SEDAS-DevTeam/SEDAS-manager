import speech_recognition as sr
import whisper
import numpy as np
from pocketsphinx import LiveSpeech

import threading

class Whisper:
    def __init__(self, type, db_instance, data_queue):
        self.type = type
        self.model = whisper.load_model(type)
        self.Recognizer = sr.Recognizer()
        self.db_instance = db_instance
        self.data_queue = data_queue

    def run_recognition(self):
        #transcription queue
        ModelThread = threading.Thread(target=self.process, args=(self.data_queue, self.db_instance))

        with sr.Microphone() as source:
            while True:
                print(running)
                value = self.db_instance.get("start-voice")

                #recognition check
                if value == "true": #start recognition
                    running = True
                    ModelThread.start()
                    self.db_instance.set("start-voice", "none") #prevents invoking random functions
                elif value == "false": #stop recognition
                    running = False
                    self.db_instance.set("start-voice", "none")
                    ModelThread.join()

                #the recognizer part
                try:
                    if running == True:
                        audio = self.Recognizer.listen(source, phrase_time_limit=4)
                        audio_data = audio.get_wav_data()

                        numpydata = np.frombuffer(audio_data, np.int16).copy()
                        numpydata = numpydata.flatten().astype(np.float32) / 32768.0

                        self.data_queue.put(numpydata)
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
                value = self.db_instance.get("start-voice")
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
