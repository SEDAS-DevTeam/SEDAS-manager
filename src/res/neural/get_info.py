import pyaudio
import speech_recognition as sr

def getaudiodevices():
    p = pyaudio.PyAudio()
    for i in range(p.get_device_count()):
        print (p.get_device_info_by_index(i).get('name'))

def getaudiodevices_sr():
    for index, name in enumerate(sr.Microphone.list_microphone_names()):
        print("Microphone with name \"{1}\" found for `Microphone(device_index={0})`".format(index, name))

def get_audio_output_devices():
    p = pyaudio.PyAudio()

    # Get the number of available devices
    num_devices = p.get_device_count()

    output_devices = []

    # Iterate through devices and check if they are output devices
    for i in range(num_devices):
        device_info = p.get_device_info_by_index(i)
        if device_info['maxOutputChannels'] > 0:
            print(device_info.get("name"))

if __name__ == "__main__":
    get_audio_output_devices()