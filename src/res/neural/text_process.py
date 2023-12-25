import redis

from cache.text_models import simplePOS

if __name__ == "__main__":
    #redis
    r_instance = redis.Redis(host='localhost', port=6379, decode_responses=True)
    #model
    m_instance = simplePOS(r_instance)
    m_instance.process()