<div align="center">
  <img src="public/icon.svg" alt="Cadenza Logo" width="100" />
  <h1>Cadenza</h1>
  <p><strong>The Ultimate AI-Powered Music Generation Platform</strong></p>
</div>

---

## 🎵 Overview

**Cadenza** is a cutting-edge web application designed to empower creators, musicians, and enthusiasts to generate, mix, and produce complete tracks seamlessly. Utilizing advanced LLMs for lyrics and procedural AI algorithms for instrumentals and voice, Cadenza offers an intuitive, professional, and visually stunning "scrollytelling" studio experience.

Whether you are looking to generate a quick beat, write an entire song, or produce a finalized master mix with AI-generated vocals, Cadenza provides the end-to-end creative suite to bring your musical ideas to life.

---

## ✨ Key Features

### 📝 Lyrics Studio
- **AI Lyric Generation**: Input your seed phrase, genre, mood, and tempo to instantly generate context-aware, structured lyrics (verses, choruses, bridges) using the ultra-fast Groq LLM.
- **Multilingual Support**: Write hits in English, Spanish, French, Japanese, or Korean.
- **Interactive Editing**: Fine-tune your AI-generated lyrics line by line.

### 🎹 Instrumental Studio
- **Procedural Beat Generation**: Select your generated lyrics as a thematic foundation and choose from a variety of instrument stems (Drums, Bass, Synths, Keys, Strings) to procedurally generate a high-quality backing track.
- **Stem Mixing**: Adjust the quality and apply effects (Reverb, Delay, Chorus, Distortion) to individual stems.

### 🎤 Voice Studio
- **Voice FX & Mixing Desk**: Record your own vocals directly in the browser or use the built-in **AI Vocoder** to auto-sing your lyrics.
- **Master Mix Generation**: Mix your vocal tracks seamlessly with your instrumental beat. Apply professional studio effects like Equalization (EQ), Compression, Pitch Shifting, and Reverb.

### 🗂️ Dashboard & Catalog
- **Immersive 3D Experience**: A stunning, interactive Three.js powered dashboard environment.
- **Asset Management**: View, manage, and delete all your generated lyrics, beats, and final master tracks.
- **One-Click Export**: Instantly export your Lyrics to professional `.docx` formats, and download your Instrumentals and Final Mixes as high-quality `.mp3` files.

---

## 🛠️ Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS & Framer Motion for buttery-smooth animations and glassmorphic UI.
- **3D & Graphics**: Three.js, React Three Fiber, React Three Drei, Postprocessing.
- **Audio Processing**: Web Audio API, Wavesurfer.js, Lamejs, FFmpeg (WASM).
- **Backend & Database**: Neon Serverless Postgres, NextAuth.js (Authentication).
- **AI Integration**: Groq SDK for lightning-fast LLM inference.
- **File Export**: docx, file-saver.

---

## 🚀 Getting Started

### Prerequisites
Make sure you have [Node.js](https://nodejs.org/) installed on your machine.

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Kavya-Jain-coder/Cadenza.git
   cd Cadenza
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Environment Variables:**
   Create a `.env.local` file in the root directory and configure your environment variables (Neon Database URI, NextAuth Secret, Groq API Key, etc.).

4. **Run the development server:**
   ```bash
   npm run dev
   ```

5. **Open your browser:**
   Navigate to [http://localhost:3000](http://localhost:3000) to see the application in action.

---

## 🎨 UI/UX Highlights

- **Scrollytelling Studios**: Built with `lenis` smooth scrolling and `framer-motion`, guiding users step-by-step through the track creation phases.
- **Silver/Monochrome Theme**: An ultra-premium, dark-mode focused aesthetic with glassmorphism (backdrop blurs), glowing gradients, and dynamic interactive elements.
- **Fully Responsive**: Flawless experience across desktop, tablet, and mobile devices.

---

## 🤝 Contributing
Contributions, issues, and feature requests are welcome! Feel free to check the [issues page](https://github.com/Kavya-Jain-coder/Cadenza/issues).

---

<div align="center">
  <p>Built with ❤️ during the Hackathon.</p>
</div>
