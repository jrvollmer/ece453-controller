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

export async function connectPeripheral(peripheralId, setPeripherals, BleManager) {
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

            await BleManager.connect(peripheralId);
            console.debug(`[connectPeripheral][${peripheralId}] connected.`);
            setPeripherals(map => {
                let p = map.get(peripheralId);
                if (p) {
                    p.connecting = false;
                    p.connected = true;
                    return new Map(map.set(p.id, p));
                }
                return map;
            });
            // before retrieving services, it is often a good idea to let bonding & connection finish properly
            await sleep(900);
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

export const ServiceUUIDs = {
    RCController: '335244E1-792B-4B7C-AFC8-AB9B90F0E0BB',
}

export const CharacteristicUUIDs = {
    // Read/Write characteristics
    JoystickX: 'AB7E0F0E-8934-497A-89E7-81A447C929D2',
    JoystickY: '98FFEAA2-8CA2-4BAA-8FA3-210CB52FE787',
    UseItem: 'A36B4769-EA50-4219-BA37-B2099C860B8B',
    // Read/Notify characteristics
    GetItem: '7795A0A0-E497-4A32-9794-93FBE1FBCBB5',
    Lap: '9513A035-86F2-4A31-92F7-52F4A947D767',
}
