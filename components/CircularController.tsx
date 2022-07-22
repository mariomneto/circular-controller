import React from 'react';
import { Dimensions, StyleSheet, Text, TextStyle, View, ViewStyle } from 'react-native';
import Animated, { AnimateStyle, Extrapolate, interpolate, runOnJS, useAnimatedProps, useAnimatedReaction, useAnimatedStyle, useDerivedValue, useSharedValue, withSpring } from 'react-native-reanimated';
import { between, ReText, Vector } from 'react-native-redash';
import Svg, { Circle, G, Path } from 'react-native-svg';
import { colors } from '../utils/colors';
import { textShadow } from '../utils/styleUtils';
import Cursor from './Cursor';
import Label from './Label';

const { width, height } = Dimensions.get('screen');

const AnimatedPath = Animated.createAnimatedComponent(Path);

const strokeWidth = 7;
const circumference = 850;
const radius = circumference / (2 * Math.PI);
const center = { x: width / 2, y: height / 2 };
const labelSize = 24;

export type ArcType = 1.5 | 2 | 2.5;

interface CircularControllerProps {
  arcType?: ArcType;
  labels?: string[];
  labelPositions?: number[];
}

const CircularController: React.FC<CircularControllerProps> = ({ arcType, labels, labelPositions }: CircularControllerProps) => {
  const progress = useSharedValue(0);
  const progressText = useDerivedValue(() => {
    return `${Math.floor(progress.value * 100)}`;
  });
  const halfCircle = radius + strokeWidth;
  const holeLength = (circumference / 10) * (arcType ? arcType : 2);
  const arcLength = circumference - holeLength;
  const arcAngle = (arcLength / radius);
  const holeAngle = Math.PI * 2 - arcAngle;
  const [minAngle, maxAngle] = [
    (Math.PI / 2 + holeAngle / 2),
    (Math.PI / 2 - holeAngle / 2)
  ];
  const angleAmplitude = Math.PI * 2 - minAngle + maxAngle;
  const progressArch = useSharedValue<{
    larc: number, endPoint: Vector
  }>({
    larc: 0,
    endPoint: { x: -Math.cos(minAngle) * radius, y: Math.sin(minAngle) * radius }
  });
  const cursorTheta = useSharedValue<number>(minAngle);

  //labels
  const totalLabels = labels ? labels.length : 0;
  let labelPcts = labelPositions;
  if (labelPositions?.length !== totalLabels || !labelPositions.every((v) => between(v, 0, 1))){
    labelPcts = new Array(totalLabels).fill(0);
    labelPcts = labelPcts.map((v, i) => 1 / (totalLabels + 1) * (i + 1));
  }
  const labelAngles = labelPcts!.map((pct) => {
    return pct * angleAmplitude + minAngle;
  });

  const setProgress = (a: number) => {
    'worklet';
    cursorTheta.value = a;
  }

  useAnimatedReaction(() => {
    return cursorTheta.value
  }, (a) => {
    const r = a >= minAngle ? (a - minAngle) : (a + Math.PI * 2 - minAngle);
    const pct = r / angleAmplitude;
    progress.value = pct;
    const endPoint = {
      x: -Math.cos(a) * radius,
      y: Math.sin(a) * radius
    }
    const diffA = a - minAngle;
    const larc = (diffA < Math.PI && diffA > 0) ? 0 : 1;
    progressArch.value = { larc, endPoint };
  }, [cursorTheta]);

  const animatedPathProps = useAnimatedProps(() => {
      const { larc, endPoint } = progressArch.value;
      const mX = halfCircle - Math.cos(maxAngle) * radius;
      const mY = halfCircle + Math.sin(maxAngle) * radius;
      const endX = halfCircle - endPoint.x;
      const endY = halfCircle + endPoint.y;
      return {
        d:`M ${mX} ${mY} A ${radius} ${radius} 0 ${larc} 1 ${endX} ${endY}`
      }
  });

  const onTapLabel = (i: number) => {
    'worklet';
    const dest = labelAngles[i];
    cursorTheta.value = withSpring(dest, { overshootClamping: true, stiffness: 80 });
  }

  return (
      <View style={styles.container}>
        <Svg
          width={radius * 2}
          height={radius * 2}
          viewBox={`0 0 ${halfCircle * 2} ${halfCircle * 2}`}
        >
          <G
            rotation={'90'}
            origin={`${halfCircle}, ${halfCircle}`}
          >
            <Circle
              cx={'50%'}
              cy={'50%'}
              r={radius}
              stroke={colors.outerCircle}
              strokeLinecap={'round'}
              strokeDasharray={arcLength}
              strokeDashoffset={-holeLength / 2}
              strokeWidth={strokeWidth}
            >
            </Circle>

            <G
              rotation={'-90'}
              origin={`${halfCircle}, ${halfCircle}`}
            >
              <AnimatedPath
                strokeWidth={strokeWidth}
                strokeLinecap={'round'}
                stroke={colors.innerCircle}
                animatedProps={animatedPathProps}
              />
            </G>
          </G>
        </Svg>
        {
          labels &&
          labels.map((label, i) => {
              return(
                <Label
                  name={label}
                  index={i}
                  radius={radius}
                  position={labelAngles[i]}
                  cursor={cursorTheta}
                  onTap={onTapLabel}
                  key={label}
                />
              )
            })
        }
        <Cursor
          center={center}
          radius={radius}
          strokeWidth={strokeWidth}
          amplitude={{min: minAngle, max: maxAngle}}
          onChange={setProgress}
          context={cursorTheta}
        />
        <View style={styles.textWrapper}>
          <ReText
            style={styles.progressText} 
            text={progressText}
          />
          <Text style={[styles.progressText, styles.progressPercentage ]}>%</Text>
        </View>
      </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  } as ViewStyle,
  svg: {
    justifyContent: 'center',
    alignItems: 'center',
  } as ViewStyle,
  progressText: { 
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: 50,
    color: colors.innerCircle,
    ...textShadow
  } as TextStyle,
  progressPercentage: {
    fontSize: 30,
    bottom: 5,
  } as TextStyle,
  textWrapper: {
    position: 'absolute',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-end'
  } as ViewStyle,
  label: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    width: labelSize,
    height: labelSize,
    borderRadius: labelSize / 2,
    backgroundColor: colors.outerCircle,
  } as ViewStyle,
  labelTitle: {
      fontWeight: 'bold',
      color: 'white'
  } as TextStyle
});

export default CircularController;
