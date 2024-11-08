/*
// Keep this here!
import 'react-native-gesture-handler';

import Controller from './src/components/Controller';

// import { AppRegistry } from 'react-native';
// import App from "react-native-ble-manager/example/App";


export default function App() {
  return (
    <>
      <Controller/>
    </>
  );
}
// Register the actual entrypoint (BLEApp in the BLE app) with the actual BLE app
// AppRegistry.registerComponent("BLEApp", () => App);
*/
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import ScanDevicesScreen from './src/components/ble-manager/ScanDevicesScreen';
import PeripheralDetailsScreen from './src/components/ble-manager/PeripheralDetailsScreen';
const Stack = createNativeStackNavigator();


export default function App() {
    return (<NavigationContainer>
            <Stack.Navigator id="toplvl-stacknav">
                <Stack.Screen name="ScanDevices" component={ScanDevicesScreen}/>
                <Stack.Screen name="PeripheralDetails" component={PeripheralDetailsScreen}/>
            </Stack.Navigator>
        </NavigationContainer>);
};
