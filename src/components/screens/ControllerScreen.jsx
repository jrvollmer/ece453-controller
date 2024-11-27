import React, {useCallback, useContext, useState} from 'react';
import {BackHandler, Button, Linking, NativeEventEmitter, NativeModules, Platform, SafeAreaView, Text} from 'react-native';
import {useNavigation, useFocusEffect} from "@react-navigation/native";

import {containerStyles} from "../../styles/DefaultStyles";
import Controller from "../controller/Controller";
import BleManager from "react-native-ble-manager";
import PeripheralsContext from "../../contexts/BlePeripherals";
import {
    connectPeripheral,
    subscribeToNotification,
    handleAndroidPermissions,
    ServiceUUIDs,
    CharacteristicUUIDs,
    NOTIFICATION_CHARACTERISTIC_UUIDS,
    BleMessageToItemIndex
} from "../../helpers/ble";
import {sleep} from "../../helpers/generic";


const RECONNECT_ATTEMPTS = 5;
const RECONNECT_DELAY_MS = 5000;
const BleManagerModule = NativeModules.BleManager;
const BleManagerEmitter = new NativeEventEmitter(BleManagerModule);
const NUM_LAPS = 3


function ControllerScreen(props) {
    let {
        peripheralData
    } = props.route.params;
    let leaving = false;
    let reconnecting = false;
    const navigation = useNavigation();
    const [peripherals, setPeripherals] = useContext(PeripheralsContext);
    const [itemIndex, setItemIndex] = useState(0);
    const [lap, setLap] = useState(1);

    const goBackToCarSelect = async () => {
        // Disconnect and go back to the car selection screen
        const p = peripherals.get(peripheralData.id);
        if (p && (p.connected || p.connecting)) {
            try {
                leaving = true;
                for (const c of NOTIFICATION_CHARACTERISTIC_UUIDS) {
                    await BleManager.stopNotification(peripheralData.id, ServiceUUIDs.RCController, c);
                }
                await BleManager.disconnect(peripheralData.id);
                setPeripherals(map => {
                    let _p = map.get(peripheralData.id);
                    if (_p) {
                        _p.connected = false;
                        _p.connecting = false;
                        return new Map(map.set(peripheralData.id, _p));
                    }
                    return map;
                });
                await sleep(500); // TODO Empirical - needs tuning though
                if (Platform.OS === 'android') {
                    await BleManager.removeBond(peripheralData.id);
                } else {
                    // iOS _should_ be able to open Bluetooth settings via prefs:root=Bluetooth (tested works) or
                    // App-prefs:Bluetooth (according to most sites), but go figure, it doesn't work with React Native.
                    // Instead, it just opens the main settings page, or whatever page you have open in the Settings app
                    await Linking.openURL('App-prefs:Bluetooth');
                }
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
                let tempPeripheralData;
                // We aren't intending to leave, so try to reconnect
                for (let i = 0; i < RECONNECT_ATTEMPTS; i++) {
                    // Reconnect attempt
                    console.reportErrorsAsExceptions = false; // Don't show disconnect call on app
                    console.debug(`[onCarDisconnect][${i + 1}/${RECONNECT_ATTEMPTS}] Attempting to reconnect`)
                    tempPeripheralData = await connectPeripheral(peripheralId, setPeripherals, BleManager);
                    console.debug(`[onCarDisconnect][${i + 1}/${RECONNECT_ATTEMPTS}] Passed reconnection attempt with peripheral data ${tempPeripheralData}`)
                    console.reportErrorsAsExceptions = true; // Reenable exception alerts
                    if (tempPeripheralData) {
                        peripheralData = tempPeripheralData;
                        // Wait a second for the next onCarDisconnect call so that we don't unset reconnecting prematurely
                        await sleep(1000);
                        let subscribed = true;
                        for (const characteristicUUID of NOTIFICATION_CHARACTERISTIC_UUIDS) {
                            subscribed &&= await subscribeToNotification(peripheralId, characteristicUUID, ServiceUUIDs.RCController);
                            console.log("Subscribed to", characteristicUUID);
                        }
                        break;
                    }
                    await sleep(RECONNECT_DELAY_MS);
                }
                reconnecting = false;
                // If we failed to reconnect, go back to the selection screen
                if (!leaving && !tempPeripheralData) {
                    navigation.goBack();
                }
            }
        }
    }

    const handleUpdateValueForCharacteristic = (data) => {
        const characteristic = data.characteristic.toUpperCase();
        console.debug(`[handleUpdateValueForCharacteristic] received data from '${data.peripheral}' with characteristic='${characteristic}' and value='${data.value}'`);

        if (characteristic === CharacteristicUUIDs.GetItem) {
            // Accept new item if we don't currently have any
            setItemIndex((currIdx) => {
                console.debug(`[handleUpdateValueForCharacteristic] (in setter) Got item, curr index ${currIdx}, item ${data.value}`)
                return currIdx !== 0 ? currIdx : BleMessageToItemIndex[data.value];
            });
        } else if (characteristic === CharacteristicUUIDs.Lap) {
            console.debug("Got lap");
            if (data.value !== lap) {
                setLap(data.value);
            }
        }
    };

    useFocusEffect(
        useCallback(() => {
            // Override the built-in status bar back button default behavior (Android only)
            const onBackPress = () => {
                console.log("Pressed back")
                // true to disable going back; false to allow default behavior (going back)
                return true;
            };
            if (Platform.OS === 'android') {
                BackHandler.addEventListener('hardwareBackPress', onBackPress);

                // It's great, iOS expects only one BleManager.start call, whereas
                // Android expects it in every component in which BleManager is used
                try {
                    BleManager.start({ showAlert: false })
                              .then(() => console.debug('BleManager started.'))
                              .catch((error) => console.error('BleManager could not be started.', error));
                } catch (error) {
                    console.error('unexpected error starting BleManager.', error);
                    return;
                }
            }

            const bleListeners = [
                BleManagerEmitter.addListener('BleManagerDisconnectPeripheral', handleCarDisconnect),
                BleManagerEmitter.addListener('BleManagerDidUpdateValueForCharacteristic', handleUpdateValueForCharacteristic),
            ];
            handleAndroidPermissions();

            return () => {
                if (Platform.OS === 'android') {
                    BackHandler.removeEventListener('hardwareBackPress', onBackPress);
                }
                console.debug('[controller] controller unmounting. Removing listeners...');
                for (const listener of bleListeners) {
                    listener.remove();
                }
            }
        }, [])
    );

    return (
        <SafeAreaView style={containerStyles.pageContainer}>
            {/* TODO Show car name at the top of the screen */}
            <Button
                // TODO At the end of the game, have a modal at the end of each game to show results and allow going back
                title={"Back"}
                onPress={goBackToCarSelect}
            />
            <Controller
                peripheral={peripherals.get(peripheralData.id)}
                item={itemIndex}
                setItem={setItemIndex}
            />
            <Text>Lap {lap} / {NUM_LAPS}</Text>
        </SafeAreaView>
    );
}


export default ControllerScreen;
