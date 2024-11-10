// Keep this here!
import 'react-native-gesture-handler';

import ScreenNav from './src/components/ScreenNav';
import PeripheralsContext from "./src/contexts/BlePeripherals";
import {useState} from "react";


export default function App() {
  const [peripherals, setPeripherals] = useState(new Map());

  return (
      <PeripheralsContext.Provider value={[peripherals, setPeripherals]}>
          <ScreenNav/>
      </PeripheralsContext.Provider>
  );
}
