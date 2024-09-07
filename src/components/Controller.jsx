import "react";
import {StyleSheet, View, StatusBar, SafeAreaView} from 'react-native';
import {GestureHandlerRootView} from "react-native-gesture-handler";
import {AxisPadStyles,} from "../styles/DefaultStyles";
import Joystick from "./Joystick";
import ActionButton from "./ActionButton";


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

    const beginPress = () => {
        console.log("Begin Press")
    }

    const endPress = () => {
        console.log("End Press")
    }

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
                    <ActionButton onBegin={beginPress} onEnd={endPress} text="1"/>
                    <ActionButton onBegin={beginPress} onEnd={endPress} text="2"/>
                </View>
            </GestureHandlerRootView>
        </SafeAreaView>
    );
}
