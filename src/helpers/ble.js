import {PermissionsAndroid, Platform} from "react-native";
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
    try {
        if (peripheralId) {
            setPeripherals(map => {
                let p = map.get(peripheralId);
                if (p) {
                    p.connecting = true;
                    return new Map(map.set(p.id, p));
                }
                return map;
            });
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
