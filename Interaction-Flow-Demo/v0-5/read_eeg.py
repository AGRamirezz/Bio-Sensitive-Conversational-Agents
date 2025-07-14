import time
import json
import numpy as np
from pylsl import StreamInlet, resolve_byprop
from scipy.signal import welch, lfilter, lfilter_zi, firwin
import matplotlib
import seaborn as sns
import matplotlib.pyplot as plt
from threading import Thread
import asyncio
import websockets
from scipy.integrate import trapezoid  # use trapezoid instead of deprecated trapz

# Constants
SAMPLING_RATE = 256
VIEW_SUBSAMPLE = 4
LSL_EEG_CHUNK = 12

# Globals for WebSocket
clients = set()
af7_band_data = None  # Holds latest AF7 JSON string

# ---------------- WebSocket Server ----------------
async def eeg_websocket_handler(websocket, path=None):
    clients.add(websocket)
    print("✅ WebSocket client connected")
    try:
        while True:
            try:
                if isinstance(af7_band_data, str) and af7_band_data:
                    await websocket.send(af7_band_data)
            except Exception as send_err:
                print(f"❌ [WS Send] {send_err!r}")
            await asyncio.sleep(0.2)
    except Exception as handler_err:
        print(f"❌ [WS Handler] {handler_err!r}")
    finally:
        clients.remove(websocket)
        print("🔌 WebSocket handler exiting")

async def run_websocket_server():
    print("📡 Starting WebSocket server on ws://localhost:8765")
    async with websockets.serve(eeg_websocket_handler, "localhost", 8765):
        await asyncio.Future()  # run forever

def start_websocket_server():
    asyncio.run(run_websocket_server())

# ---------------- EEG Viewer ----------------
def run_combined_viewer():
    window = 10
    scale = 100
    matplotlib.use("TkAgg")
    sns.set(style="whitegrid")

    print("🔎 Looking for EEG stream...")
    streams = resolve_byprop('type', 'EEG', timeout=10)
    if not streams:
        print("❌ Could not find EEG stream.")
        return
    print("✅ EEG stream found. Starting viewer...")

    fig, axes = plt.subplots(1, 1, figsize=(12,8), sharex=True)
    lslv = LSLViewer(streams[0], fig, axes, window, scale)
    fig.canvas.mpl_connect('close_event', lslv.stop)
    print("""
    Keyboard controls:
      toggle filter : d
      zoom out      : /
      zoom in       : *
      increase time : -
      decrease time : +
    """)
    lslv.start()
    plt.show()

class LSLViewer():
    def __init__(self, stream, fig, axes, window, scale, dejitter=True):
        self.stream    = stream
        self.window    = window
        self.scale     = scale
        self.dejitter  = dejitter
        self.inlet     = StreamInlet(stream, max_chunklen=LSL_EEG_CHUNK)
        self.filt      = True
        self.subsample = VIEW_SUBSAMPLE

        info = self.inlet.info()
        desc = info.desc()
        self.sfreq     = info.nominal_srate()
        self.n_samples = int(self.sfreq * self.window)
        self.n_chan    = info.channel_count()

        ch = desc.child('channels').first_child()
        self.ch_names = [ch.child_value('label')]
        for _ in range(self.n_chan-1):
            ch = ch.next_sibling()
            self.ch_names.append(ch.child_value('label'))

        fig.canvas.mpl_connect('key_press_event',    self.OnKeypress)
        fig.canvas.mpl_connect('button_press_event', self.onclick)

        self.fig   = fig
        self.axes  = axes
        sns.despine(left=True)

        self.data  = np.zeros((self.n_samples, self.n_chan))
        self.times = np.arange(-self.window, 0, 1. / self.sfreq)

        impedances = np.std(self.data, axis=0)
        self.lines = []
        for ii in range(self.n_chan):
            line, = axes.plot(
                self.times[::self.subsample],
                self.data[::self.subsample, ii] - ii,
                lw=1
            )
            self.lines.append(line)

        axes.set_ylim(-self.n_chan+0.5, 0.5)
        axes.set_xlabel('Time (s)')
        axes.xaxis.grid(False)
        ticks = np.arange(0, -self.n_chan, -1)
        axes.set_yticks(ticks)
        axes.set_yticklabels([f'{self.ch_names[i]} - {impedances[i]:.1f}'
                              for i in range(self.n_chan)])

        # redraw every ~0.2s
        self.display_every = int(0.2 / (LSL_EEG_CHUNK / self.sfreq))

        # bandpass filter design
        self.bf         = firwin(32, np.array([1, 40])/(self.sfreq/2.),
                                 width=0.05, pass_zero=False)
        self.af         = [1.0]
        zi              = lfilter_zi(self.bf, self.af)
        self.filt_state = np.tile(zi, (self.n_chan,1)).T
        self.data_f     = np.zeros((self.n_samples, self.n_chan))

        # rolling band-power buffer
        BUFFER_LENGTH    = 5
        EPOCH_LENGTH     = 1
        OVERLAP_LENGTH   = 0.8
        SHIFT_LENGTH     = EPOCH_LENGTH - OVERLAP_LENGTH
        self.epoch_samples = int(EPOCH_LENGTH * self.sfreq)
        n_win = int(np.floor((BUFFER_LENGTH - EPOCH_LENGTH)/SHIFT_LENGTH + 1))
        self.band_buffer = np.zeros((n_win, 4, self.n_chan))

    def update_plot(self):
        global af7_band_data
        k = 0
        try:
            while self.started:
                samples, timestamps = self.inlet.pull_chunk(
                    timeout=1.0, max_samples=LSL_EEG_CHUNK)
                if not timestamps:
                    time.sleep(0.2)
                    continue

                # de-jitter timestamps
                if self.dejitter:
                    ts = np.arange(len(timestamps), dtype=float) / self.sfreq
                    ts += self.times[-1] + 1. / self.sfreq
                else:
                    ts = timestamps

                self.times = np.concatenate([self.times, ts])[-self.n_samples:]
                self.data  = np.vstack([self.data, samples])[-self.n_samples:]

                # filter
                filt_samps, self.filt_state = lfilter(
                    self.bf, self.af, samples,
                    axis=0, zi=self.filt_state
                )
                self.data_f = np.vstack([self.data_f, filt_samps])[-self.n_samples:]

                k += 1
                if k == self.display_every:
                    plot_data = (self.data_f if self.filt
                                 else self.data - self.data.mean(axis=0))
                    for ii in range(self.n_chan):
                        self.lines[ii].set_xdata(
                            self.times[::self.subsample] - self.times[-1])
                        self.lines[ii].set_ydata(
                            plot_data[::self.subsample, ii]/self.scale - ii)

                    impedances = np.std(plot_data, axis=0)
                    self.axes.set_yticklabels([
                        f'{self.ch_names[i]} - {impedances[i]:.2f}'
                        for i in range(self.n_chan)
                    ])
                    self.axes.set_xlim(-self.window, 0)
                    self.fig.canvas.draw()

                    # compute & smooth band powers
                    epoch = self.data[-self.epoch_samples:, :]
                    freqs, psd = welch(
                        epoch, fs=self.sfreq,
                        nperseg=self.epoch_samples, axis=0
                    )
                    for ch_idx in range(self.n_chan):
                        def bp(low, high):
                            idx = np.logical_and(freqs>=low, freqs<=high)
                            return trapezoid(psd[idx, ch_idx], freqs[idx])

                        delta = bp(0.5, 4)
                        theta = bp(4,   8)
                        alpha = bp(8,  12)
                        beta  = bp(13, 30)

                        # update rolling buffer
                        self.band_buffer = np.roll(self.band_buffer, -1, axis=0)
                        self.band_buffer[-1,:,ch_idx] = [delta, theta, alpha, beta]
                        sm = np.mean(self.band_buffer[:,:,ch_idx], axis=0)
                        sm_delta, sm_theta, sm_alpha, sm_beta = sm

                        # publish AF7 JSON
                        if self.ch_names[ch_idx] == 'AF7':
                            af7_band_data = json.dumps({
                                "timestamp": int(time.time()),
                                "channel": "AF7",
                                "delta":  sm_delta,
                                "theta":  sm_theta,
                                "alpha":  sm_alpha,
                                "beta":   sm_beta
                            })
                    k = 0
        except Exception as e:
            print(f"❌ update_plot crashed: {e!r}")

    def onclick(self, event):
        print("CLICK", event.button, event.xdata, event.ydata)

    def OnKeypress(self, event):
        if event.key == '/':   self.scale *= 1.2
        elif event.key == '*': self.scale /= 1.2
        elif event.key == '+': self.window += 1
        elif event.key == '-' and self.window>1:
            self.window -= 1
        elif event.key == 'd':
            self.filt = not self.filt

    def start(self):
        self.started = True
        Thread(target=self.update_plot, daemon=True).start()

    def stop(self, _):
        self.started = False

# ---------------- Main Entry ----------------
if __name__ == "__main__":
    # start WebSocket server in background thread
    Thread(target=start_websocket_server, daemon=True).start()
    # then start the EEG viewer
    run_combined_viewer()



