import "react";
import {View, Image} from 'react-native';
import {GestureHandlerRootView} from "react-native-gesture-handler";
import {useEffect, useRef, useState} from "react";
import BleManager from "react-native-ble-manager";

import {axisPadStyles, containerStyles, padBorderColor, smallKnobSize} from "../../styles/DefaultStyles";
import {ItemImages} from "../../Images";
import Joystick from "./Joystick";
import ActionButton from "./ActionButton";
import {CharacteristicUUIDs, ServiceUUIDs} from "../../helpers/ble";


function floatToByteArray(float) {
    const buffer = new ArrayBuffer(4);
    const view = new DataView(buffer);

    view.setFloat32(0, float);

    return Array.from(new Uint8Array(buffer));
}

function Controller(props) {
    const joyXRef = useRef(0);
    const joyYRef = useRef(0);
    const [writeFlag, setWriteFlag] = useState(false);
    const [itemIndex, setItemIndex] = useState(0);

    const beginPress = () => {
        console.log("Begin Press")
        // TODO Could probably remove this, unless we want to enable holding items behind the car (i.e. shielding)
    }


    // TODO Add a notification listener and a handler to get items, as well as one to handle laps


    const writeItemBle = async (itemIdx) => {
        // The MCU can poll the "Use Item" characteristic or set up a callback and set it to 0 after changing
        await BleManager.write(
            props.peripheralId,
            ServiceUUIDs.RCController,
            CharacteristicUUIDs.UseItem,
            [itemIdx]
        )
            .then(() => {
                console.log('Use Item write success', itemIdx);
            })
            .catch((error) => {
                console.log('Use Item write error:', error);
            });
    }

    const endPress = async () => {
        console.debug("Use item");
        setItemIndex((currIdx) => {
            if (currIdx > 0) {
                writeItemBle(currIdx);
                console.debug("item would be", currIdx - 1)
                return currIdx - 1;
            }
            return 3; // TODO This should be 0. Just set to 3 for debugging
        });
    }

    const writeValues = async () => {
        const joyXArray = floatToByteArray(joyXRef.current).reverse();
        const joyYArray = floatToByteArray(joyYRef.current).reverse();
        console.log('X', joyXRef.current);
        console.log('Y', joyYRef.current);
        console.log('X_array', joyXArray);
        console.log('Y_array', joyYArray); 

        await BleManager.writeWithoutResponse(
            props.peripheralId,
            ServiceUUIDs.RCController,
            CharacteristicUUIDs.JoystickX,
            joyXArray,
            maxByteSize = 4,
        )
            .then(() => {
                console.log('Joystick x write success');
            })
            .catch((error) => {
                console.log('Joystick x write error:', error);
            });
        await BleManager.writeWithoutResponse(
            props.peripheralId,
            ServiceUUIDs.RCController,
            CharacteristicUUIDs.JoystickY,
            joyYArray,
            maxByteSize = 4,
        )
            .then(() => {
                console.log('Joystick y write success');
            })
            .catch((error) => {
                console.log('Joystick y write error:', error);
            });

        setWriteFlag(wf => !wf);
    }

    // Write values as quickly as we can
    useEffect(() => {writeValues()}, [writeFlag]);


    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <View style={containerStyles.padContainer}>
                <Joystick
                    id={"car-joystick-y"}
                    disableX={true}
                    setY={(val) => {joyYRef.current = val}}
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
                            opacity: (itemIndex === 0 ? 0 : 1)
                        }}
                        source={ItemImages[itemIndex]}
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
                        setX={(val) => {joyXRef.current = val}}
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
