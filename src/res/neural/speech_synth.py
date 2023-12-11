import redis

from cache.speech_models import Google

if __name__ == "__main__":
    #redis
    r_instance = redis.Redis(host='localhost', port=6379, decode_responses=True)
    text = r_instance.get("gen-speech")
    #model
    m_instance = Google(text)
    m_instance.process()
    m_instance.play_audio()