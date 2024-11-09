import {Button, View} from 'react-native';
import {useNavigation} from "@react-navigation/native";

import {containerStyles} from "../../styles/DefaultStyles";


function CarSelectScreen(props) {
    const navigation = useNavigation();

    const goToController = () => {
        navigation.push("Controller"); // TODO Pass device BLE info props
    };

    return (
        <View style={containerStyles.pageContainer}>
            <Button
                title={"Select"} // TODO This should be the "Confirm Selection" button for a chosen car, and only after successfully pairing should we go to controller
                onPress={goToController}
            />
        </View>
    );
}


export default CarSelectScreen;
