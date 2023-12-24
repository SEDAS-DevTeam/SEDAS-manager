import redis

from cache.speech_models import Google

if __name__ == "__main__":
    #redis
    r_instance = redis.Redis(host='localhost', port=6379, decode_responses=True)
    #model
    m_instance = Google(r_instance)
    m_instance.process()