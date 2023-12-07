import urllib.request
import os

URL = "https://raw.githubusercontent.com/HelloWorld7894/SEDAC-networks/main/src/"

def download_newest(type):
    #model download
    main_url = URL + type

    if type == "PlaneResponse":
        urllib.request.urlretrieve(os.path.join(main_url, "voice_models.py"), PATH + "/voice_models.py")
        urllib.request.urlretrieve(os.path.join(main_url, "speech_models.py"), PATH + "/speech_models.py")
        urllib.request.urlretrieve(os.path.join(main_url, "main_plane.py"), PATH + "/main_plane.py")
    elif type == "ACAI":
        urllib.request.urlretrieve(os.path.join(main_url, "main_control.py"), PATH + "/main_control.py")
    elif type == "gen_map":
        urllib.request.urlretrieve(os.path.join(main_url, "main_terrain.py"), PATH + "/main_terrain.py")


#PATH formatting
PATH = os.getcwd()
idx = PATH.index("SEDAC")

if idx == -1:
    print("ERR: directory mismatch")
    exit(1)
else:
    PATH = PATH[:idx] + "SEDAC/src/res/neural/cache"

#Removing all contents from cache
try:
    files = os.listdir(PATH)
    for file in files:
        file_path = os.path.join(PATH, file)
        if file != ".gitkeep" and os.path.isfile(file_path):
            os.remove(file_path)
except OSError as e:
    print(e)
    print("Error while updating cache")

if __name__ == "__main__":
    print("All files deleted")
    print("Updating cache")

    download_newest("PlaneResponse")
    download_newest("ACAI")
    download_newest("gen_map")

    print("Done")