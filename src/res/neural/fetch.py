import urllib.request
import sys
import os

#PATH formatting
PATH = os.getcwd()
idx = PATH.index("SEDAC")

if idx == -1:
    print("ERR: directory mismatch")
    exit(1)
PATH = PATH[:idx] + "SEDAC/src/res/neural/cache/"

args = sys.argv[1:]

def download_newest(type, name):
    #model download
    urllib.request.urlretrieve(args[0] + type, PATH + name)

download_newest("map_gen", "map_gen.pth")
download_newest("acai", "acai.pth")
download_newest("voice_rec", "voice_rec.pth")