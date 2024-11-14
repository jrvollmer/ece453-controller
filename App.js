// Keep this here!
import 'react-native-gesture-handler';

import ScreenNav from './src/components/ScreenNav';
import PeripheralsContext from "./src/contexts/BlePeripherals";
import {useState, useEffect} from "react";

import BleManager, {BleScanCallbackType, BleScanMatchMode, BleScanMode, BleState} from "react-native-ble-manager";


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
    return () => {};
  }, []);

  return (
      <PeripheralsContext.Provider value={[peripherals, setPeripherals]}>
          <ScreenNav/>
      </PeripheralsContext.Provider>
  );
}
