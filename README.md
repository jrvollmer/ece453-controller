# Bucky Kart Controller
React Native mobile app for controlling RC cars via BLE

## Setup Development Environment
Note: These instructions are applicable to Debian-based systems. Running something else? Sucks, cause it's not my problem

### Android
**TODO:** Insert inaccurate setup details about installing Android Studio, which contains the SDK, for simplicity.
Then, make sure you set the `ANDROID_HOME` environment variable to the path to the SDK (usually along the lines of `/home/<your_user>/Android/Sdk`)
After that, `sudo apt install default-jre default-jdk`. **<Insert more env var instructions, noting that they're likely unnecessary: `JAVA_HOME="/usr/lib/jvm/<java-version-you-installed>"`>**

### iOS
**TODO: Actually TODO**

## Building and Running the App
First, have your device plugged in to your laptop via a USB cable.  To build and run the app locally:
```bash
me@my-device:/path/to/bucky-kart-controller$ npx expo run:<android|ios> [--no-build-cache] --device
```

To make an apk or <TODO Whatever is distributed for iOS>, run the following:
```bash
me@my-device:/path/to/bucky-kart-controller$ eas build --platform <android|ios> --profile <build_option_from_eas.json>
```
