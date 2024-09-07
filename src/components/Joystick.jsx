import {useState} from "react";
import {Text, View} from "react-native";
import {AxisPad, AxisPadProps, AxisPadTouchEvent} from "@fustaro/react-native-axis-pad";
import {axisPadStyles} from "../styles/DefaultStyles";


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

        // TODO Add a callback prop for sending x and/or y to the car
        //  *** MAKE SURE TO NEGATE Y BEFORE SENDING SO THAT IT MATCHES THE READOUTS ***

        if (touch.eventType === "start") {
            setActive(true);
        } else if (touch.eventType === "end") {
            setActive(false);
        }
    };

    const wrapperStyle = active
        ? [axisPadStyles.wrapper, axisPadStyles.wrapperActive]
        : axisPadStyles.wrapper;

    const textWrapperStyle = active
        ? [axisPadStyles.textWrapper, axisPadStyles.textWrapperActive]
        : axisPadStyles.textWrapper;

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
