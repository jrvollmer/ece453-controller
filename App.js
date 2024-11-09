// Keep this here!
import 'react-native-gesture-handler';

import ScreenNav from './src/components/ScreenNav';


export default function App() {
  return <ScreenNav/>
}

// TODO REMOVE
// import React from 'react';
// import { NavigationContainer } from '@react-navigation/native';
// import { createNativeStackNavigator } from '@react-navigation/native-stack';
// import ScanDevicesScreen from './src/components/ble-manager/ScanDevicesScreen';
// import PeripheralDetailsScreen from './src/components/ble-manager/PeripheralDetailsScreen';
// const Stack = createNativeStackNavigator();
//
//
// export default function App() {
//     return (
//         <NavigationContainer>
//             <Stack.Navigator id="toplvl-stacknav">
//                 <Stack.Screen name="ScanDevices" component={ScanDevicesScreen} /* TODO Replace this with SelectCar component. This should be the first screen, accessible via an "end game"/"disconnect" button  from Controller (or ig the button would just pop Controller from the View stack) */ />
//                 <Stack.Screen name="PeripheralDetails" component={PeripheralDetailsScreen} /* TODO Replace this with Controller component. This should be the second screen, accessible after user hits a "confirm pair/connect" button */ />
//             </Stack.Navigator>
//         </NavigationContainer>
//     );
// }
