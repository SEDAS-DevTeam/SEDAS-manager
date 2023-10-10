import sys
import time
import redis

import speech_recognition as sr
import whisper
import numpy as np

from queue import Queue
import threading

for index, name in enumerate(sr.Microphone.list_microphone_names()):
    print("Microphone with name \"{1}\" found for `Microphone(device_index={0})`".format(index, name))

Recognizer = sr.Recognizer()
model = whisper.load_model("small.en")
running = False
data_queue = Queue()

def transcribe_data(spec_queue):
    while True:
        if not spec_queue.empty():
            numpydata = spec_queue.get()

            numpydata = whisper.pad_or_trim(numpydata)

            result = model.transcribe(numpydata, language="en", fp16=True, verbose=False)
            print("decoded text: " + result["text"])
            r_instance.set("out-voice", result["text"])

#init setup
r_instance = redis.Redis(host='localhost', port=6379, decode_responses=True)
#transcription queue
WhisperThread = threading.Thread(target=transcribe_data, args=(data_queue, ))

with sr.Microphone() as source:
    while True:
        print(running)
        value = r_instance.get("start-voice")

        #recognition check
        if value == "true": #start recognition
            running = True
            WhisperThread.start()
            r_instance.set("start-voice", "none") #prevents invoking random functions
        elif value == "false": #stop recognition
            running = False
            r_instance.set("start-voice", "none")
            WhisperThread.join()

        #the recognizer part
        try:
            if running == True:
                audio = Recognizer.listen(source, phrase_time_limit=4)
                audio_data = audio.get_wav_data()

                numpydata = np.frombuffer(audio_data, np.int16).copy()
                numpydata = numpydata.flatten().astype(np.float32) / 32768.0

                data_queue.put(numpydata)
        except KeyboardInterrupt:
            WhisperThread.join()