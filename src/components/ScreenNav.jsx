import {createNativeStackNavigator} from "@react-navigation/native-stack";
import {NavigationContainer} from "@react-navigation/native";

import CarSelectScreen from "./screens/CarSelectScreen";
import ControllerScreen from "./screens/ControllerScreen";

const ScreenStack = createNativeStackNavigator();


function ScreenNav(props) {
    return (
        <NavigationContainer>
            <ScreenStack.Navigator
                initialRouteName={"Select Car"}
                screenOptions={{
                    statusBarHidden: true,
                    headerShown: false
                }}
            >
                <ScreenStack.Screen name="Select Car" component={CarSelectScreen} />
                <ScreenStack.Screen name="Controller" component={ControllerScreen} />
            </ScreenStack.Navigator>
        </NavigationContainer>
    );
}


export default ScreenNav;
