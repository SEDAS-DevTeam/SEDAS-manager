import torch
import torchvision
import redis

if __name__ == "__main__":
    #redis
    r_instance = redis.Redis(host='localhost', port=6379, decode_responses=True)

    seed = r_instance.get("in-terrain") #get the seed

    