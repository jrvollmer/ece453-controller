import {StyleSheet} from "react-native";


const stickBackgroundColor = "#EE000090";
const stickBorderColor = "#EE0000A0";
const red = "#EE0000C0";
const borderRed = "#EE0000D0";
const deepRed = "#EE000090";
const crimson = "#EE000040";

export const smallKnobSize = 60;
export const padBorderColor = red;

export const axisPadStyles = StyleSheet.create({
    pad: {
        backgroundColor: "#FFFFFF",
        borderColor: deepRed,
        borderWidth: 2.5,
    },
    controlKnob: {
        backgroundColor: deepRed,
        borderColor: borderRed,
        borderWidth: 1.5,
    },
    smallStick: {
        width: 20,
        backgroundColor: stickBackgroundColor,
        borderColor: stickBorderColor,
        borderWidth: 1,
    },
    wrapper: {
        alignItems: "center",
        borderRadius: 8,
        borderWidth: 1.5,
        borderColor: crimson,
        padding: 4,
        backgroundColor: crimson,
    },
    wrapperActive: {
        borderColor: deepRed,
        backgroundColor: deepRed,
    },
});


const buttonBaseStyle = {
    button: {
        width: 150,
        height: 150,
        borderRadius: 75,
        justifyContent: "center",
        alignItems: "center"
    },
    text: {
        fontFamily: "serif",
        fontSize: 72,
        fontWeight: "bold"
    }
};

export const buttonStyles = StyleSheet.create({
    button: {
        released: {
            ...buttonBaseStyle.button,
            backgroundColor: "#EE0000"
        },
        pressed: {
            ...buttonBaseStyle.button,
            backgroundColor: "#AA0000"
        },
        disabled: {
            ...buttonBaseStyle.button,
            backgroundColor: "#EE8888"
        }
    },
    text: {
        released: {
            ...buttonBaseStyle.text,
            color: "#F8F8F8"
        },
        pressed: {
            ...buttonBaseStyle.text,
            color: "#D8D8D8"
        }
    }
});


export const containerStyles = StyleSheet.create({
    pageContainer: {
        flex: 1,
        backgroundColor: "#FFFFFF",
    },
    padContainer: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-evenly",
    }
});


const boxShadow = {
    shadowColor: '#000',
    shadowOffset: {
        width: 0,
        height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
};

export const scanStyles = StyleSheet.create({
    scanButton: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        paddingHorizontal: 16,
        backgroundColor: '#ff2a2a',
        margin: 10,
        borderRadius: 12,
        ...boxShadow,
    },
    scanButtonText: {
        fontSize: 16,
        letterSpacing: 0.25,
        color: '#ffffff',
        fontWeight: 'bold',
    },
    body: {
        backgroundColor: '#ffffff',
        flex: 1,
    },
    peripheralName: {
        color: '#ffffff',
        textAlign: 'center',
        padding: 15,
        fontSize: 32,
        fontFamily: 'serif',
        fontWeight: 'bold',
        letterSpacing: 1,
    },
    peripheralId: {
        fontSize: 12,
        textAlign: 'center',
        padding: 2,
        paddingBottom: 20,
    },
    row: {
        marginLeft: 10,
        marginRight: 10,
        borderRadius: 20,
        ...boxShadow,
    },
    noPeripherals: {
        margin: 10,
        textAlign: 'center',
    },
});
