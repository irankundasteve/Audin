# Audin: Pro Voice Recorder

A high-fidelity voice recording application with hardware-inspired design and on-device AI processing.

## Features
- **Professional DSP Engine**: Real-time limiting, EQ, and compression.
- **On-Device AI**: Noise reduction and voice enhancement without using a server.
- **Smart Storage**: Built-in management for large audio libraries.
- **Privacy First**: Fully operational offline with secure local processing.

## Development
```bash
npm install
npm run dev
```

## CI/CD
This project uses GitHub Actions to automatically:
1. Verify code quality (Linting)
2. Build the production web distribution
3. Prepare artifacts for deployment

The workflow is located in `.github/workflows/main.yml`.

## APK / Mobile
To turn this into an APK, recommend using [Capacitor](https://capacitorjs.com/):
1. `npm install @capacitor/core @capacitor/cli`
2. `npx cap init`
3. `npx cap add android`
4. `npx cap sync`
5. `./gradlew assembleDebug` (in the android folder)
