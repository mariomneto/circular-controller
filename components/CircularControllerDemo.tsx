import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import CircularController from './CircularController';

const CircularProgressBarDemo: React.FC = () => {
  return (
    <View style={styles.container}>
      <CircularController
        labels={['10', '20', '30', '40', '50', '60', '70', '80', '90']}
      />
    </View>
  );
};

const colors = {
  background: '#444B6F',
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background
  } as ViewStyle,
});

export default CircularProgressBarDemo;
