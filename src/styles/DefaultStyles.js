import {StatusBar, StyleSheet} from "react-native";

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
    wrapper: {
        alignItems: "center",
        borderRadius: 8,
        borderWidth: 1.5,
        borderColor: "#EE000040",
        padding: 4,
        paddingTop: 0,
    },
    wrapperActive: {
        borderColor: "#EE000090",
    },
    textWrapper: {
        marginBottom: 4,
        paddingHorizontal: 12,
        borderBottomLeftRadius: 8,
        borderBottomRightRadius: 8,
        backgroundColor: "#EE000040",
    },
    textWrapperActive: {
        backgroundColor: "#EE000090",
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
        // TODO REMOVE Not sure why I ever had this: paddingTop: StatusBar.currentHeight || 0,
        flex: 1,
    },
    padContainer: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-evenly",
    }
});
