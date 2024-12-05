import "react";
import {View, Image} from 'react-native';
import {GestureHandlerRootView} from "react-native-gesture-handler";
import {useEffect, useRef, useState} from "react";
import BleManager from "react-native-ble-manager";

import {axisPadStyles, containerStyles, padBorderColor, smallKnobSize} from "../../styles/DefaultStyles";
import {ItemImages} from "../../Images";
import Joystick from "./Joystick";
import ActionButton from "./ActionButton";
import {CharacteristicUUIDs, ServiceUUIDs, ItemIndexToCarItem, NUM_LAPS} from "../../helpers/ble";
import {sleep} from "../../helpers/generic";


const JOYSTICK_SEND_PERIOD_MS = 100;


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

    const writeUseItemBle = async (bleItem) => {
        // TODO UPDATE: The MCU can poll the "Use Item" characteristic or set up a callback and set it to 0 after changing
        await BleManager.write(
            props.peripheral.id,
            ServiceUUIDs.RCController,
            CharacteristicUUIDs.UseItem,
            [bleItem]
        )
            .then(() => {
                console.log('Use Item write success:', bleItem);
            })
            .catch((error) => {
                console.log('Use Item write error:', error);
            });
    }

    const endPress = () => {
        if (props.peripheral.connected) {
            // Use item
            console.debug("Use item");
            props.setItem((currIdx) => {
                if (currIdx > 0) {
                    console.log(`Using item. Internal: ${currIdx}; BLE msg: ${ItemIndexToCarItem[currIdx]})`);
                    writeUseItemBle(ItemIndexToCarItem[currIdx]);
                    console.debug("item would be", currIdx - 1);

                    // If we're still on the same item when decrementing, do so
                    // Otherwise, reset to 0 (no item)
                    if (ItemIndexToCarItem[currIdx - 1] === ItemIndexToCarItem[currIdx]) {
                        return currIdx - 1;
                    }
                }
                return 0;
            });
        }
    }

    const writeValues = async () => {
        const joyXArray = floatToByteArray(joyXRef.current).reverse();
        const joyYArray = floatToByteArray(joyYRef.current).reverse();
        // console.log('X', joyXRef.current);
        // console.log('Y', joyYRef.current);
        // console.log('X_array', joyXArray);
        // console.log('Y_array', joyYArray);

        if (props.peripheral.connected) {
            // Only send joystick values during the race
            if ((props.lap > 0) && (props.lap <= NUM_LAPS)) {
                await BleManager.writeWithoutResponse(
                    props.peripheral.id,
                    ServiceUUIDs.RCController,
                    CharacteristicUUIDs.JoystickX,
                    joyXArray,
                    maxByteSize = 4,
                )
                    .then(() => {
                        // console.log('Joystick x write success');
                    })
                    .catch((error) => {
                        console.log('Joystick x write error:', error);
                    });
                await BleManager.writeWithoutResponse(
                    props.peripheral.id,
                    ServiceUUIDs.RCController,
                    CharacteristicUUIDs.JoystickY,
                    joyYArray,
                    maxByteSize = 4,
                )
                    .then(() => {
                        // console.log('Joystick y write success');
                    })
                    .catch((error) => {
                        console.log('Joystick y write error:', error);
                    });
            }

            await sleep(JOYSTICK_SEND_PERIOD_MS);

            setWriteFlag(wf => !wf);
        }
    }

    // Write values every JOYSTICK_SEND_PERIOD_MS ms
    useEffect(() => {writeValues()}, [writeFlag, props.peripheral.connected]);

    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <View style={containerStyles.padContainer}>
                <Joystick
                    id={"car-joystick-y"}
                    enabled={props.peripheral.connected && (props.lap > 0) && (props.lap <= NUM_LAPS)}
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
                            opacity: (props.item === 0 ? 0 : 1)
                        }}
                        source={ItemImages[props.item]}
                    />
                </View>
                <View style={{flexDirection: "column", rowGap: 25, alignItems: "center"}}>
                    <ActionButton
                        onEnd={endPress}
                        text="I"
                        enabled={props.peripheral.connected}
                    />
                    <Joystick
                        id={"car-joystick-x"}
                        enabled={props.peripheral.connected && (props.lap > 0) && (props.lap <= NUM_LAPS)}
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
