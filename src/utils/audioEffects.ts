export type VoiceEffect = 'none' | 'anonymous' | 'deep' | 'robot' | 'mysterious';

export const applyVoiceEffect = async (originalBlob: Blob, effect: VoiceEffect): Promise<Blob> => {
  if (effect === 'none') return originalBlob;

  const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  const arrayBuffer = await originalBlob.arrayBuffer();
  const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);

  if (effect === 'deep') {
    const rate = 0.75;
    const newLength = Math.ceil(audioBuffer.length / rate);
    const offlineCtxDeep = new OfflineAudioContext(
      audioBuffer.numberOfChannels,
      newLength,
      audioBuffer.sampleRate
    );
    const sourceDeep = offlineCtxDeep.createBufferSource();
    sourceDeep.buffer = audioBuffer;
    sourceDeep.playbackRate.value = rate;
    sourceDeep.connect(offlineCtxDeep.destination);
    sourceDeep.start(0);
    const renderedBuffer = await offlineCtxDeep.startRendering();
    return bufferToWave(renderedBuffer, renderedBuffer.length);
  }

  const offlineCtx = new OfflineAudioContext(
    audioBuffer.numberOfChannels,
    audioBuffer.length,
    audioBuffer.sampleRate
  );

  const source = offlineCtx.createBufferSource();
  source.buffer = audioBuffer;

  if (effect === 'anonymous') {
    const lowpass = offlineCtx.createBiquadFilter();
    lowpass.type = 'lowpass';
    lowpass.frequency.value = 800;
    
    const distortion = offlineCtx.createWaveShaper();
    distortion.curve = makeDistortionCurve(50);
    distortion.oversample = '4x';

    source.connect(lowpass);
    lowpass.connect(distortion);
    distortion.connect(offlineCtx.destination);
  } else if (effect === 'robot') {
    const oscillator = offlineCtx.createOscillator();
    oscillator.type = 'sawtooth';
    oscillator.frequency.value = 50;

    const gainNode = offlineCtx.createGain();
    
    source.connect(gainNode);
    oscillator.connect(gainNode.gain);
    gainNode.connect(offlineCtx.destination);
    
    oscillator.start(0);
  } else if (effect === 'mysterious') {
    // Echo (Delay)
    const delay = offlineCtx.createDelay(0.5);
    delay.delayTime.value = 0.3;
    const feedback = offlineCtx.createGain();
    feedback.gain.value = 0.4;
    delay.connect(feedback);
    feedback.connect(delay);

    // Bandpass filter to reduce tone variations
    const bandpass = offlineCtx.createBiquadFilter();
    bandpass.type = 'bandpass';
    bandpass.frequency.value = 1000;
    bandpass.Q.value = 1;

    source.connect(bandpass);
    bandpass.connect(delay);
    delay.connect(offlineCtx.destination);
    bandpass.connect(offlineCtx.destination);
  }

  source.start(0);

  const renderedBuffer = await offlineCtx.startRendering();
  return bufferToWave(renderedBuffer, renderedBuffer.length);
};

function makeDistortionCurve(amount: number) {
  const k = typeof amount === 'number' ? amount : 50;
  const n_samples = 44100;
  const curve = new Float32Array(n_samples);
  const deg = Math.PI / 180;
  for (let i = 0; i < n_samples; ++i) {
    const x = (i * 2) / n_samples - 1;
    curve[i] = ((3 + k) * x * 20 * deg) / (Math.PI + k * Math.abs(x));
  }
  return curve;
}

function bufferToWave(abuffer: AudioBuffer, len: number) {
  let numOfChan = abuffer.numberOfChannels,
      length = len * numOfChan * 2 + 44,
      buffer = new ArrayBuffer(length),
      view = new DataView(buffer),
      channels = [], i, sample,
      offset = 0,
      pos = 0;

  function setUint16(data: number) {
    view.setUint16(pos, data, true);
    pos += 2;
  }

  function setUint32(data: number) {
    view.setUint32(pos, data, true);
    pos += 4;
  }

  setUint32(0x46464952);                         // "RIFF"
  setUint32(length - 8);                         // file length - 8
  setUint32(0x45564157);                         // "WAVE"

  setUint32(0x20746d66);                         // "fmt " chunk
  setUint32(16);                                 // length = 16
  setUint16(1);                                  // PCM (uncompressed)
  setUint16(numOfChan);
  setUint32(abuffer.sampleRate);
  setUint32(abuffer.sampleRate * 2 * numOfChan); // avg. bytes/sec
  setUint16(numOfChan * 2);                      // block-align
  setUint16(16);                                 // 16-bit (hardcoded in this demo)

  setUint32(0x61746164);                         // "data" - chunk
  setUint32(length - pos - 4);                   // chunk length

  for(i = 0; i < abuffer.numberOfChannels; i++)
    channels.push(abuffer.getChannelData(i));

  while(pos < length) {
    for(i = 0; i < numOfChan; i++) {
      sample = Math.max(-1, Math.min(1, channels[i][offset])); // clamp
      sample = (0.5 + sample < 0 ? sample * 32768 : sample * 32767)|0; // scale to 16-bit signed int
      view.setInt16(pos, sample, true);          // write 16-bit sample
      pos += 2;
    }
    offset++
  }

  return new Blob([buffer], {type: "audio/wav"});
}
