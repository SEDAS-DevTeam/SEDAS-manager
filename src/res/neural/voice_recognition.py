import torch
import torchaudio
from torchaudio.io import StreamReader
import torch.multiprocessing as mp

import pyaudio

DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")

segment_length = 2560
context_length = 640

class VoiceRecognitionModel(torch.nn.Module):
    def __init__(self):
        super(VoiceRecognitionModel, self).__init__()
        self.bundle = torchaudio.pipelines.WAV2VEC2_ASR_BASE_960H
        #bundle with sample rate around 16 000

        self.model = self.bundle.get_model().to(DEVICE)

    def forward(self, x): #x represents one chunk
        torch.inference_mode(True) #turn on inference
        y, _ = self.model(x)

        indices = torch.argmax(y, dim=-1)  # [num_seq,]
        indices = torch.unique_consecutive(indices, dim=-1)
        indices = [i for i in indices if i != self.blank]
        return "".join([self.labels[i] for i in indices])
    

#TODO: test
class ContextCacher:
    def __init__(self, segment_length, context_length):
        self.segment_length = segment_length
        self.context_length = context_length
        self.context = torch.zeros([context_length])
    
    def __call__(self, chunk: torch.Tensor):
        if chunk.size(0) < self.segment_length:
            chunk = torch.nn.functional.pad(chunk, (0, self.segment_length - chunk.size(0)))
        chunk_with_context = torch.cat((self.context, chunk))
        self.context = chunk[-self.context_length :]
        return chunk_with_context

def stream(sample_rate, queue):
    #stream init
    streamer = StreamReader(
        src="hw:1,0",
        format="alsa"
    )
    streamer.add_basic_audio_stream(
        frames_per_chunk=2560,
        sample_rate=sample_rate
    )

    stream_iterator = streamer.stream(timeout=-1, backoff=1.0)
    while True:
        (chunk,) = next(stream_iterator)
        queue.put(chunk)


if __name__ == "__main__":

    #pyaudio init
    Pyaudio = pyaudio.PyAudio()

    # Get the number of audio I/O devices
    devices = Pyaudio.get_device_count()

    # Iterate through all devices
    for i in range(devices):
        # Get the device info
        device_info = Pyaudio.get_device_info_by_index(i)
        # Check if this device is a microphone (an input device)
        if device_info.get('maxInputChannels') > 0:
            print(f"Microphone: {device_info.get('name')} , Device Index: {device_info.get('index')}")
    

    #model init
    recognizer = VoiceRecognitionModel()

    sample_rate = recognizer.bundle.sample_rate

    print("model init")

    print("Streaming...")

    ctx = mp.get_context("spawn")
    q = ctx.Queue()
    p = ctx.Process(target=stream, args=(sample_rate, q))
    cacher = ContextCacher(segment_length, context_length)

    p.start()

    while True:
        try:
            chunk = q.get()
            segment = cacher(chunk[:, 0])
            transcript = recognizer(segment)
            print(transcript, end="\r", flush=True)
        except KeyboardInterrupt:
            p.join()