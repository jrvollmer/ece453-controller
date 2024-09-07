import {useState} from "react";
import {Gesture, GestureDetector} from "react-native-gesture-handler";
import {Text, View} from "react-native";
import {ButtonStyles} from "../styles/DefaultStyles";


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
                style={isPressed ? ButtonStyles.button.pressed : ButtonStyles.button.released}
            >
                {
                    text.length > 0
                    ?
                        <Text style={isPressed ? ButtonStyles.text.pressed : ButtonStyles.text.released}>
                            {text}
                        </Text>
                    :
                        <></>
                }
            </View>
        </GestureDetector>
    );
}
