import React, {useContext, useState} from "react";
import {
    FlatList,
    NativeEventEmitter,
    NativeModules,
    Platform,
    Pressable,
    SafeAreaView,
    StyleSheet,
    Text,
    TouchableHighlight,
    View
} from 'react-native';
import {useFocusEffect, useNavigation} from "@react-navigation/native";
import {Colors} from "react-native/Libraries/NewAppScreen";

import {containerStyles} from "../../styles/DefaultStyles";
import BleManager, {BleScanCallbackType, BleScanMatchMode, BleScanMode, BleState} from "react-native-ble-manager";
import {
    connectPeripheral,
    handleAndroidPermissions,
    subscribeToNotification,
    CharacteristicUUIDs,
    ServiceUUIDs
} from "../../helpers/ble";
import PeripheralsContext from "../../contexts/BlePeripherals";


// Scanning constants
const SECONDS_TO_SCAN_FOR = 3;
const ALLOW_DUPLICATES = true;
const SERVICE_UUIDS = [ServiceUUIDs.RCController.toUpperCase()];
const NOTIFICATION_CHARACTERISTIC_UUIDS = [
    CharacteristicUUIDs.GetItem.toUpperCase(),
    CharacteristicUUIDs.Lap.toUpperCase(),
];

const BleManagerModule = NativeModules.BleManager;
const BleManagerEmitter = new NativeEventEmitter(BleManagerModule);


function CarSelectScreen(props) {
    const navigation = useNavigation();
    const [isScanning, setIsScanning] = useState(false);
    const [peripherals, setPeripherals] = useContext(PeripheralsContext);

    // ------------------------------------------------------------------------------------------------------------
    // Press callbacks and associated helpers
    // ------------------------------------------------------------------------------------------------------------
    const handleBleOnLoad = async () => {
        // TODO
        const connectedPeripherals = await BleManager.getConnectedPeripherals().then((p) => {
            console.log("periph:", p);
            return p;
        }); // TODO [ServiceUUIDs.RCController]);
        console.log("Connected peripherals at start:", connectedPeripherals);
        if (connectedPeripherals.length > 0) {
            navigation.navigate('Controller', {
                peripheralData: peripheralData
            });
        } else {
            startScan();
        }
    }

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

    const connectAndNavigate = async (peripheral) => {
        const peripheralData = await connectPeripheral(peripheral.id, setPeripherals, BleManager, BleManagerEmitter);
        let subscribed = true;
        for (const characteristicUUID of NOTIFICATION_CHARACTERISTIC_UUIDS) {
            subscribed &&= await subscribeToNotification(peripheral.id, characteristicUUID, SERVICE_UUIDS[0]);
        }
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
            // TODO
            // try {
            //     BleManager.start({ showAlert: false })
            //         .then(() => console.debug('BleManager started.'))
            //         .catch((error) => console.error('BleManager could not be started.', error));
            // }
            // catch (error) {
            //     console.error('unexpected error starting BleManager.', error);
            //     return;
            // }
            console.debug('Adding listeners for car select')
            const listeners = [
                BleManagerEmitter.addListener('BleManagerDiscoverPeripheral', handleDiscoverPeripheral),
                BleManagerEmitter.addListener('BleManagerStopScan', handleStopScan),
                BleManagerEmitter.addListener('BleManagerDisconnectPeripheral', handleDisconnectedPeripheral),
                BleManagerEmitter.addListener('BleManagerConnectPeripheral', handleConnectPeripheral),
                BleManagerEmitter.addListener('BleManagerDidUpdateState', async (args) => {
                    console.log("Updated state to", args.state)
                    if (args.state === BleState.On) {
                        console.log("we're on baby");
                        const connectedPeripherals = await BleManager.getConnectedPeripherals().then((p) => {
                            console.log("periph 2:", p);
                            return p;
                        }); // TODO [ServiceUUIDs.RCController]);
                        console.log("Connected peripherals at start 2:", connectedPeripherals);

                    }
                }),
            ];
            handleAndroidPermissions();

            // TODO Use BleManager.checkState() to check if Bluetooth is enabled (and block further actions)
            // TODO For android (Platform.OS === 'android'), I can just use BleManager.enableBluetooth()
            // TODO See this for a good example app with android and ios: https://medium.com/@varunkukade999/part-1-bluetooth-low-energy-ble-in-react-native-694758908dc2

            handleBleOnLoad();
            // TODO startScan();
            console.debug('[useFocusEffect] Past startScan call');

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
        const backgroundColor = item.connected ? '#e30909' : Colors.white;
        return (
            <TouchableHighlight underlayColor="#0082FC" onPress={() => connectAndNavigate(item)}>
                <View style={[styles.row, { backgroundColor }]}>
                    <Text style={styles.peripheralName}>
                        {/* completeLocalName (item.name) & shortAdvertisingName (advertising.localName) may not always be the same */}
                        {item.name} - {item?.advertising?.localName}
                        {item.connecting && ' - Connecting...'}
                    </Text>
                    <Text style={styles.rssi}>RSSI: {item.rssi}</Text>
                    <Text style={styles.peripheralId}>{item.id}</Text>
                </View>
            </TouchableHighlight>
        );
    };


    return (
        <SafeAreaView style={styles.body}>
            <Pressable style={styles.scanButton} onPress={startScan}>
                <Text style={styles.scanButtonText}>
                    {isScanning ? 'Searching...' : 'Find Cars'}
                </Text>
            </Pressable>

            {
                Array.from(peripherals.values()).length === 0 ?
                    <View style={styles.row}>
                        <Text style={styles.noPeripherals}>
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

// TODO REMOVE This was just copied to avoid the headache of restyling
const boxShadow = {
    shadowColor: '#000',
    shadowOffset: {
        width: 0,
        height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
};

const styles = StyleSheet.create({
    engine: {
        position: 'absolute',
        right: 10,
        bottom: 0,
        color: Colors.black,
    },
    scanButton: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        paddingHorizontal: 16,
        backgroundColor: '#8a0a0a',
        margin: 10,
        borderRadius: 12,
        ...boxShadow,
    },
    scanButtonText: {
        fontSize: 16,
        letterSpacing: 0.25,
        color: Colors.white,
    },
    body: {
        backgroundColor: '#fc0000',
        flex: 1,
    },
    sectionContainer: {
        marginTop: 32,
        paddingHorizontal: 24,
    },
    sectionTitle: {
        fontSize: 24,
        fontWeight: '600',
        color: Colors.black,
    },
    sectionDescription: {
        marginTop: 8,
        fontSize: 18,
        fontWeight: '400',
        color: Colors.dark,
    },
    highlight: {
        fontWeight: '700',
    },
    footer: {
        color: Colors.dark,
        fontSize: 12,
        fontWeight: '600',
        padding: 4,
        paddingRight: 12,
        textAlign: 'right',
    },
    peripheralName: {
        fontSize: 16,
        textAlign: 'center',
        padding: 10,
    },
    rssi: {
        fontSize: 12,
        textAlign: 'center',
        padding: 2,
    },
    peripheralId: {
        fontSize: 12,
        textAlign: 'center',
        padding: 2,
        paddingBottom: 20,
    },
    row: {
        marginLeft: 10,
        marginRight: 10,
        borderRadius: 20,
        ...boxShadow,
    },
    noPeripherals: {
        margin: 10,
        textAlign: 'center',
        color: Colors.white,
    },
});


export default CarSelectScreen;
