// Keep this here!
import 'react-native-gesture-handler';

import {useState, useEffect} from "react";
import BleManager from "react-native-ble-manager";

import ScreenNav from './src/components/ScreenNav';
import PeripheralsContext from "./src/contexts/BlePeripherals";


export default function App() {
    const [peripherals, setPeripherals] = useState(new Map());

    // iOS you bring me pain: https://github.com/innoveit/react-native-ble-manager/issues/97#issuecomment-300717328
    useEffect(() => {
        try {
            BleManager.start({ showAlert: false })
                      .then(() => console.debug('BleManager started.'))
                      .catch((error) => console.error('BleManager could not be started.', error));
        }
        catch (error) {
            console.error('unexpected error starting BleManager.', error);
            return;
        }
        return () => {}; // No cleanup to do since we don't have any specific peripherals yet
    }, []);

    return (
        <PeripheralsContext.Provider value={[peripherals, setPeripherals]}>
            <ScreenNav/>
        </PeripheralsContext.Provider>
    );
}
