import "react";
import {View, Image, SafeAreaView} from 'react-native';
import {GestureHandlerRootView} from "react-native-gesture-handler";
import {axisPadStyles, containerStyles, padBorderColor, smallKnobSize} from "../styles/DefaultStyles";
import {blueShellImg} from "../Images";
import Joystick from "./Joystick";
import ActionButton from "./ActionButton";


export default function Controller() {
    const beginPress = () => {
        console.log("Begin Press")
    }

    const endPress = () => {
        console.log("End Press")
    }

    return (
        <SafeAreaView style={containerStyles.pageContainer}>
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
                            source={blueShellImg}
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
        </SafeAreaView>
    );
}
