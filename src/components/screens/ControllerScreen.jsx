import React, {useCallback, useContext, useEffect, useMemo, useState} from 'react';
import {BackHandler, FlatList, Linking, Modal, NativeEventEmitter, NativeModules, Platform, Pressable, SafeAreaView, Text, View} from 'react-native';
import {useNavigation, useFocusEffect} from "@react-navigation/native";
import Icon from 'react-native-vector-icons/Ionicons';

import {buttonStyles, containerStyles} from "../../styles/DefaultStyles";
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
    BleMessageToItemIndex,
    GameEvents,
    NUM_LAPS,
} from "../../helpers/ble";
import {sleep} from "../../helpers/generic";


const RECONNECT_ATTEMPTS = 5;
const RECONNECT_DELAY_MS = 5000;
const BleManagerModule = NativeModules.BleManager;
const BleManagerEmitter = new NativeEventEmitter(BleManagerModule);
const LAP_TIME_UPDATE_PERIOD_MS = 10;

// Needed for accessing stateful information within event handlers
let statelessLap = 0;


function ControllerScreen(props) {
    let {
        peripheralData
    } = props.route.params;
    let leaving = false;
    let reconnecting = false;

    const navigation = useNavigation();
    const [startRaceModalVisible, setStartRaceModalVisible] = useState(true);
    const [menuModalVisible, setMenuModalVisible] = useState(false);
    const [peripherals, setPeripherals] = useContext(PeripheralsContext);
    const [itemIndex, setItemIndex] = useState(0);
    const [lap, setLap] = useState(0);
    const [lapStartTimes, setLapStartTimes] = useState([]);
    const [time, setTime] = useState(0);
    const [startCountdown, setStartCountdown] = useState('');

    // ------------------------------------------------------------------------------------------------------------
    // Helpers
    // ------------------------------------------------------------------------------------------------------------

    const startRace = async () => {
        statelessLap = 0;
        setLap(0);
        setLapStartTimes([]);
        setTime(0);

        setStartCountdown('3');
        await sleep(1000);
        setStartCountdown('2');
        await sleep(1000);
        setStartCountdown('1');
        await sleep(1000);
        setStartCountdown('Go!');
        await sleep(1000);

        await BleManager.writeWithoutResponse(
            peripheralData.id,
            ServiceUUIDs.RCController,
            CharacteristicUUIDs.GameEvent,
            [GameEvents.StartRace]
        ).then(() => {
            setLap(1);
            statelessLap = 1;
        });
    };

    const goBackToCarSelect = async () => {
        // Disconnect and go back to the car selection screen
        const p = peripherals.get(peripheralData.id);
        if (p && (p.connected || p.connecting)) {
            try {
                leaving = true;
                if (p.connected) { // TODO Verify. Added without testing
                    for (const c of NOTIFICATION_CHARACTERISTIC_UUIDS) {
                        await BleManager.stopNotification(peripheralData.id, ServiceUUIDs.RCController, c); // TODO This may be causing issues (or at least be unnecessary)
                    }
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
                // TODO
                // await sleep(500); // TODO Empirical - needs tuning though
                // if (Platform.OS === 'android') {
                //     await BleManager.removeBond(peripheralData.id); // TODO REMOVE and just use the old connect/disconnectt logic
                // } else {
                //     // iOS _should_ be able to open Bluetooth settings via prefs:root=Bluetooth (tested works) or
                //     // App-prefs:Bluetooth (according to most sites), but go figure, it doesn't work with React Native.
                //     // Instead, it just opens the main settings page, or whatever page you have open in the Settings app
                //     await Linking.openURL('App-prefs:Bluetooth'); // TODO REMOVE I think that this is messing with the disconnect logic
                // }
            }
            catch (error) {
                console.error(`[goBackToCarSelect][${peripheralData.id}] error when trying to disconnect device.`, error);
            }
        }

        navigation.goBack();
    };

    const formattedLapTime = (t) => {
        const ms = t % 1000;
        const sec = Math.floor((t / 1000) % 60);
        const min = Math.floor((t / 60000) % 60);
        const hr = Math.floor((t / 3600000) % 24); // TODO REMOVE I really hope we don't have hour long laps

        const msStr = ms < 10 ? `00${ms}` : (ms < 100 ? `0${ms}` : ms);
        const secStr = sec < 10 ? `0${sec}` : sec;
        const minStr = min < 10 ? `0${min}` : min;
        const hrStr = hr < 10 ? `0${hr}` : hr;

        return `${hrStr}:${minStr}:${secStr}.${msStr}`;
    };

    // ------------------------------------------------------------------------------------------------------------
    // Event handlers
    // ------------------------------------------------------------------------------------------------------------

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

                        // Send game resume message to car so that it can set lap count to 1 in case of MCU reset
                        // (0->1 doesn't increase controller lap count)
                        if ((statelessLap > 0) && (statelessLap <= NUM_LAPS)) {
                            await BleManager.writeWithoutResponse(
                                peripheralData.id,
                                ServiceUUIDs.RCController,
                                CharacteristicUUIDs.GameEvent,
                                [GameEvents.ResumeRace]
                            )
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
    };

    const handleUpdateValueForCharacteristic = (data) => {
        const characteristic = data.characteristic.toUpperCase();
        console.debug(`[handleUpdateValueForCharacteristic] received data from '${data.peripheral}' with characteristic='${characteristic}' and value='${data.value}'`);

        // Only accept laps and items when racing
        if ((statelessLap > 0) && (statelessLap <= NUM_LAPS)) {
            if (characteristic === CharacteristicUUIDs.GetItem) {
                // Accept new item if we don't currently have any
                setItemIndex((currIdx) => {
                    console.debug(`[handleUpdateValueForCharacteristic] (in setter) Got item, curr index ${currIdx}, item ${data.value}`)
                    return currIdx !== 0 ? currIdx : BleMessageToItemIndex[data.value];
                });
            } else if (characteristic === CharacteristicUUIDs.Lap) {
                if (data.value[0] > 1) {
                    setLap((l) => l + 1);
                    statelessLap++;
                }
                if (statelessLap > NUM_LAPS) {
                    // Race finished
                    BleManager.writeWithoutResponse(
                        peripheralData.id,
                        ServiceUUIDs.RCController,
                        CharacteristicUUIDs.GameEvent,
                        [GameEvents.EndRace]
                    )
                        .then(() => {
                            // Clear held items
                            setItemIndex(0);
                            // Open modal to start new race, if desired
                            setStartRaceModalVisible(true);
                        })
                }
            }
        }
    };

    // ------------------------------------------------------------------------------------------------------------
    // Hooks
    // ------------------------------------------------------------------------------------------------------------

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

                // TODO Disconnect from peripheral here
            }
        }, [])
    );

    useEffect(() => {
        // Set lap start time
        setLapStartTimes((startTimes) => {
            if (lap > 0) {
                startTimes.push(Date.now());
            }
            return startTimes;
        });
        return () => {};
    }, [lap]);

    useEffect(() => {
        const timer = setTimeout(() => {
            // No need to update lap times once race is over
            if (lap <= NUM_LAPS) {
                setTime(Date.now());
            }
        }, LAP_TIME_UPDATE_PERIOD_MS);

        return () => {
            clearTimeout(timer);
        };
    }, [time]);

    useEffect(() => {
        // Faux state initialization for stateless variable
        statelessLap = 0;
    }, []);

    // ------------------------------------------------------------------------------------------------------------
    // Child components
    // ------------------------------------------------------------------------------------------------------------

    const renderLapTime = ({ item }) => {
        const bgColor = item.l !== lap ? '#d0d0d0' : '#ffffff00';

        if (item.t < 0) {
            return <Text style={{fontSize: 16, paddingHorizontal: 5}}> </Text>;
        }

        return (
            <Text style={{backgroundColor: bgColor, fontSize: 16, paddingHorizontal: 5}}>
                Lap {item.l} - {formattedLapTime(item.t)}
            </Text>
        );
    };

    const LapTimes = useMemo(() => {
        let lapTimes = [];
        if (lapStartTimes.length === 0 || time === 0) {
            return (
                <View style={{flexDirection:"column", rowGap: 2, width: 175}}>
                    <Text style={{fontSize: 16, paddingHorizontal: 5}}>Lap 1 - 00:00:00.000</Text>
                    <Text style={{fontSize: 16, paddingHorizontal: 5}}> </Text>
                    <Text style={{fontSize: 16, paddingHorizontal: 5}}> </Text>
                </View>
            );
        } else {
            let lastLapStartTime = lapStartTimes[0];
            for (let i = 1; i < lapStartTimes.length; i++) {
                lapTimes.push({l: i, t: lapStartTimes[i] - lastLapStartTime});
                lastLapStartTime = lapStartTimes[i];
            }

            lapTimes.push({l: lapTimes.length + 1, t: time - lastLapStartTime});

            // Restrict to total number of laps in race
            // Reverse so that latest lap time is on top and earlist is on bottom
            lapTimes = lapTimes.slice(0, NUM_LAPS).reverse();

            // Add faux lap times for spacing purposes
            while (lapTimes.length < NUM_LAPS) {
                lapTimes.push({l: lapTimes.length + 1, t: -1});
            }
        }

        return (
            <View>
                <FlatList
                    data={lapTimes}
                    contentContainerStyle={{
                        flex: 0,
                        rowGap: 2,
                        width: 175,
                    }}
                    renderItem={renderLapTime}
                    keyExtractor={item => `lap-time-${item.l}`}
                />
            </View>
        );
    }, [lapStartTimes, time]);

    const FinalResults = () => {
        let lapTimes = [];
        let lastLapStartTime = lapStartTimes[0];
        for (let i = 1; i < lapStartTimes.length; i++) {
            lapTimes.push({l: i, t: lapStartTimes[i] - lastLapStartTime});
            lastLapStartTime = lapStartTimes[i];
        }

        // Restrict to total number of laps in race
        lapTimes = lapTimes.slice(0, NUM_LAPS);

        return (
            <View style={{flexGrow: 1}}>
                <FlatList
                    data={lapTimes}
                    contentContainerStyle={{
                        flex: 0,
                        rowGap: 5,
                    }}
                    renderItem={({ item }) =>
                        <View style={{flexDirection: "row", justifyContent: "space-between"}}>
                            <Text style={{ fontSize: 18}}>
                                Lap {item.l}
                            </Text>
                            <Text style={{ fontSize: 18, width: 115, textAlign: "justify"}}>
                                {formattedLapTime(item.t)}
                            </Text>
                        </View>
                    }
                    keyExtractor={item => `final-result-${item.l}`}
                />
            </View>
        );
    };


    return (
        <SafeAreaView style={containerStyles.pageContainer}>
            {/* Start Race Modal */}
            <Modal
                transparent={true}
                animationType="slide"
                supportedOrientations={['landscape']}
                visible={startRaceModalVisible}
                onRequestClose={() => {setStartRaceModalVisible(false)}}
                onDismiss={() => {setStartCountdown('')}}
            >
                <View
                    style={{
                        flex: 1,
                        justifyContent: "center",
                        alignItems: "center",
                    }}
                >
                    <View
                        style={{
                            margin: 20,
                            backgroundColor: "#ffffff",
                            borderRadius: 20,
                            paddingHorizontal: 35,
                            paddingTop: 35,
                            paddingBottom: 25,
                            alignItems: "center",
                            verticalAlign: "center",
                            shadowColor: "#000000",
                            shadowOpacity: 0.25,
                            shadowRadius: 4,
                            elevation: 5,
                        }}
                    >
                        {
                            startCountdown !== '' ?
                            <Text style={{textAlign: "center", marginBottom: 10, fontSize: 24}}>{startCountdown}</Text>
                            :
                            <View style={{flex: 0, flexDirection: "column"}}>
                                {
                                    lap <= NUM_LAPS ?
                                    // After choosing car
                                    <Text style={{textAlign: "center", marginBottom: 25, fontSize: 24}}>Ready to Race?</Text>
                                    :
                                    // After race ends
                                    <View style={{flexShrink: 1, flexDirection: "column", gap: 10}}>
                                        <Text style={{textAlign: "center", marginBottom: 10, fontSize: 24}}>Results</Text>
                                        {FinalResults()}
                                        <Text style={{textAlign: "center", marginBottom: 15, fontSize: 18}}>New Race?</Text>
                                    </View>
                                }
                                <View style={{flexDirection: "row", gap: 15}}>
                                    <Pressable
                                        style={{
                                            backgroundColor: "#fc0000",
                                            width: 125,
                                            height: 50,
                                            borderRadius: 25,
                                            justifyContent: "center",
                                            alignItems: "center",
                                        }}
                                        onPress={async () => {
                                            setStartRaceModalVisible(false);
                                            await goBackToCarSelect();
                                        }}
                                    >
                                        <Text 
                                            style={{
                                                fontWeight: "bold",
                                                color: buttonStyles.text.released.color,
                                                textAlign: "center",
                                            }}
                                        >
                                            Choose New Car
                                        </Text>
                                    </Pressable>
                                    <Pressable
                                        style={{
                                            backgroundColor: peripherals.get(peripheralData.id).connected ? "#00dd00" : "#88dd88",
                                            width: 100,
                                            height: 50,
                                            borderRadius: 25,
                                            justifyContent: "center",
                                            alignItems: "center",
                                        }}
                                        onPress={async () => {
                                            await startRace();
                                            setStartRaceModalVisible(false);
                                        }}
                                        disabled={!peripherals.get(peripheralData.id).connected}
                                    >
                                        <Text 
                                            style={{
                                                fontWeight: "bold",
                                                color: buttonStyles.text.released.color,
                                                textAlign: "center",
                                            }}
                                        >
                                            Start Race
                                        </Text>
                                    </Pressable>
                                </View>
                            </View>
                        }
                    </View>
                </View>
            </Modal>

            {/* Menu Modal */}
            <Modal
                transparent={true}
                animationType="none"
                supportedOrientations={['landscape']}
                visible={menuModalVisible}
                onRequestClose={async () => {
                    setMenuModalVisible(false);
                }}
            >
                <View
                    style={{
                        flex: 1,
                        justifyContent: "center",
                        alignItems: "center",
                    }}
                >
                    <View
                        style={{
                            margin: 20,
                            backgroundColor: "#ffffff",
                            borderRadius: 20,
                            paddingHorizontal: 35,
                            paddingTop: 35,
                            paddingBottom: 25,
                            alignItems: "center",
                            verticalAlign: "center",
                            shadowColor: "#000000",
                            shadowOpacity: 0.25,
                            shadowRadius: 4,
                            elevation: 5,
                        }}
                    >
                        <Text style={{textAlign: "center", marginBottom: 25, fontSize: 24}}>Quit Race?</Text>
                        <View style={{flexDirection: "row", gap: 15}}>
                            <Pressable
                                style={{
                                    backgroundColor: "#fc0000",
                                    width: 100,
                                    height: 50,
                                    borderRadius: 25,
                                    justifyContent: "center",
                                    alignItems: "center",
                                }}
                                onPress={async () => {
                                    setMenuModalVisible(false);
                                    await goBackToCarSelect();
                                }}
                            >
                                <Text 
                                    style={{
                                        fontWeight: "bold",
                                        color: buttonStyles.text.released.color,
                                        textAlign: "center",
                                    }}
                                >
                                    Quit
                                </Text>
                            </Pressable>
                            <Pressable
                                style={{
                                    backgroundColor: "#00dd00",
                                    width: 100,
                                    height: 50,
                                    borderRadius: 25,
                                    justifyContent: "center",
                                    alignItems: "center",
                                }}
                                onPress={() => setMenuModalVisible(false)}
                            >
                                <Text 
                                    style={{
                                        fontWeight: "bold",
                                        color: buttonStyles.text.released.color,
                                        textAlign: "center",
                                    }}
                                >
                                    Resume
                                </Text>
                            </Pressable>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Controller */}
            <View style={{
                flex: 0,
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                paddingTop: 10,
            }}>
                <Pressable onPress={() => {setMenuModalVisible(true)}}>
                    <Icon name="menu" size={48} color="black" />
                </Pressable>
                <Text
                    style={{
                        flexGrow: 1,
                        textAlign: "center",
                        fontSize: 32,
                        fontFamily: "serif",
                        fontWeight: "bold",
                        letterSpacing: 1,
                        color: peripherals.get(peripheralData.id).connected ? "#000" : "#00000040"
                    }}
                >
                    {peripheralData.name}
                </Text>
                <View
                    style={{
                        flexDirection: "row",
                        flexShrink: 1,
                        gap: 25,
                    }}
                >
                    {
                        lap <= NUM_LAPS ?
                        <Text style={{fontSize: 16, textAlign: "right"}}>Lap {lap} / {NUM_LAPS}</Text>
                        :
                        <Text style={{fontSize: 16, textAlign: "right"}}>Finished</Text>
                    }
                    {LapTimes}
                </View>
            </View>

            <Controller
                peripheral={peripherals.get(peripheralData.id)}
                lap={lap}
                item={itemIndex}
                setItem={setItemIndex}
            />
        </SafeAreaView>
    );
}


export default ControllerScreen;
