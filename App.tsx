import React from 'react'
import { StyleSheet, ViewStyle } from 'react-native'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import CircularController from './components/CircularController'
import { colors } from './utils/colors'

const App = () => {
  return (
    <GestureHandlerRootView style={styles.container}>
        <CircularController/>
    </GestureHandlerRootView>
  )
}

const styles = StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colors.background
    } as ViewStyle,
  });

export default App