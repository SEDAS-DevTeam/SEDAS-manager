import pyaudio
import speech_recognition as sr
import os
import json

def get_audio_input_devices():
    in_dict = {
        "devices": []
    }
    for index, name in enumerate(sr.Microphone.list_microphone_names()):
        device = {
            "name": name,
            "index": index
        }
        in_dict["devices"].append(device)
    return in_dict

def get_audio_output_devices():
    out_dict = {
        "devices": []
    }

    p = pyaudio.PyAudio()

    # Get the number of available devices
    num_devices = p.get_device_count()

    # Iterate through devices and check if they are output devices
    for i in range(num_devices):
        device_info = p.get_device_info_by_index(i)
        if device_info['maxOutputChannels'] > 0:
            print(device_info.get("name"))

    return out_dict

if __name__ == "__main__":
    #write new devices into file
    in_devices_path = os.getcwd()[:os.getcwd().index("SEDAC") + len("SEDAC")] + "/src/res/data/in_device_list.json"
    out_devices_path = os.getcwd()[:os.getcwd().index("SEDAC") + len("SEDAC")] + "/src/res/data/out_device_list.json"

    if os.path.exists(in_devices_path):
        os.remove(in_devices_path)
    if os.path.exists(out_devices_path):
        os.remove(out_devices_path)

    in_devices = get_audio_input_devices()
    out_devices = get_audio_output_devices()

    with open(in_devices_path, "w") as in_file:
        json.dump(in_devices, in_file, indent=4)
    with open(out_devices_path, "w") as out_file:
        json.dump(out_devices, out_file, indent=4)