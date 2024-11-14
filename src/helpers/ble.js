import {PermissionsAndroid, Platform} from "react-native";
import BleManager from 'react-native-ble-manager';

import {sleep} from "./generic";


export function handleAndroidPermissions() {
    if (Platform.OS === 'android' && Platform.Version >= 31) {
        PermissionsAndroid.requestMultiple([
            PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
            PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
        ]).then(result => {
            if (result) {
                console.debug('[handleAndroidPermissions] User accepts runtime permissions android 12+');
            }
            else {
                console.error('[handleAndroidPermissions] User refuses runtime permissions android 12+');
            }
        });
    }
    else if (Platform.OS === 'android' && Platform.Version >= 23) {
        PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION).then(checkResult => {
            if (checkResult) {
                console.debug('[handleAndroidPermissions] runtime permission Android <12 already OK');
            }
            else {
                PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION).then(requestResult => {
                    if (requestResult) {
                        console.debug('[handleAndroidPermissions] User accepts runtime permission android <12');
                    }
                    else {
                        console.error('[handleAndroidPermissions] User refuses runtime permission android <12');
                    }
                });
            }
        });
    }
}

export async function connectPeripheral(peripheralId, setPeripherals, BleManager, bleManagerEmitter) {
    console.log("Connecting");
    try {
        if (peripheralId) {
            console.log("Peripheral has id:", peripheralId);
            setPeripherals(map => {
                let p = map.get(peripheralId);
                if (p) {
                    p.connecting = true;
                    return new Map(map.set(p.id, p));
                }
                return map;
            });
            console.log("Set peripherals");

            let connected = false; // TODO await connect(peripheralId, BleManager, bleManagerEmitter); // TODO

            //if not connected already, set the timer such that after some time connection process automatically stops if its failed to connect.
            failedToConnectTimer = setTimeout(() => {
                console.log("Failed to connect - timeout");
                return false;
            }, 30000); // TODO

            await BleManager.connect(peripheralId).then(() => {
                //if connected successfully, stop the previous set timer.
                connected = true;
                clearTimeout(failedToConnectTimer);
            });

            // TODO await BleManager.connect(peripheralId);
            console.debug(`[connectPeripheral][${peripheralId}] connection attempted.`);
            setPeripherals(map => {
                let p = map.get(peripheralId);
                if (p) {
                    p.connecting = false;
                    p.connected = true;
                    return new Map(map.set(p.id, p));
                }
                return map;
            });
            console.debug(`[connectPeripheral][${peripheralId}] Set peripherals.`);
            // before retrieving services, it is often a good idea to let bonding & connection finish properly
            await sleep(900);

            if (!connected) { // TODO
                console.log("Not connected (connectPeripheral)")
                return;
            }
            console.debug(`[connectPeripheral][${peripheralId}] connected.`);
            /* Test read current RSSI value, retrieve services first */
            const peripheralData = await BleManager.retrieveServices(peripheralId);
            console.debug(`[connectPeripheral][${peripheralId}] retrieved peripheral services`, peripheralData);
            setPeripherals(map => {
                let p = map.get(peripheralId);
                if (p) {
                    return new Map(map.set(p.id, p));
                }
                return map;
            });
            const rssi = await BleManager.readRSSI(peripheralId);
            console.debug(`[connectPeripheral][${peripheralId}] retrieved current RSSI value: ${rssi}.`);
            if (peripheralData.characteristics) {
                for (let characteristic of peripheralData.characteristics) {
                    if (characteristic.descriptors) {
                        for (let descriptor of characteristic.descriptors) {
                            try {
                                let data = await BleManager.readDescriptor(peripheralId, characteristic.service, characteristic.characteristic, descriptor.uuid);
                                console.debug(`[connectPeripheral][${peripheralId}] ${characteristic.service} ${characteristic.characteristic} ${descriptor.uuid} descriptor read as:`, data);
                            }
                            catch (error) {
                                console.error(`[connectPeripheral][${peripheralId}] failed to retrieve descriptor ${descriptor} for characteristic ${characteristic}:`, error);
                            }
                        }
                    }
                }
            }
            setPeripherals(map => {
                let p = map.get(peripheralId);
                if (p) {
                    p.rssi = rssi;
                    return new Map(map.set(p.id, p));
                }
                return map;
            });
            return peripheralData;
        }
    } catch (error) {
        console.error(`[connectPeripheral][${peripheralId}] connectPeripheral error`, error);
    }
}

// Credit: https://medium.com/@varunkukade999/part-3-bluetooth-low-energy-ble-in-react-native-07e30995c169
export async function subscribeToNotification(deviceId, characteristicUUID, serviceUUID) {
    const connected = await BleManager.isPeripheralConnected(deviceId, [serviceUUID]);
    if (!connected) {
        console.warn("[subscribeToNotification] Not connected")
        return false;
    }

    // Get the services and characteristics information for the connected hardware device.
    const peripheralInformation = await BleManager.retrieveServices(deviceId);
    // Check for supported services and characteristics from device info
    const deviceSupportedServices = (peripheralInformation.services || []).map(item => item?.uuid?.toUpperCase());
    const deviceSupportedCharacteristics = (peripheralInformation.characteristics || []).map(_char =>
        _char.characteristic.toUpperCase(),
    );
    if (
        !deviceSupportedServices.includes(serviceUUID) ||
        !deviceSupportedCharacteristics.includes(characteristicUUID)
    ) {
        // Required service ID and characteristic ID are not supported by hardware
        await BleManager.disconnect(deviceId);
        console.warn('Connected device does not have required service and characteristic');
        console.warn('service', serviceUUID, "not in", deviceSupportedServices);
        console.warn('characteristic', characteristicUUID, "not in", deviceSupportedCharacteristics);
        return false;
    }

    return await BleManager
        .startNotification(deviceId, serviceUUID, characteristicUUID)
        .then(response => {
            console.debug('Started notification successfully on ', characteristicUUID);
            return true;
        })
        .catch(async () => {
            await BleManager.disconnect(deviceId);
            console.warn('Failed to start notification on required service and characteristic');
            return false;
        });
}

export const ServiceUUIDs = (
    (Platform.OS === 'android') ?
    {
        RCController: '335244E1-792B-4B7C-AFC8-AB9B90F0E0BB', // TODO.toLowerCase(),
    }
    :
    {
        RCController: '335244E1-792B-4B7C-AFC8-AB9B90F0E0BB'// TODO .toLowerCase(), // TODO.toLowerCase(),
    }
);

export const CharacteristicUUIDs = (
    (Platform.OS === 'android') ?
    {
        // Read/Write characteristics
        JoystickX: 'AB7E0F0E-8934-497A-89E7-81A447C929D2',
        JoystickY: '98FFEAA2-8CA2-4BAA-8FA3-210CB52FE787',
        UseItem: 'A36B4769-EA50-4219-BA37-B2099C860B8B',
        // Read/Notify characteristics
        GetItem: '7795A0A0-E497-4A32-9794-93FBE1FBCBB5',
        Lap: '9513A035-86F2-4A31-92F7-52F4A947D767',
    }
    :
    {
        // Read/Write characteristics
        JoystickX: 'AB7E0F0E-8934-497A-89E7-81A447C929D2',// TODO .toLowerCase(),
        JoystickY: '98FFEAA2-8CA2-4BAA-8FA3-210CB52FE787',// TODO .toLowerCase(),
        UseItem: 'A36B4769-EA50-4219-BA37-B2099C860B8B',// TODO .toLowerCase(),
        // Read/Notify characteristics
        GetItem: '7795A0A0-E497-4A32-9794-93FBE1FBCBB5',// TODO .toLowerCase(),
        Lap: '9513A035-86F2-4A31-92F7-52F4A947D767',// TODO .toLowerCase(),
    }
);
    


// 7795A0A0-E497-4A32-9794-93FBE1FBCBB5
// 7795A0A0-E497-4A32-9794-93FBE1FBCBB5


/*
// import BleManager, { BleState, Peripheral }  from 'react-native-ble-manager';
import { BleState }  from 'react-native-ble-manager';
// import { NativeModules, NativeEventEmitter, EmitterSubscription } from "react-native";

// const BleManagerModule = NativeModules.BleManager;
// const bleManagerEmitter = new NativeEventEmitter(BleManagerModule);

const MAX_CONNECT_WAITING_PERIOD = 30000; // TODO Was 30000
const serviceReadinIdentifier = '';
const charNotificationIdentifier = '';
// const connectedDeviceId = useRef("")

export const enableBluetooth = async () => {
    if (await BleManager.checkState() === BleState.Off) {
        // before connecting try to enable bluetooth if not enabled already
        if (Platform.OS === 'android') {
          try {
            await BleManager.enableBluetooth().then(() => console.info('Bluetooth is enabled'));
            //go ahead to connect to the device.
            return true;
          } catch (e) {
            console.error("Bluetooth is disabled");
            //prompt user to enable bluetooth manually and also give them the option to navigate to bluetooth settings directly.
            return false;
          }
        } else if(Platform.OS === 'ios') {
          //For ios, if bluetooth is disabled, don't let user connect to device.
          console.log("Actually off")
          return false;
        }
    } else {
          console.log("Bluetooth is enabled");
          return true;
    }
}

const isDeviceConnected = async (deviceId) => {
    await BleManager.isPeripheralConnected(deviceId, [ServiceUUIDs.RCController]);// TODO await BleManager.isPeripheralConnected(deviceId, []);
    return true; // TODO
}

export const connect = async (deviceId, BleManager, bleManagerEmitter) => {
    return new Promise(async (resolve, reject) => {

        let failedToConnectTimer;
         
        //For android always ensure to enable the bluetooth again before connecting.
        const isEnabled = await enableBluetooth();
        if(!isEnabled) {
            //if blutooth is somehow off, first prompt user to turn on the bluetooth
            console.log("Bluetooth is off");
            return resolve(false);
        }

        //before connecting, ensure if app is already connected to device or not.
        let isConnected = await isDeviceConnected(deviceId);

        if (!isConnected) {

            //if not connected already, set the timer such that after some time connection process automatically stops if its failed to connect.
            failedToConnectTimer = setTimeout(() => {
                console.log("Failed to connect - timeout");
                return resolve(false);
            }, MAX_CONNECT_WAITING_PERIOD);

            await BleManager.connect(deviceId).then(() => {
                //if connected successfully, stop the previous set timer.
                clearTimeout(failedToConnectTimer);
            });
            isConnected = await isDeviceConnected(deviceId);
        }

        if (!isConnected) {
            //now if its not connected somehow, just close the process.
            console.log("Failed to connect - just failed ig");
            return resolve(false);
        } else {
            //Connection success
            // connectedDeviceId.current = deviceId

            console.log("Says it's connected");

            // //get the services and characteristics information for the connected hardware device.
            const peripheralInformation = await BleManager.retrieveServices(deviceId);
    
            console.log("Got services here ig")
            // //
            // // Check for supported services and characteristics from device info
            // //
            // const deviceSupportedServices = (peripheralInformation.services || []).map(item => item?.uuid?.toUpperCase());
            // const deviceSupportedCharacteristics = (peripheralInformation.characteristics || []).map(_char =>
            //     _char.characteristic.toUpperCase(),
            // );
            // if (
            //     !deviceSupportedServices.includes(serviceReadinIdentifier) ||
            //     !deviceSupportedCharacteristics.includes(charNotificationIdentifier)
            // ) { 
            //     //if required service ID and Char ID is not supported by hardware, close the connection.
            //     isConnected = false;
            //     await BleManager.disconnect(connectedDeviceId.current);
            //     return reject('Connected device does not have required service and characteristic.');
            // }

            // await BleManager
            //     .startNotification(deviceId, serviceReadinIdentifier, charNotificationIdentifier)
            //     .then(response => {
            //         console.log('Started notification successfully on ', charNotificationIdentifier);
            //     })
            //     .catch(async () => {
            //         isConnected = false;
            //         await BleManager.disconnect(connectedDeviceId.current);
            //         return reject('Failed to start notification on required service and characteristic.');
            //     });

            console.log("Connection success");

            let disconnectListener = bleManagerEmitter.addListener('BleManagerDisconnectPeripheral', async () => {
                //addd the code to execute after hardware disconnects.
                // TODO
                // if(connectedDeviceId.current){
                //     await BleManager.disconnect(connectedDeviceId.current);
                // }
                if(deviceId){
                    await BleManager.disconnect(deviceId);
                }
                disconnectListener.remove();
            });

            return resolve(isConnected);
        }
    });
  }*/