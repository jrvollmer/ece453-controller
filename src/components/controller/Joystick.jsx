import {View} from "react-native";
import {AxisPad, AxisPadProps, AxisPadTouchEvent} from "@fustaro/react-native-axis-pad";
import {axisPadStyles} from "../../styles/DefaultStyles";


export default function Joystick(props: Omit<AxisPadProps, "onTouchEvent">) {
    const onTouchEvent = (touch: AxisPadTouchEvent) => {
        // NOTE: Y is negated due to unintuitive interpretations of y-axis signs
        // Callbacks for setting x and y values in the parent
        if (!props.disableX && props.setX) {
            props.setX(touch.ratio.x);
        }
        if (!props.disableY && props.setY) {
            props.setY(-touch.ratio.y);
        }
    };

    const wrapperStyle = props.enabled
        ? [axisPadStyles.wrapper, axisPadStyles.wrapperActive]
        : axisPadStyles.wrapper;

    return (
        <View style={wrapperStyle}>
            <AxisPad
                {...props}
                onTouchEvent={onTouchEvent}
            />
        </View>
    );
}
