import "react";
import {View, Image} from 'react-native';
import {GestureHandlerRootView} from "react-native-gesture-handler";
import {axisPadStyles, containerStyles, padBorderColor, smallKnobSize} from "../../styles/DefaultStyles";
import {blueShellImg} from "../../Images";
import Joystick from "./Joystick";
import ActionButton from "./ActionButton";


function Controller(props) {
    // TODO Connect to a car via BLE
    //      Potential flow:
    //          - RC cars start pairing on startup
    //          - App has a main landing page with a list of available cars
    //          - User selects a car and connects
    //          - Move to controller page, displaying car name at the top of the screen

    const beginPress = () => {
        console.log("Begin Press")
        // TODO Could probably remove this, unless we want to enable holding items behind the car (i.e. shielding)
    }

    const endPress = () => {
        console.log("End Press")
        // TODO Send command via BLE to the car
    }

    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <View style={containerStyles.padContainer}>
                <Joystick
                    id={"car-joystick-y"}
                    disableX={true}
                    stepSize={0}
                    size={250}
                    controlSize={smallKnobSize}
                    initialTouchType={"snap"}
                    ignoreTouchDownInPadArea={false}
                    keepControlCompletelyInPadBounds={true}
                    padBackgroundStyle={{...axisPadStyles.pad, marginHorizontal: 32.5}}
                    controlStyle={axisPadStyles.controlKnob}
                    stickStyle={axisPadStyles.smallStick}
                />
                <View
                    style={{
                        flex: 0.5,
                        borderColor: padBorderColor,
                        borderWidth: 5,
                        borderRadius: 50,
                        padding: 10
                    }}
                >
                    <Image
                        style={{
                            width: "100%",
                            height: undefined,
                            aspectRatio: 1,
                            resizeMode: "contain",
                        }}
                        source={blueShellImg} // TODO Update according to actual item held
                    />
                </View>
                <View style={{flexDirection: "column", rowGap: 25, alignItems: "center"}}>
                    <ActionButton
                        onBegin={beginPress}
                        onEnd={endPress}
                        text="I"
                    />
                    <Joystick
                        id={"car-joystick-x"}
                        disableY={true}
                        stepSize={0}
                        size={250}
                        controlSize={smallKnobSize}
                        initialTouchType={"snap"}
                        ignoreTouchDownInPadArea={false}
                        keepControlCompletelyInPadBounds={true}
                        padBackgroundStyle={axisPadStyles.pad}
                        controlStyle={axisPadStyles.controlKnob}
                        stickStyle={axisPadStyles.smallStick}
                    />
                </View>
            </View>
        </GestureHandlerRootView>
    );
}


export default Controller;
