# Bucky Kart Controller
React Native mobile app for controlling RC cars via BLE

## Setup Development Environment
Note: These instructions are applicable to Debian-based systems.

### Android
To get the required Android SDK, for simplicity, install Android Studio.
Then, make sure you set the `ANDROID_HOME` environment variable to the path to the SDK (usually `/home/<your_user>/Android/Sdk`).
Finally, run `sudo apt install default-jre default-jdk`. You may need to set the following environment variable: `JAVA_HOME="/usr/lib/jvm/<java-version-you-installed>"`

### iOS
**TODO**

## Building and Running the App
First, have your device plugged in to your laptop via a USB cable.  To build and run the app locally:
```bash
me@my-device:/path/to/bucky-kart-controller$ npx expo run:<android|ios> [--no-build-cache] --device
```

To make an apk (Android) or install link (iOS - note, you'll need an Apple Developer Account if building with Expo because Apple is mean and requires a dev account, even to distribute it internally, and Expo unconditionally checks for an account, even when building locally), run the following:
```bash
me@my-device:/path/to/bucky-kart-controller$ eas build --platform <android|ios> --profile <build_option_from_eas.json>
```
