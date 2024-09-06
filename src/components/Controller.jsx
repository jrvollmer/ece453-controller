import "react";
import {StyleSheet, View, Text, StatusBar, SafeAreaView, Button, Pressable} from 'react-native';
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { Joystick } from "./Joystick";
import {AxisPadStyles, ButtonStyles, padBorderColor} from "../styles/DefaultStyles";


const styles = StyleSheet.create({
    pageContainer: {
        paddingTop: StatusBar.currentHeight || 0,
        flex: 1,
    },
    padContainer: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-evenly",
    }
});


export default function Controller() {
    return (
        <SafeAreaView style={styles.pageContainer}>
            <GestureHandlerRootView style={{ flex: 1 }}>
                <View style={styles.padContainer}>
                    <Joystick
                        id={"car-joystick"}
                        size={250}
                        stepSize={0}
                        padBackgroundStyle={AxisPadStyles.pad}
                        controlStyle={AxisPadStyles.controlKnob}
                        ignoreTouchDownInPadArea={false}
                        initialTouchType={"snap"}
                        stickStyle={AxisPadStyles.largeStick}
                        keepControlCompletelyInPadBounds={true} // TODO Not completely sure how I feel about this
                    />
                    <View style={{flex: 0.5}}/>
                    <Pressable
                        // onPress={() => {
                        //     setTimesPressed(current => current + 1);
                        // }}
                        style={({pressed}) => [
                            pressed ? ButtonStyles.pressed : ButtonStyles.released
                        ]}>
                    </Pressable>
                </View>
            </GestureHandlerRootView>
        </SafeAreaView>
    );
}
