import {useState} from "react";
import {Gesture, GestureDetector} from "react-native-gesture-handler";
import {Text, View} from "react-native";
import {buttonStyles} from "../styles/DefaultStyles";


export default function ActionButton({
    onBegin,
    onEnd,
    maxDuration = 100000,
    text = "",
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
            onBegin();
        })
        // Stop tap (move finger off button)
        .onTouchesCancelled(endTap)
        // Stop tap (lift finger)
        .onEnd(endTap);

    return (
        <GestureDetector gesture={tapGesture}>
            <View
                collapsable={false}
                style={isPressed ? buttonStyles.button.pressed : buttonStyles.button.released}
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
