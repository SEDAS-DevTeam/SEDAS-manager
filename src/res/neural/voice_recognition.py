import redis
from queue import Queue

from cache.voice_models import CMUSphinx, DeepSpeech, Whisper

#for index, name in enumerate(sr.Microphone.list_microphone_names()):
#    print("Microphone with name \"{1}\" found for `Microphone(device_index={0})`".format(index, name))

data_queue = Queue()

#Speech Recognition models
if __name__ == "__main__":
    #redis
    r_instance = redis.Redis(host='localhost', port=6379, decode_responses=True)
    #model
    #m_instance = Whisper("small.en")
    m_instance = CMUSphinx(r_instance)

    m_instance.run_recognition()