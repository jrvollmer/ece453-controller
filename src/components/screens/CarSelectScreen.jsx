import React, {useContext, useState} from "react";
import {
    FlatList,
    NativeEventEmitter,
    NativeModules,
    Platform,
    Pressable,
    SafeAreaView,
    Text,
    TouchableHighlight,
    View
} from 'react-native';
import {useFocusEffect, useNavigation} from "@react-navigation/native";

import {scanStyles} from "../../styles/DefaultStyles";
import BleManager, {BleScanCallbackType, BleScanMatchMode, BleScanMode, BleState} from "react-native-ble-manager";
import {
    connectPeripheral,
    handleAndroidPermissions,
    subscribeToNotification,
    ServiceUUIDs,
    NOTIFICATION_CHARACTERISTIC_UUIDS,
    CharacteristicUUIDs,
    GameEvents,
} from "../../helpers/ble";
import PeripheralsContext from "../../contexts/BlePeripherals";


// Scanning constants
const SECONDS_TO_SCAN_FOR = 1;
const ALLOW_DUPLICATES = true;
const SERVICE_UUIDS = [ServiceUUIDs.RCController];

const BleManagerModule = NativeModules.BleManager;
const BleManagerEmitter = new NativeEventEmitter(BleManagerModule);


function CarSelectScreen(props) {
    const navigation = useNavigation();
    const [isScanning, setIsScanning] = useState(false);
    const [peripherals, setPeripherals] = useContext(PeripheralsContext);

    // ------------------------------------------------------------------------------------------------------------
    // Press callbacks and associated helpers
    // ------------------------------------------------------------------------------------------------------------

    const startScan = () => {
        if (!isScanning) {
            // Reset found peripherals before scan
            setPeripherals(new Map());
            try {
                console.debug('[startScan] starting scan...');
                setIsScanning(true);
                BleManager.scan(SERVICE_UUIDS, SECONDS_TO_SCAN_FOR, ALLOW_DUPLICATES, {
                    matchMode: BleScanMatchMode.Sticky,
                    scanMode: BleScanMode.LowLatency,
                    callbackType: BleScanCallbackType.AllMatches,
                })
                    .then(() => {
                        console.debug('[startScan] scan promise returned successfully.');
                    })
                    .catch((err) => {
                        console.error('[startScan] ble scan returned in error', err);
                    });
            }
            catch (error) {
                console.error('[startScan] ble scan error thrown', error);
            }
        }
    };

    const connectAndNavigate = async (peripheral, advName = null) => {
        const peripheralData = await connectPeripheral(peripheral.id, setPeripherals, BleManager, advName);

        // Need to subscribe to notifications
        let subscribed = true;
        for (const characteristicUUID of NOTIFICATION_CHARACTERISTIC_UUIDS) {
            subscribed &&= await subscribeToNotification(peripheral.id, characteristicUUID, SERVICE_UUIDS[0]);
        }

        // Reset lap count when intially connecting to the car
        await BleManager.writeWithoutResponse(
            peripheralData.id,
            ServiceUUIDs.RCController,
            CharacteristicUUIDs.GameEvent,
            [GameEvents.StartRace]
        );

        if (peripheralData && subscribed) {
            navigation.navigate('Controller', {
                peripheralData: peripheralData
            });
        } else {
            console.warn("[connectAndNavigate] Failed to connect")
        }
    };

    // ------------------------------------------------------------------------------------------------------------
    // Event handlers
    // ------------------------------------------------------------------------------------------------------------
    const handleStopScan = () => {
        setIsScanning(false);
        console.debug('[handleStopScan] scan is stopped.');
    };

    const handleDisconnectedPeripheral = (event) => {
        console.debug(`[handleDisconnectedPeripheral][${event.peripheral}] disconnected.`);
        setPeripherals(map => {
            let p = map.get(event.peripheral);
            if (p) {
                p.connecting = false;
                p.connected = false;
                return new Map(map.set(event.peripheral, p));
            }
            return map;
        });
    };

    const handleConnectPeripheral = (event) => {
        console.log(`[handleConnectPeripheral][${event.peripheral}] connected.`);
    };

    const handleDiscoverPeripheral = (peripheral) => {
        console.debug('[handleDiscoverPeripheral] New BLE peripheral:', peripheral);
        // Cars need names
        if (!peripheral.name) {
            console.debug('[handleDiscoverPeripheral] BLE peripheral has no name')
            return;
        }
        setPeripherals(map => {return new Map(map.set(peripheral.id, peripheral))});
    };

    useFocusEffect(
        React.useCallback(() => {
            // It's great, iOS expects only one BleManager.start call, whereas
            // Android expects it in every component in which BleManager is used
            if (Platform.OS === 'android') {
                try {
                    BleManager.start({ showAlert: false })
                              .then(() => console.debug('BleManager started.'))
                              .catch((error) => console.error('BleManager could not be started.', error));
                } catch (error) {
                    console.error('unexpected error starting BleManager.', error);
                    return;
                }
            }

            console.debug('Adding listeners for car select')
            const listeners = [
                BleManagerEmitter.addListener('BleManagerDiscoverPeripheral', handleDiscoverPeripheral),
                BleManagerEmitter.addListener('BleManagerStopScan', handleStopScan),
                BleManagerEmitter.addListener('BleManagerDisconnectPeripheral', handleDisconnectedPeripheral),
                BleManagerEmitter.addListener('BleManagerConnectPeripheral', handleConnectPeripheral),
                BleManagerEmitter.addListener('BleManagerDidUpdateState', async (args) => {
                    console.log("Updated state to", args.state);
                    // Scan for cars once the BLE manager is ready
                    if (args.state === BleState.On) {
                        startScan();
                    }
                }),
            ];
            handleAndroidPermissions();

            return () => {
                console.debug('[app] main component unmounting. Removing listeners...');
                for (const listener of listeners) {
                    listener.remove();
                }
            };
            // eslint-disable-next-line react-hooks/exhaustive-deps
        }, [])
    );


    const renderItem = ({ item }) => {
        const backgroundColor = item.connected ? '#d30a0a' : '#fc0000';
        return (
            <TouchableHighlight onPress={() => connectAndNavigate(item, item?.advertising?.localName)}>
                <View style={[scanStyles.row, { backgroundColor }]}>
                    <Text style={scanStyles.peripheralName}>
                        {/* Cars will advertise their complete names as their local advertising names */}
                        {item?.advertising?.localName}
                    </Text>
                </View>
            </TouchableHighlight>
        );
    };


    return (
        <SafeAreaView style={scanStyles.body}>
            <Pressable style={scanStyles.scanButton} onPress={startScan}>
                <Text style={scanStyles.scanButtonText}>
                    {isScanning ? 'Searching...' : 'Find Cars'}
                </Text>
            </Pressable>

            {
                Array.from(peripherals.values()).length === 0 ?
                    <View style={scanStyles.row}>
                        <Text style={scanStyles.noPeripherals}>
                            No cars found. Try searching again
                        </Text>
                    </View>
                    :
                    <FlatList
                        data={Array.from(peripherals.values())}
                        contentContainerStyle={{ rowGap: 12 }}
                        renderItem={renderItem}
                        keyExtractor={item => item.id}
                    />
            }
        </SafeAreaView>
    );
}


export default CarSelectScreen;
