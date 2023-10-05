import whisper
import speech_recognition as sr
import os

#program setup
model = whisper.load_model("tiny")

if __name__ == "__main__":
    while True:
        result = model.transcribe("test.wav")
        print(result["text"])