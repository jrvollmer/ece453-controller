import React, {useCallback, useContext} from 'react';
import {BackHandler, Button, NativeEventEmitter, NativeModules, SafeAreaView} from 'react-native'; // TODO BackHandler might be Android specific
import {useNavigation, useFocusEffect} from "@react-navigation/native";

import {containerStyles} from "../../styles/DefaultStyles";
import Controller from "../controller/Controller";
import BleManager from "react-native-ble-manager";
import {connectPeripheral, handleAndroidPermissions} from "../../helpers/ble";
import PeripheralsContext from "../../contexts/BlePeripherals";
import {sleep} from "../../helpers/generic";


const RECONNECT_ATTEMPTS = 5;
const RECONNECT_DELAY_MS = 5000;
const BleManagerModule = NativeModules.BleManager;
const BleManagerEmitter = new NativeEventEmitter(BleManagerModule);


function ControllerScreen(props) {
    let {
        peripheralData
    } = props.route.params;
    let leaving = false;
    let reconnecting = false;
    const navigation = useNavigation();
    const [peripherals, setPeripherals] = useContext(PeripheralsContext);

    const goBackToCarSelect = async () => {
        // Disconnect and go back to the car selection screen
        const p = peripherals.get(peripheralData.id);
        if (p && p.connected) {
            try {
                leaving = true;
                await BleManager.disconnect(peripheralData.id);
            }
            catch (error) {
                console.error(`[goBackToCarSelect][${peripheralData.id}] error when trying to disconnect device.`, error);
            }
        }
        navigation.goBack();
    };

    const handleCarDisconnect = async (event) => {
        // This callback will run on failed reconnection attempts
        // Protect against concurrent reconnection loops
        if (!reconnecting) {
            const peripheralId = event.peripheral;
            console.debug("[onCarDisconnect] Updating peripherals")
            setPeripherals(map => {
                let p = map.get(peripheralId);
                if (p) {
                    p.connected = false;
                    return new Map(map.set(peripheralId, p));
                }
                return map;
            });
            if (!leaving) {
                reconnecting = true;
                // We aren't intending to leave, so try to reconnect
                for (let i = 0; i < RECONNECT_ATTEMPTS; i++) {
                    console.debug(`[onCarDisconnect][${i + 1}/${RECONNECT_ATTEMPTS}] Attempting to reconnect`)
                    peripheralData = await connectPeripheral(peripheralId, setPeripherals, BleManager);
                    if (peripheralData) {
                        // Wait a second for the next onCarDisconnect call so that we don't unset reconnecting prematurely
                        await sleep(1000);
                        break;
                    }
                    await sleep(RECONNECT_DELAY_MS);
                }
                reconnecting = false;
                // If we failed to reconnect, go back to the selection screen
                if (!leaving && !peripheralData) {
                    navigation.goBack();
                }
            }
        }
    }

    const handleUpdateValueForCharacteristic = (data) => {
        console.debug(`[handleUpdateValueForCharacteristic] received data from '${data.peripheral}' with characteristic='${data.characteristic}' and value='${data.value}'`);
    };

    useFocusEffect(
        useCallback(() => {
            // Override the default built-in status bar back button behavior
            // TODO This might be Android specific
            const onBackPress = () => {
                console.log("Pressed back")
                // true to disable going back; false to allow default behavior (going back)
                return true;
            };
            BackHandler.addEventListener('hardwareBackPress', onBackPress);

            try {
                BleManager.start({ showAlert: false })
                    .then(() => console.debug('[controller] BleManager started.'))
                    .catch((error) => console.error('[controller] BleManager could not be started.', error));
            } catch (error) {
                console.error('[controller] unexpected error starting BleManager.', error);
                return;
            }
            const bleListeners = [
                BleManagerEmitter.addListener('BleManagerDisconnectPeripheral', handleCarDisconnect),
                BleManagerEmitter.addListener('BleManagerDidUpdateValueForCharacteristic', handleUpdateValueForCharacteristic),
            ];
            handleAndroidPermissions();

            return () => {
                BackHandler.removeEventListener('hardwareBackPress', onBackPress);
                console.debug('[controller] controller unmounting. Removing listeners...');
                for (const listener of bleListeners) {
                    listener.remove();
                }
            }
        }, [])
    );


    // const retrieveServices = async () => {
    //     const peripheralInfos = [];
    //     for (let [peripheralId, peripheral] of peripherals) {
    //         if (peripheral.connected) {
    //             const newPeripheralInfo = await BleManager.retrieveServices(peripheralId);
    //             peripheralInfos.push(newPeripheralInfo);
    //         }
    //     }
    //     return peripheralInfos;
    // };
    //
    // const readCharacteristics = async () => {
    //     let services = await retrieveServices();
    //     for (let peripheralInfo of services) {
    //         peripheralInfo.characteristics?.forEach(async (c) => {
    //             try {
    //                 const value = await BleManager.read(peripheralInfo.id, c.service, c.characteristic);
    //                 console.log("[readCharacteristics]", "peripheralId", peripheralInfo.id, "service", c.service, "char", c.characteristic, "\n\tvalue", value);
    //             }
    //             catch (error) {
    //                 console.error("[readCharacteristics]", peripheralInfo, "Error reading characteristic", c, "Error", error);
    //             }
    //         });
    //     }
    // };

    return (
        <SafeAreaView style={containerStyles.pageContainer}>
            {/* TODO Show car name at the top of the screen */}
            <Button
                // TODO At the end of the game, have a modal at the end of each game to show results and allow going back
                title={"Back"}
                onPress={goBackToCarSelect}
            />
            <Controller
                peripheralId={peripheralData.id}
            />
        </SafeAreaView>
    );
}


export default ControllerScreen;
