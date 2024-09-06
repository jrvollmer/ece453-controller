import { StyleSheet } from "react-native";

export const padBackgroundColor = "#FFFFFF";
export const padBorderColor = "#EE0000C0";
export const knobBackgroundColor = "#EE0000C0";
export const knobBorderColor = "#EE0000D0";
export const stickBackgroundColor = "#EE000090";
export const stickBorderColor = "#EE0000A0";

export const AxisPadStyles = StyleSheet.create({
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
