/**
 * Audio processing utilities for Cadenza Voice Studio.
 * All processing runs client-side using the Web Audio API — zero server cost.
 */
import lamejs from './lamejs-min.js';
// ──────────────────────────────────────────────
// 1. Impulse Response Generator (synthetic reverb)
// ──────────────────────────────────────────────

/**
 * Generates a synthetic reverb impulse response.
 * @param {AudioContext} ctx
 * @param {number} duration - seconds (0.5 to 5)
 * @param {number} decay - decay rate (1 to 10)
 * @returns {AudioBuffer}
 */
export function generateImpulseResponse(ctx, duration = 2, decay = 3) {
  const sampleRate = ctx.sampleRate;
  const length = sampleRate * duration;
  const impulse = ctx.createBuffer(2, length, sampleRate);

  for (let channel = 0; channel < 2; channel++) {
    const data = impulse.getChannelData(channel);
    for (let i = 0; i < length; i++) {
      // Exponentially decaying white noise
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, decay);
    }
  }

  return impulse;
}

// ──────────────────────────────────────────────
// 2. AudioBuffer → WAV Blob encoder
// ──────────────────────────────────────────────

/**
 * Converts an AudioBuffer to a WAV Blob (PCM 16-bit, mono/stereo).
 * @param {AudioBuffer} buffer
 * @returns {Blob}
 */
export function audioBufferToWav(buffer) {
  const numChannels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const format = 1; // PCM
  const bitDepth = 16;

  // Interleave channels
  let interleaved;
  if (numChannels === 2) {
    const left = buffer.getChannelData(0);
    const right = buffer.getChannelData(1);
    interleaved = new Float32Array(left.length + right.length);
    for (let i = 0, k = 0; i < left.length; i++) {
      interleaved[k++] = left[i];
      interleaved[k++] = right[i];
    }
  } else {
    interleaved = buffer.getChannelData(0);
  }

  const dataLength = interleaved.length * (bitDepth / 8);
  const headerLength = 44;
  const totalLength = headerLength + dataLength;
  const arrayBuffer = new ArrayBuffer(totalLength);
  const view = new DataView(arrayBuffer);

  // WAV header
  writeString(view, 0, 'RIFF');
  view.setUint32(4, totalLength - 8, true);
  writeString(view, 8, 'WAVE');
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true);                            // fmt chunk size
  view.setUint16(20, format, true);                         // PCM
  view.setUint16(22, numChannels, true);                    // channels
  view.setUint32(24, sampleRate, true);                     // sample rate
  view.setUint32(28, sampleRate * numChannels * (bitDepth / 8), true); // byte rate
  view.setUint16(32, numChannels * (bitDepth / 8), true);   // block align
  view.setUint16(34, bitDepth, true);                       // bits per sample
  writeString(view, 36, 'data');
  view.setUint32(40, dataLength, true);

  // PCM data — clamp float samples to int16 range
  let offset = 44;
  for (let i = 0; i < interleaved.length; i++) {
    const s = Math.max(-1, Math.min(1, interleaved[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
    offset += 2;
  }

  return new Blob([arrayBuffer], { type: 'audio/wav' });
}

function writeString(view, offset, string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}

/**
 * Converts an AudioBuffer to a MP3 Blob.
 * @param {AudioBuffer} buffer
 * @returns {Blob}
 */
export function audioBufferToMp3(buffer) {
  const numChannels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  
  const encoder = new lamejs.Mp3Encoder(numChannels, sampleRate, 128);

  const left = buffer.getChannelData(0);
  const right = numChannels > 1 ? buffer.getChannelData(1) : null;
  const sampleBlockSize = 1152; 
  const mp3Data = [];

  for (let i = 0; i < left.length; i += sampleBlockSize) {
    const leftChunk = left.subarray(i, i + sampleBlockSize);
    const leftInt16 = new Int16Array(leftChunk.length);
    for (let j = 0; j < leftChunk.length; j++) {
      let s = Math.max(-1, Math.min(1, leftChunk[j]));
      leftInt16[j] = s < 0 ? s * 0x8000 : s * 0x7FFF;
    }

    let mp3buf;
    if (numChannels === 2) {
      const rightChunk = right.subarray(i, i + sampleBlockSize);
      const rightInt16 = new Int16Array(rightChunk.length);
      for (let j = 0; j < rightChunk.length; j++) {
        let s = Math.max(-1, Math.min(1, rightChunk[j]));
        rightInt16[j] = s < 0 ? s * 0x8000 : s * 0x7FFF;
      }
      mp3buf = encoder.encodeBuffer(leftInt16, rightInt16);
    } else {
      mp3buf = encoder.encodeBuffer(leftInt16);
    }

    if (mp3buf.length > 0) {
      mp3Data.push(mp3buf);
    }
  }
  
  const mp3buf = encoder.flush();
  if (mp3buf.length > 0) {
    mp3Data.push(mp3buf);
  }

  return new Blob(mp3Data, { type: 'audio/mp3' });
}

// ──────────────────────────────────────────────
// 3. Build an effects processing chain
// ──────────────────────────────────────────────

/**
 * Creates a Web Audio effects chain and returns { input, output } nodes.
 * Connect source → input, output → destination.
 *
 * @param {AudioContext|OfflineAudioContext} ctx
 * @param {object} options
 * @param {number} options.reverbAmount   - 0 to 1
 * @param {number} options.eqLow          - -12 to +12 dB
 * @param {number} options.eqMid          - -12 to +12 dB
 * @param {number} options.eqHigh         - -12 to +12 dB
 * @param {boolean} options.compression   - enable compressor
 * @param {number} options.pitchShift     - -12 to +12 semitones
 * @param {number} options.dryWet         - 0 (dry) to 1 (wet)
 * @returns {{ input: AudioNode, output: AudioNode, convolver: ConvolverNode|null }}
 */
export function createEffectsChain(ctx, options = {}) {
  const {
    reverbAmount = 0,
    eqLow = 0,
    eqMid = 0,
    eqHigh = 0,
    compression = false,
    dryWet = 0.5
  } = options;

  // Input gain
  const inputGain = ctx.createGain();
  inputGain.gain.value = 1;

  // EQ: 3-band
  const lowShelf = ctx.createBiquadFilter();
  lowShelf.type = 'lowshelf';
  lowShelf.frequency.value = 300;
  lowShelf.gain.value = eqLow;

  const midPeak = ctx.createBiquadFilter();
  midPeak.type = 'peaking';
  midPeak.frequency.value = 1500;
  midPeak.Q.value = 1;
  midPeak.gain.value = eqMid;

  const highShelf = ctx.createBiquadFilter();
  highShelf.type = 'highshelf';
  highShelf.frequency.value = 4000;
  highShelf.gain.value = eqHigh;

  // Compressor
  const compressor = ctx.createDynamicsCompressor();
  compressor.threshold.value = -24;
  compressor.knee.value = 30;
  compressor.ratio.value = 4;
  compressor.attack.value = 0.003;
  compressor.release.value = 0.25;

  // Reverb (convolver)
  const convolver = ctx.createConvolver();
  const impulse = generateImpulseResponse(ctx, 2.5, 3);
  convolver.buffer = impulse;

  // Dry/Wet mixing
  const dryGain = ctx.createGain();
  const wetGain = ctx.createGain();
  dryGain.gain.value = 1 - dryWet;
  wetGain.gain.value = dryWet * reverbAmount;

  // Output merge
  const outputGain = ctx.createGain();
  outputGain.gain.value = 1;

  // Chain: input → EQ → compressor(optional) → split(dry/wet) → merge → output
  inputGain.connect(lowShelf);
  lowShelf.connect(midPeak);
  midPeak.connect(highShelf);

  if (compression) {
    highShelf.connect(compressor);
    // Dry path
    compressor.connect(dryGain);
    // Wet path (reverb)
    compressor.connect(convolver);
  } else {
    // Dry path
    highShelf.connect(dryGain);
    // Wet path (reverb)
    highShelf.connect(convolver);
  }

  convolver.connect(wetGain);
  dryGain.connect(outputGain);
  wetGain.connect(outputGain);

  return {
    input: inputGain,
    output: outputGain,
    convolver
  };
}

// ──────────────────────────────────────────────
// 3.5. Vocoder Effects Chain (Voice Footprint)
// ──────────────────────────────────────────────

/**
 * Creates a Web Audio effects chain that shapes a TTS signal using the user's voice footprint.
 * @param {AudioContext|OfflineAudioContext} ctx
 * @param {Array<number>} voiceFootprint - 32-band array (0-100)
 * @returns {{ input: AudioNode, output: AudioNode }}
 */
export function createVocoderChain(ctx, voiceFootprint) {
  const inputGain = ctx.createGain();
  const outputGain = ctx.createGain();

  if (!voiceFootprint || voiceFootprint.length !== 32) {
    inputGain.connect(outputGain);
    return { input: inputGain, output: outputGain };
  }

  // Create a bank of peaking filters. We use 16 bands instead of 32 for performance.
  // We average adjacent bins from the 32-band array.
  let prevNode = inputGain;
  
  for (let i = 0; i < 16; i++) {
    const val1 = voiceFootprint[i * 2];
    const val2 = voiceFootprint[i * 2 + 1];
    const avgVal = (val1 + val2) / 2;
    
    // Map 0-100 to -24dB to +12dB
    const gainDb = (avgVal / 100) * 36 - 24; 
    
    // Calculate center frequency for this bin (Nyquist is ~22050)
    // Bin width for 32 bins is ~689Hz. For 16 bins it's ~1378Hz.
    const freq = (i * 1378) + 689;

    const filter = ctx.createBiquadFilter();
    filter.type = 'peaking';
    filter.frequency.value = freq;
    filter.Q.value = 2.0; // Narrow band
    filter.gain.value = gainDb;

    prevNode.connect(filter);
    prevNode = filter;
  }

  prevNode.connect(outputGain);

  return { input: inputGain, output: outputGain };
}

// ──────────────────────────────────────────────
// 3.7. Cybernetic Voice Effect
// ──────────────────────────────────────────────

/**
 * Creates a clean, intelligible Cybernetic robot effect.
 * Uses Ring Modulation and Chorus to create a Dalek/Cyborg sound, without the mud of a Biquad array.
 *
 * @param {AudioContext|OfflineAudioContext} ctx
 * @param {AudioNode} modulatorNode - the input vocal track (modulator)
 * @param {number} duration - duration of the track
 * @param {Array<number>} voiceFootprint - 32-band array (0-100)
 * @returns {AudioNode} - the cybernetic output node
 */
export function applyCyberneticEffect(ctx, modulatorNode, duration, voiceFootprint) {
  const outputNode = ctx.createGain();
  outputNode.gain.value = 1.0;

  // 1. Ring Modulator for metallic/Dalek sound
  const ringModOsc = ctx.createOscillator();
  ringModOsc.type = 'sine';
  ringModOsc.frequency.value = 50; // 50Hz for a deep, rapid flutter
  
  const ringModGain = ctx.createGain();
  ringModGain.gain.value = 0; // modulated
  
  modulatorNode.connect(ringModGain);
  ringModOsc.connect(ringModGain.gain);
  
  ringModOsc.start(0);
  ringModOsc.stop(duration);

  // Blend dry and ring modulated signal
  const blendGain = ctx.createGain();
  blendGain.gain.value = 0.5;
  ringModGain.connect(blendGain);
  
  const dryGain = ctx.createGain();
  dryGain.gain.value = 0.5;
  modulatorNode.connect(dryGain);

  const merged = ctx.createGain();
  blendGain.connect(merged);
  dryGain.connect(merged);

  // 2. Chorus/Delay for width
  const delayNode = ctx.createDelay();
  delayNode.delayTime.value = 0.02; // 20ms
  
  const lfo = ctx.createOscillator();
  lfo.type = 'sine';
  lfo.frequency.value = 1.5; // 1.5Hz sweep
  
  const lfoGain = ctx.createGain();
  lfoGain.gain.value = 0.005; // 5ms modulation depth
  
  lfo.connect(lfoGain);
  lfoGain.connect(delayNode.delayTime);
  
  lfo.start(0);
  lfo.stop(duration);

  // 3. Apply Voice Footprint EQ
  const vocoder = createVocoderChain(ctx, voiceFootprint);
  
  // Parallel routing for Chorus
  merged.connect(vocoder.input); // Dry-ish path
  merged.connect(delayNode);
  delayNode.connect(vocoder.input); // Chorus path

  // Boost output slightly to compensate for mix
  const makeUpGain = ctx.createGain();
  makeUpGain.gain.value = 1.5;
  vocoder.output.connect(makeUpGain);
  makeUpGain.connect(outputNode);

  return outputNode;
}

// ──────────────────────────────────────────────
// 4. Offline render: mix vocals + instrumental
// ──────────────────────────────────────────────

/**
 * Mixes a vocal AudioBuffer with an instrumental AudioBuffer using OfflineAudioContext.
 *
 * @param {AudioBuffer} instrumentalBuffer
 * @param {AudioBuffer} vocalBuffer
 * @param {number} instrumentalVolume - 0 to 1
 * @param {number} vocalVolume - 0 to 1
 * @param {object} effectsOptions - passed to createEffectsChain
 * @param {number} pitchShift - semitones (-12 to +12)
 * @param {Array<number>} voiceFootprint - optional 32-band array for vocoder
 * @param {function} onProgress - optional callback(percent)
 * @returns {Promise<AudioBuffer>}
 */
export async function mixAudioBuffers(
  instrumentalBuffer,
  vocalBuffer,
  instrumentalVolume = 0.7,
  vocalVolume = 1.0,
  effectsOptions = {},
  pitchShift = 0,
  voiceFootprint = null,
  isAutoVocal = false,
  onProgress = null
) {
  // If Auto-Sing is on, we slow down the TTS to 0.85x speed. This means it takes longer to play.
  const effectiveVocalDuration = isAutoVocal ? vocalBuffer.duration / 0.85 : vocalBuffer.duration;

  // Use the longer duration
  const duration = Math.max(instrumentalBuffer.duration, effectiveVocalDuration);
  const sampleRate = instrumentalBuffer.sampleRate;
  const channels = 2; // stereo output

  const offlineCtx = new OfflineAudioContext(channels, Math.ceil(sampleRate * duration), sampleRate);

  // --- Instrumental channel (with sidechain ducking) ---
  const instSource = offlineCtx.createBufferSource();
  instSource.buffer = instrumentalBuffer;
  instSource.loop = true; // IMPORTANT: Loop the 30-second beat so it fills the entire track length!
  
  const instGain = offlineCtx.createGain();
  instGain.gain.value = instrumentalVolume;
  instSource.connect(instGain);

  const duckingGain = offlineCtx.createGain();
  duckingGain.gain.value = 1.0; // Base gain
  instGain.connect(duckingGain);
  duckingGain.connect(offlineCtx.destination);

  // --- Vocal channel with effects ---
  const vocalSource = offlineCtx.createBufferSource();
  vocalSource.buffer = vocalBuffer;

  if (isAutoVocal) {
    // Slow down the TTS slightly to make it sound more musical/drawled, less like a fast news reader
    vocalSource.playbackRate.value = 0.85; 
  }

  // Apply pitch shift via detune (in cents: 1 semitone = 100 cents)
  if (pitchShift !== 0) {
    vocalSource.detune.value = pitchShift * 100;
  }

  const vocalGain = offlineCtx.createGain();
  vocalGain.gain.value = vocalVolume;

  // --- Sidechain Envelope Follower from Vocal to Instrumental ---
  // We use the vocal signal to negatively modulate the instrumental's gain
  const rectShaper = offlineCtx.createWaveShaper();
  const rectCurve = new Float32Array(65536);
  for (let i = 0; i < 65536; i++) {
    // Invert the curve so louder vocal = more negative value (down to -0.6 for ducking)
    rectCurve[i] = -Math.abs((i - 32768) / 32768) * 0.6;
  }
  rectShaper.curve = rectCurve;

  const envFilter = offlineCtx.createBiquadFilter();
  envFilter.type = 'lowpass';
  envFilter.frequency.value = 10; // slow enough to follow the envelope smoothly

  vocalSource.connect(rectShaper);
  rectShaper.connect(envFilter);
  envFilter.connect(duckingGain.gain);

  let lastNode;

  if (isAutoVocal && voiceFootprint) {
    // For Auto-Sing: apply Cybernetic effect
    const cyberNode = applyCyberneticEffect(offlineCtx, vocalSource, duration, voiceFootprint);
    
    const vocalMixer = offlineCtx.createGain();
    
    // Slight dry signal for consonants
    const dryGain = offlineCtx.createGain();
    dryGain.gain.value = 0.25; 
    vocalSource.connect(dryGain);
    dryGain.connect(vocalMixer);

    // Cybernetic signal
    const cyberGain = offlineCtx.createGain();
    cyberGain.gain.value = 1.0;
    cyberNode.connect(cyberGain);
    cyberGain.connect(vocalMixer);

    const effects = createEffectsChain(offlineCtx, effectsOptions);
    vocalMixer.connect(effects.input);
    lastNode = effects.output;
  } else if (voiceFootprint) {
    // For normal recording: just apply user's voice footprint EQ profile
    const vocoder = createVocoderChain(offlineCtx, voiceFootprint);
    vocalSource.connect(vocoder.input);

    // Apply effects chain (Reverb, EQ) to the vocoded vocal
    const effects = createEffectsChain(offlineCtx, effectsOptions);
    vocoder.output.connect(effects.input);
    lastNode = effects.output;
  } else {
    // Standard recorded vocals: apply effects chain directly
    const effects = createEffectsChain(offlineCtx, effectsOptions);
    vocalSource.connect(effects.input);
    lastNode = effects.output;
  }

  lastNode.connect(vocalGain);
  vocalGain.connect(offlineCtx.destination);

  // Start both
  instSource.start(0);
  vocalSource.start(0);

  // Progress simulation (OfflineAudioContext doesn't emit progress natively)
  if (onProgress) {
    const totalMs = duration * 1000;
    const interval = setInterval(() => {
      // Simulated — offline rendering is synchronous from the API's perspective
    }, 100);

    onProgress(10);

    const rendered = await offlineCtx.startRendering();
    clearInterval(interval);
    onProgress(100);
    return rendered;
  }

  return await offlineCtx.startRendering();
}

// ──────────────────────────────────────────────
// 5. Blob ↔ Base64 conversion
// ──────────────────────────────────────────────

/**
 * Converts a Blob to a base64 data URL string.
 * @param {Blob} blob
 * @returns {Promise<string>}
 */
export function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * Fetches an audio URL and decodes it into an AudioBuffer.
 * Handles both local blob URLs and remote URLs (via proxy).
 * @param {string} url
 * @param {AudioContext} ctx
 * @returns {Promise<AudioBuffer>}
 */
export async function fetchAndDecode(url, ctx) {
  let fetchUrl = url;

  // If it's a remote URL (not blob: or data:), use our proxy
  if (!url.startsWith('blob:') && !url.startsWith('data:') && url.startsWith('http')) {
    fetchUrl = `/api/proxy-audio?url=${encodeURIComponent(url)}`;
  }

  const response = await fetch(fetchUrl);
  const arrayBuffer = await response.arrayBuffer();
  return await ctx.decodeAudioData(arrayBuffer);
}
