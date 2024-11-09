import React from 'react';
import {BackHandler, Button, SafeAreaView} from 'react-native'; // TODO BackHandler might be Android specific
import {useNavigation, useFocusEffect} from "@react-navigation/native";

import {containerStyles} from "../../styles/DefaultStyles";
import Controller from "../controller/Controller";


function ControllerScreen(props) {
    const navigation = useNavigation();

    const goBackToCarSelect = () => {
        // TODO Disconnect from the MCU
        navigation.goBack();
    };

    // Override the default built-in status bar back button behavior
    useFocusEffect(
        React.useCallback(() => {
            const onBackPress = () => {
                // Back button press callback

                console.log("Pressed back")

                // true to disable going back; false to allow default behavior (going back)
                return true;
            };

            BackHandler.addEventListener('hardwareBackPress', onBackPress);

            return () => BackHandler.removeEventListener('hardwareBackPress', onBackPress);
        }, [])
    );

    return (
        <SafeAreaView style={containerStyles.pageContainer}>
            <Button
                // TODO At the end of the game, have a modal at the end of each game to show results and allow going back
                title={"Back"}
                onPress={goBackToCarSelect}
            />
            <Controller/>
        </SafeAreaView>
    );
}


export default ControllerScreen;
