import {useState} from "react";
import {Gesture, GestureDetector} from "react-native-gesture-handler";
import {Text, View} from "react-native";
import {buttonStyles} from "../../styles/DefaultStyles";


// Credit to https://stackoverflow.com/a/77499348
export default function ActionButton({
    onEnd,
    maxDuration = 100000,
    text = "",
    enabled = false,
}) {
    const [isPressed, setPressed] = useState(false);

    const endTap = () => {
        setPressed(false);
        onEnd();
    }

    const tapGesture = Gesture.Tap()
        .runOnJS(true)
        .maxDuration(maxDuration)
        // Start tap
        .onBegin(() => {
            setPressed(true);
        })
        // Stop tap (move finger off button)
        .onTouchesCancelled(endTap)
        // Stop tap (lift finger)
        .onEnd(endTap);

    return (
        <GestureDetector gesture={enabled ? tapGesture : Gesture.Tap().runOnJS(true)}>
            <View
                collapsable={false}
                style={
                    enabled ?
                    (isPressed ? buttonStyles.button.pressed : buttonStyles.button.released)
                    :
                    buttonStyles.button.disabled
                }
            >
                {
                    text.length > 0
                    ?
                        <Text style={isPressed ? buttonStyles.text.pressed : buttonStyles.text.released}>
                            {text}
                        </Text>
                    :
                        <></>
                }
            </View>
        </GestureDetector>
    );
}
