/**
 * Procedural Web Audio Beat Synthesizer
 * Generates high-fidelity 30-second backing tracks client-side using OfflineAudioContext.
 */

const GENRE_TEMPO = {
  pop: 116,
  'hip-hop': 88,
  rock: 124,
  'lo-fi': 74,
  folk: 80,
  edm: 128,
  rnb: 82,
  jazz: 96
};

const GENRE_CHORDS = {
  pop: [
    { root: 36, notes: [48, 52, 55, 60] }, // C
    { root: 43, notes: [47, 50, 55, 59] }, // G
    { root: 45, notes: [45, 48, 52, 57] }, // Am
    { root: 41, notes: [45, 48, 53, 57] }  // F
  ],
  'hip-hop': [
    { root: 45, notes: [45, 48, 52, 57] }, // Am
    { root: 38, notes: [45, 50, 53, 57] }, // Dm
    { root: 41, notes: [45, 48, 53, 57] }, // F
    { root: 40, notes: [44, 47, 50, 56] }  // E7
  ],
  rock: [
    { root: 40, notes: [40, 44, 47, 52] }, // E
    { root: 47, notes: [42, 47, 51, 54] }, // B
    { root: 37, notes: [40, 44, 49, 52] }, // C#m
    { root: 45, notes: [40, 45, 48, 52] }  // A
  ],
  'lo-fi': [
    { root: 36, notes: [47, 52, 55, 59] }, // Cmaj7
    { root: 41, notes: [48, 52, 53, 57] }, // Fmaj7
    { root: 38, notes: [45, 48, 53, 57] }, // Dm7
    { root: 43, notes: [47, 50, 53, 55] }  // G7
  ],
  folk: [
    { root: 43, notes: [43, 47, 50, 55] }, // G
    { root: 38, notes: [42, 45, 50, 54] }, // D
    { root: 40, notes: [43, 47, 52, 55] }, // Em
    { root: 36, notes: [43, 48, 52, 55] }  // C
  ],
  edm: [
    { root: 45, notes: [45, 48, 52, 57] }, // Am
    { root: 41, notes: [45, 48, 53, 57] }, // F
    { root: 36, notes: [48, 52, 55, 60] }, // C
    { root: 43, notes: [47, 50, 55, 59] }  // G
  ],
  rnb: [
    { root: 38, notes: [45, 48, 52, 57, 59] }, // Dm9
    { root: 43, notes: [45, 47, 50, 53, 57] }, // G13
    { root: 36, notes: [47, 52, 55, 59, 62] }, // Cmaj9
    { root: 45, notes: [45, 48, 52, 55, 58] }  // A7alt
  ],
  jazz: [
    { root: 38, notes: [45, 48, 53, 57] }, // Dm7
    { root: 43, notes: [47, 50, 53, 55] }, // G7
    { root: 36, notes: [47, 52, 55, 59] }, // Cmaj7
    { root: 45, notes: [45, 48, 52, 55] }  // A7
  ]
};

// Create a loopable white noise buffer
function createNoiseBuffer(ctx) {
  const bufferSize = ctx.sampleRate * 2; // 2 seconds of noise
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1;
  }
  return buffer;
}

// Convert MIDI note to Frequency
function midiToFreq(note) {
  return Math.pow(2, (note - 69) / 12) * 440;
}

// Helper: Make distortion curve
function makeDistortionCurve(amount = 25) {
  const k = amount;
  const n_samples = 44100;
  const curve = new Float32Array(n_samples);
  const deg = Math.PI / 180;
  for (let i = 0; i < n_samples; ++i) {
    const x = (i * 2) / n_samples - 1;
    curve[i] = ((3 + k) * x * 20 * deg) / (Math.PI + k * Math.abs(x));
  }
  return curve;
}

// --- Synthesizers ---

function playKick(ctx, time, dest) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.connect(gain);
  gain.connect(dest);

  osc.frequency.setValueAtTime(140, time);
  osc.frequency.exponentialRampToValueAtTime(42, time + 0.12);

  gain.gain.setValueAtTime(1.0, time);
  gain.gain.exponentialRampToValueAtTime(0.001, time + 0.25);

  osc.start(time);
  osc.stop(time + 0.25);
}

function playSnare(ctx, time, noiseBuffer, dest) {
  // Body (sine wave oscillator)
  const osc = ctx.createOscillator();
  const oscGain = ctx.createGain();
  osc.type = 'triangle';
  osc.frequency.setValueAtTime(180, time);
  osc.frequency.linearRampToValueAtTime(120, time + 0.08);
  
  oscGain.gain.setValueAtTime(0.4, time);
  oscGain.gain.exponentialRampToValueAtTime(0.001, time + 0.12);
  
  osc.connect(oscGain);
  oscGain.connect(dest);

  // Sizzle (high-passed filtered white noise)
  const noise = ctx.createBufferSource();
  noise.buffer = noiseBuffer;
  const filter = ctx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.value = 1000;
  filter.Q.value = 2.0;

  const noiseGain = ctx.createGain();
  noiseGain.gain.setValueAtTime(0.55, time);
  noiseGain.gain.exponentialRampToValueAtTime(0.001, time + 0.2);

  noise.connect(filter);
  filter.connect(noiseGain);
  noiseGain.connect(dest);

  osc.start(time);
  osc.stop(time + 0.12);
  noise.start(time);
  noise.stop(time + 0.20);
}

function playHihat(ctx, time, noiseBuffer, dest) {
  const noise = ctx.createBufferSource();
  noise.buffer = noiseBuffer;

  const filter = ctx.createBiquadFilter();
  filter.type = 'highpass';
  filter.frequency.value = 8500;

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.14, time);
  gain.gain.exponentialRampToValueAtTime(0.001, time + 0.04);

  noise.connect(filter);
  filter.connect(gain);
  gain.connect(dest);

  noise.start(time);
  noise.stop(time + 0.04);
}

function playBassNote(ctx, time, duration, midiNote, dest) {
  const osc1 = ctx.createOscillator();
  const osc2 = ctx.createOscillator();
  const gain = ctx.createGain();
  const filter = ctx.createBiquadFilter();

  const freq = midiToFreq(midiNote);
  osc1.type = 'sine';
  osc1.frequency.setValueAtTime(freq, time);

  // Add detuned triangle for body/growl
  osc2.type = 'triangle';
  osc2.frequency.setValueAtTime(freq * 2 + 1, time); // 1st harmonic + slight detune

  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(180, time);

  gain.gain.setValueAtTime(0.001, time);
  gain.gain.linearRampToValueAtTime(0.45, time + 0.02);
  gain.gain.setValueAtTime(0.45, time + duration - 0.05);
  gain.gain.exponentialRampToValueAtTime(0.001, time + duration);

  osc1.connect(filter);
  osc2.connect(filter);
  filter.connect(gain);
  gain.connect(dest);

  osc1.start(time);
  osc1.stop(time + duration);
  osc2.start(time);
  osc2.stop(time + duration);
}

function playPianoChord(ctx, time, duration, midiNotes, dest) {
  midiNotes.forEach((midi, idx) => {
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();

    const freq = midiToFreq(midi);
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(freq, time);

    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(freq + (idx % 2 === 0 ? 0.8 : -0.8), time);

    gain.gain.setValueAtTime(0.001, time);
    // scale amplitude by number of chord notes
    gain.gain.linearRampToValueAtTime(0.18 / midiNotes.length, time + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.001, time + duration);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(dest);

    osc1.start(time);
    osc1.stop(time + duration);
    osc2.start(time);
    osc2.stop(time + duration);
  });
}

function playSynthNote(ctx, time, duration, midiNote, dest) {
  const osc = ctx.createOscillator();
  const filter = ctx.createBiquadFilter();
  const gain = ctx.createGain();

  const freq = midiToFreq(midiNote);
  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(freq, time);

  // Plucky lowpass filter sweep
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(2500, time);
  filter.frequency.exponentialRampToValueAtTime(320, time + duration * 0.8);

  gain.gain.setValueAtTime(0.001, time);
  gain.gain.linearRampToValueAtTime(0.12, time + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.001, time + duration);

  osc.connect(filter);
  filter.connect(gain);
  gain.connect(dest);

  osc.start(time);
  osc.stop(time + duration);
}

function playGuitarStrum(ctx, time, midiNotes, dest) {
  midiNotes.forEach((midi, idx) => {
    // successive delays to simulate strumming strings
    const noteTime = time + idx * 0.022;
    const osc = ctx.createOscillator();
    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();

    const freq = midiToFreq(midi);
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, noteTime);

    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(700, noteTime);
    filter.frequency.exponentialRampToValueAtTime(200, noteTime + 0.7);
    filter.Q.value = 1.2;

    gain.gain.setValueAtTime(0.001, noteTime);
    gain.gain.linearRampToValueAtTime(0.18 / midiNotes.length, noteTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.75);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(dest);

    osc.start(noteTime);
    osc.stop(noteTime + 0.75);
  });
}

function playStringsChord(ctx, time, duration, midiNotes, dest) {
  midiNotes.forEach((midi, idx) => {
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    const freq = midiToFreq(midi);
    osc1.type = 'sawtooth';
    osc1.frequency.setValueAtTime(freq - 1.2, time);
    osc2.type = 'sawtooth';
    osc2.frequency.setValueAtTime(freq + 1.2, time);

    filter.type = 'lowpass';
    filter.frequency.value = 1100;

    // slow attack and release
    gain.gain.setValueAtTime(0.001, time);
    gain.gain.linearRampToValueAtTime(0.07 / midiNotes.length, time + 0.45);
    gain.gain.setValueAtTime(0.07 / midiNotes.length, time + duration - 0.45);
    gain.gain.linearRampToValueAtTime(0.001, time + duration);

    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(gain);
    gain.connect(dest);

    osc1.start(time);
    osc1.stop(time + duration);
    osc2.start(time);
    osc2.stop(time + duration);
  });
}

function playPadChord(ctx, time, duration, midiNotes, dest) {
  midiNotes.forEach((midi, idx) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    const freq = midiToFreq(midi);
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, time);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(500, time);

    gain.gain.setValueAtTime(0.001, time);
    gain.gain.linearRampToValueAtTime(0.12 / midiNotes.length, time + 0.6);
    gain.gain.setValueAtTime(0.12 / midiNotes.length, time + duration - 0.5);
    gain.gain.linearRampToValueAtTime(0.001, time + duration);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(dest);

    osc.start(time);
    osc.stop(time + duration);
  });
}

// --- Main Procedural Synthesis Orchestrator ---

export async function generateProceduralBeat(genre = 'pop', selectedInstruments = []) {
  const bpm = GENRE_TEMPO[genre] || 120;
  const beatDuration = 60 / bpm;
  const measureDuration = 4 * beatDuration;
  const totalDuration = 30; // 30 seconds
  const sampleRate = 44100;
  
  const ctx = new OfflineAudioContext(2, sampleRate * totalDuration, sampleRate);
  const noiseBuffer = createNoiseBuffer(ctx);

  // Setup Master Bus & Effects
  const masterBus = ctx.createGain();
  masterBus.gain.value = 1.0;

  // Find overall quality and effect from instrument stem options
  let masterEffect = 'None';
  let isLowQuality = false;

  selectedInstruments.forEach(inst => {
    if (inst.effect && inst.effect !== 'None') {
      masterEffect = inst.effect;
    }
    if (inst.quality === 'Low') {
      isLowQuality = true;
    }
  });

  let lastNodeInChain = masterBus;

  // Apply master quality filter (Low quality gets narrow telephone bandpass EQ)
  if (isLowQuality) {
    const lowpass = ctx.createBiquadFilter();
    lowpass.type = 'lowpass';
    lowpass.frequency.value = 3400;

    const highpass = ctx.createBiquadFilter();
    highpass.type = 'highpass';
    highpass.frequency.value = 300;

    masterBus.connect(lowpass);
    lowpass.connect(highpass);
    lastNodeInChain = highpass;
  }

  // Apply master effects
  if (masterEffect === 'Echo') {
    const delay = ctx.createDelay();
    delay.delayTime.value = beatDuration * 0.75; // dotted 8th echo
    const feedback = ctx.createGain();
    feedback.gain.value = 0.35;

    // route last node to both direct destination and delay node
    const echoDryGain = ctx.createGain();
    echoDryGain.gain.value = 1.0;
    const echoWetGain = ctx.createGain();
    echoWetGain.gain.value = 0.4;

    lastNodeInChain.connect(echoDryGain);
    lastNodeInChain.connect(delay);
    delay.connect(feedback);
    feedback.connect(delay); // feedback loop
    
    delay.connect(echoWetGain);

    const echoMixer = ctx.createGain();
    echoMixer.gain.value = 1.0;
    echoDryGain.connect(echoMixer);
    echoWetGain.connect(echoMixer);
    
    lastNodeInChain = echoMixer;
  } else if (masterEffect === 'Distortion') {
    const shaper = ctx.createWaveShaper();
    shaper.curve = makeDistortionCurve(40);
    shaper.oversample = '4x';
    
    const distGain = ctx.createGain();
    distGain.gain.value = 0.6; // adjust makeup gain

    lastNodeInChain.connect(shaper);
    shaper.connect(distGain);
    lastNodeInChain = distGain;
  } else if (masterEffect === 'Reverb') {
    // Simple Schroeder Reverberator implementation using parallel delay loops
    const reverbMixer = ctx.createGain();
    reverbMixer.gain.value = 1.0;

    // Dry path
    const dryGain = ctx.createGain();
    dryGain.gain.value = 1.0;
    lastNodeInChain.connect(dryGain);
    dryGain.connect(reverbMixer);

    // Wet path
    const delays = [0.029, 0.037, 0.043].map(dTime => {
      const d = ctx.createDelay();
      d.delayTime.value = dTime;
      const f = ctx.createGain();
      f.gain.value = 0.5; // reverb decay
      d.connect(f);
      f.connect(d); // feedback
      return d;
    });

    const wetGain = ctx.createGain();
    wetGain.gain.value = 0.35; // wet level

    delays.forEach(d => {
      lastNodeInChain.connect(d);
      d.connect(wetGain);
    });

    wetGain.connect(reverbMixer);
    lastNodeInChain = reverbMixer;
  }

  // Connect the last node to the final hardware destination
  lastNodeInChain.connect(ctx.destination);

  const numMeasures = Math.ceil(totalDuration / measureDuration);
  const activeKeys = selectedInstruments.map(i => i.name);

  // Rhythm and Chord Progression loop
  for (let m = 0; m < numMeasures; m++) {
    const mStart = m * measureDuration;
    if (mStart >= totalDuration) break;

    const chordIdx = m % 4;
    const chord = GENRE_CHORDS[genre] ? GENRE_CHORDS[genre][chordIdx] : GENRE_CHORDS['pop'][chordIdx];
    const root = chord.root;
    const notes = chord.notes;

    // --- 1. Drums Sequencer (16 steps per measure) ---
    if (activeKeys.includes('drums')) {
      const stepTime = beatDuration / 4;
      for (let step = 0; step < 16; step++) {
        const time = mStart + step * stepTime;
        if (time >= totalDuration) break;

        // Populate drum trigger rules based on genre
        if (genre === 'pop' || genre === 'rock' || genre === 'edm' || genre === 'rnb') {
          // Kick: 1 & 3, Snare: 2 & 4
          const kickSteps = genre === 'edm' ? [0, 4, 8, 12] : [0, 8];
          const snareSteps = [4, 12];
          const hihatSteps = [0, 2, 4, 6, 8, 10, 12, 14];

          if (kickSteps.includes(step)) playKick(ctx, time, masterBus);
          if (snareSteps.includes(step)) playSnare(ctx, time, noiseBuffer, masterBus);
          if (hihatSteps.includes(step)) playHihat(ctx, time, noiseBuffer, masterBus);
        } 
        else if (genre === 'hip-hop' || genre === 'lo-fi') {
          // Swung / syncopated hip-hop
          const kickSteps = [0, 6, 10];
          const snareSteps = [4, 12];
          
          if (kickSteps.includes(step)) playKick(ctx, time, masterBus);
          if (snareSteps.includes(step)) playSnare(ctx, time, noiseBuffer, masterBus);

          // 16th hats for hiphop, 8th for lo-fi
          if (genre === 'hip-hop' || step % 2 === 0) {
            playHihat(ctx, time, noiseBuffer, masterBus);
          }
        } 
        else if (genre === 'folk') {
          // Minimal acoustic percussion
          if (step === 0 || step === 8) playKick(ctx, time, masterBus);
          if (step === 4 || step === 12) {
            // soft snare
            const quietGain = ctx.createGain();
            quietGain.gain.value = 0.25;
            quietGain.connect(masterBus);
            playSnare(ctx, time, noiseBuffer, quietGain);
          }
          if ([2, 6, 10, 14].includes(step)) playHihat(ctx, time, noiseBuffer, masterBus);
        }
        else if (genre === 'jazz') {
          // Jazz swing ride cymbal pattern
          if (step === 0) {
            const lowGain = ctx.createGain();
            lowGain.gain.value = 0.3;
            lowGain.connect(masterBus);
            playKick(ctx, time, lowGain); // quiet feathering
          }
          // ride/hat pattern on swing triplets (represented closely by steps 0, 3, 4, 7, 8, 11, 12, 15)
          if ([0, 3, 4, 8, 11, 12].includes(step)) {
            playHihat(ctx, time, noiseBuffer, masterBus);
          }
        }
      }
    }

    // --- 2. Bass Sequencer ---
    if (activeKeys.includes('bass')) {
      const stepTime = beatDuration / 4;
      if (genre === 'edm') {
        // Driving eighth note bassline
        for (let b = 0; b < 8; b++) {
          const time = mStart + b * (beatDuration / 2);
          if (time >= totalDuration) break;
          playBassNote(ctx, time, beatDuration / 2 - 0.02, root, masterBus);
        }
      } else if (genre === 'hip-hop' || genre === 'lo-fi') {
        // Deep long sub-bass
        playBassNote(ctx, mStart, beatDuration * 1.5, root - 12, masterBus); // Sub-bass octave
        playBassNote(ctx, mStart + beatDuration * 2, beatDuration * 1.5, root - 12, masterBus);
      } else if (genre === 'jazz') {
        // Walking bassline (quarter notes: root, 3rd, 5th, leading tone)
        playBassNote(ctx, mStart, beatDuration - 0.05, root, masterBus);
        playBassNote(ctx, mStart + beatDuration, beatDuration - 0.05, root + 4, masterBus);
        playBassNote(ctx, mStart + beatDuration * 2, beatDuration - 0.05, root + 7, masterBus);
        playBassNote(ctx, mStart + beatDuration * 3, beatDuration - 0.05, root + 11, masterBus);
      } else {
        // Standard pop/rock: root on 1 and 3
        playBassNote(ctx, mStart, beatDuration * 1.5, root, masterBus);
        playBassNote(ctx, mStart + beatDuration * 2, beatDuration * 1.5, root, masterBus);
      }
    }

    // --- 3. Piano Chords ---
    if (activeKeys.includes('piano')) {
      if (genre === 'jazz' || genre === 'rnb') {
        // Syncopated chords (offbeats)
        playPianoChord(ctx, mStart + beatDuration * 0.5, beatDuration, notes, masterBus);
        playPianoChord(ctx, mStart + beatDuration * 2.5, beatDuration, notes, masterBus);
      } else if (genre === 'folk') {
        // Folk arpeggiated piano
        const stepTime = beatDuration / 2;
        notes.forEach((note, idx) => {
          const time = mStart + idx * stepTime;
          if (time < mStart + measureDuration) {
            playPianoChord(ctx, time, beatDuration, [note], masterBus);
          }
        });
      } else {
        // Pop/Rock stabs on beats 1 and 3
        playPianoChord(ctx, mStart, beatDuration, notes, masterBus);
        playPianoChord(ctx, mStart + beatDuration * 2, beatDuration, notes, masterBus);
      }
    }

    // --- 4. Synth Arpeggios ---
    if (activeKeys.includes('synth')) {
      const stepTime = beatDuration / 4; // 16th notes arpeggiator
      for (let s = 0; s < 16; s++) {
        const time = mStart + s * stepTime;
        if (time >= totalDuration) break;
        const noteIdx = s % notes.length;
        playSynthNote(ctx, time, stepTime * 0.9, notes[noteIdx] + 12, masterBus); // arpeggiate an octave up
      }
    }

    // --- 5. Guitar Strums ---
    if (activeKeys.includes('guitar')) {
      // Guitar strums at start and middle of measure
      playGuitarStrum(ctx, mStart, notes, masterBus);
      playGuitarStrum(ctx, mStart + beatDuration * 2, notes, masterBus);
    }

    // --- 6. Strings Pad (Long sustained warm chord) ---
    if (activeKeys.includes('strings')) {
      playStringsChord(ctx, mStart, measureDuration, notes, masterBus);
    }

    // --- 7. Ambient Pads (Long atmospheric filter sweep chords) ---
    if (activeKeys.includes('ambient-pads')) {
      playPadChord(ctx, mStart, measureDuration, notes, masterBus);
    }
  }

  // Render context to buffer
  const renderedBuffer = await ctx.startRendering();

  // Encode AudioBuffer to WAV
  const wavBytes = audioBufferToWav(renderedBuffer);
  const blob = new Blob([wavBytes], { type: 'audio/wav' });

  // Convert Blob to base64 data URL
  const base64DataUrl = await new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.readAsDataURL(blob);
  });

  return {
    audioUrl: base64DataUrl,
    metadata: {
      generated_at: new Date().toISOString(),
      tempo: `${bpm} BPM`,
      genre,
      instruments: selectedInstruments,
      provider: 'browser-synth'
    }
  };
}

// --- WAV Encoder Helper ---

function audioBufferToWav(buffer) {
  const numOfChan = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const format = 1; // raw PCM
  const bitDepth = 16;
  
  const resultChanData = [];
  for (let i = 0; i < numOfChan; i++) {
    resultChanData.push(buffer.getChannelData(i));
  }

  const length = buffer.length * numOfChan * (bitDepth / 8);
  const bufferArray = new ArrayBuffer(44 + length);
  const view = new DataView(bufferArray);

  let pos = 0;

  function writeString(str) {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(pos + i, str.charCodeAt(i));
    }
    pos += str.length;
  }

  function writeUint16(data) {
    view.setUint16(pos, data, true);
    pos += 2;
  }

  function writeUint32(data) {
    view.setUint32(pos, data, true);
    pos += 4;
  }

  /* RIFF identifier */
  writeString('RIFF');
  /* file length */
  writeUint32(36 + length);
  /* RIFF type */
  writeString('WAVE');
  /* format chunk identifier */
  writeString('fmt ');
  /* format chunk length */
  writeUint32(16);
  /* sample format (raw) */
  writeUint16(format);
  /* channel count */
  writeUint16(numOfChan);
  /* sample rate */
  writeUint32(sampleRate);
  /* byte rate (sample rate * block align) */
  writeUint32(sampleRate * numOfChan * (bitDepth / 8));
  /* block align (channel count * bytes per sample) */
  writeUint16(numOfChan * (bitDepth / 8));
  /* bits per sample */
  writeUint16(bitDepth);
  /* data chunk identifier */
  writeString('data');
  /* data chunk length */
  writeUint32(length);

  // Write actual PCM audio samples (interleaved)
  const numSamples = buffer.length;
  for (let offset = 0; offset < numSamples; offset++) {
    for (let chan = 0; chan < numOfChan; chan++) {
      let sample = resultChanData[chan][offset];
      // Clamp sample to [-1.0, 1.0]
      sample = Math.max(-1.0, Math.min(1.0, sample));
      // Scale to 16-bit signed integer
      sample = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
      view.setInt16(pos, sample, true);
      pos += 2;
    }
  }

  return bufferArray;
}
