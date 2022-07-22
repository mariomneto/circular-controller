import { TextStyle, ViewStyle } from "react-native"

const shadow = {
    shadowOffset: {
        width: 0,
        height: 3,
      },
      shadowOpacity: 0.27,
      shadowRadius: 4.65,
      overflow: 'visible',
      elevation: 7
} as ViewStyle

const textShadow = {
  textShadowColor: 'rgba(0, 0, 0, 0.25)',
  textShadowRadius: 10
} as TextStyle

export { shadow, textShadow }