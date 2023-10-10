import speech_recognition as sr
import whisper
import numpy as np

from queue import Queue
import threading

for index, name in enumerate(sr.Microphone.list_microphone_names()):
    print("Microphone with name \"{1}\" found for `Microphone(device_index={0})`".format(index, name))

Recognizer = sr.Recognizer()
model = whisper.load_model("tiny")
data_queue = Queue()

def transcribe_data(spec_queue):
    while True:
        if not spec_queue.empty():
            numpydata = spec_queue.get()

            result = model.transcribe(numpydata, language="en", fp16=False, verbose=False)
            print("decoded text: " + result["text"])

#transcription queue
WhisperThread = threading.Thread(target=transcribe_data, args=(data_queue, ))
WhisperThread.start()

#Microphone listener loop
with sr.Microphone() as source:
    Recognizer.adjust_for_ambient_noise(source)
    while True:
        try:
            audio = Recognizer.listen(source, phrase_time_limit=4)
            audio_data = audio.get_wav_data()

            numpydata = np.frombuffer(audio_data, np.int16).copy()
            numpydata = numpydata.flatten().astype(np.float32) / 32768.0
            
            data_queue.put(numpydata)
        except KeyboardInterrupt:
            WhisperThread.join()
