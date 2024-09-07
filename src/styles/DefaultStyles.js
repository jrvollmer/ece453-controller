import { StyleSheet } from "react-native";

export const padBackgroundColor = "#FFFFFF";
export const padBorderColor = "#EE0000C0";
export const knobBackgroundColor = "#EE0000C0";
export const knobBorderColor = "#EE0000D0";
export const smallKnobSize = 60;
export const stickBackgroundColor = "#EE000090";
export const stickBorderColor = "#EE0000A0";

export const axisPadStyles = StyleSheet.create({
    pad: {
        backgroundColor: padBackgroundColor,
        borderColor: padBorderColor,
        borderWidth: 2.5,
    },
    controlKnob: {
        backgroundColor: knobBackgroundColor,
        borderColor: knobBorderColor,
        borderWidth: 1.5,
    },
    largeStick: {
        width: 40,
        backgroundColor: stickBackgroundColor,
        borderColor: stickBorderColor,
        borderWidth: 1,
    },
    smallStick: {
        width: 20,
        backgroundColor: stickBackgroundColor,
        borderColor: stickBorderColor,
        borderWidth: 1,
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
}

export const buttonStyles = StyleSheet.create({
    button: {
        released: {
            ...buttonBaseStyle.button,
            backgroundColor: "#EE0000"
        },
        pressed: {
            ...buttonBaseStyle.button,
            backgroundColor: "#AA0000"
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
})
