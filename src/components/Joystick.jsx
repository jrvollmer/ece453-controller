import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { AxisPad, AxisPadProps, AxisPadTouchEvent } from "@fustaro/react-native-axis-pad";
import { padBorderColor } from "../styles/DefaultStyles";


const styles = StyleSheet.create({
    wrapper: {
        alignItems: "center",
        borderRadius: 8,
        borderWidth: 1.5,
        borderColor: "#00000033",
        padding: 4,
        paddingTop: 0,
    },
    wrapperActive: {
        borderColor: padBorderColor,
    },
    textWrapper: {
        marginBottom: 4,
        paddingHorizontal: 12,
        borderBottomLeftRadius: 8,
        borderBottomRightRadius: 8,
        backgroundColor: "#00000033",
    },
    textWrapperActive: {
        backgroundColor: padBorderColor,
    },
});


function pointDetailsText(x: number, y: number, disableX: boolean, disableY: boolean) {
    const xStr = `X: ${x.toFixed(2)}`
    const yStr = `Y: ${y.toFixed(2)}`
    return disableX ? yStr : (disableY ? xStr : `${xStr}, ${yStr}`)
}

export default function Joystick(props: Omit<AxisPadProps, "onTouchEvent">) {
    const [active, setActive] = useState(false);
    const [text, setText] = useState(pointDetailsText(0, 0, props.disableX, props.disableY));

    const onTouchEvent = (touch: AxisPadTouchEvent) => {
        // NOTE: Y is negated due to unintuitive interpretations of y-axis signs
        setText(pointDetailsText(touch.ratio.x, -touch.ratio.y, props.disableX, props.disableY));

        if (touch.eventType === "start") {
            setActive(true);
        } else if (touch.eventType === "end") {
            setActive(false);
        }
    };

    const wrapperStyle = active ? [styles.wrapper, styles.wrapperActive] : styles.wrapper;

    const textWrapperStyle = active
        ? [styles.textWrapper, styles.textWrapperActive]
        : styles.textWrapper;

    return (
        <View style={wrapperStyle}>
            <View style={textWrapperStyle}>
                <Text>{text}</Text>
            </View>
            <AxisPad
                {...props}
                onTouchEvent={onTouchEvent}
            />
        </View>
    );
}
