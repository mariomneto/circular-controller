import Haptics from 'react-native-haptic-feedback';

const useHapticFeedback = () => {
    const options = {
        enableVibrateFallback: true,
        ignoreAndroidSystemSettings: false
      };
    Haptics.trigger("impactLight", options);
}

export { useHapticFeedback }