import redis

from cache.voice_models import CMUSphinx, DeepSpeech, Whisper, GoogleSpeechToText

#Speech Recognition models
if __name__ == "__main__":
    #redis
    r_instance = redis.Redis(host='localhost', port=6379, decode_responses=True)
    #model
    m_instance = GoogleSpeechToText(r_instance)

    m_instance.run_recognition()