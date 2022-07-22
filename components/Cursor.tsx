import React from 'react';
import { Dimensions, StyleSheet, ViewStyle } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { runOnJS, useAnimatedReaction, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { between, canvas2Cartesian, cartesian2Polar, normalizeRad, polar2Cartesian, Vector } from 'react-native-redash';
import { colors } from '../utils/colors';
import { shadow } from '../utils/styleUtils';
import { useHapticFeedback } from '../utils/utils';

const { width: sw, height: sh } = Dimensions.get('screen');

const size = 30;
const maxScale = 1.5;
const maxDrift = 100;

interface CursorProps {
    center: Vector;
    radius: number;
    strokeWidth: number;
    amplitude: { min: number, max: number }
    context: Animated.SharedValue<number>;
    onChange: (a: number) => void;
}

const Cursor: React.FC<CursorProps> = ({ center, radius, strokeWidth, amplitude, onChange, context }: CursorProps) => {
    const cursorPos = useSharedValue<Vector>({
        x: (radius * Math.cos(amplitude.min) + (strokeWidth - size / 2) * -1),
        y: (radius * Math.sin(amplitude.min) + (strokeWidth - size / 2))
    });
    const cursorScale = useSharedValue(1);
    const thetaContext = useSharedValue(amplitude.min);
    const adjRadius = radius - size / 2 + strokeWidth;

    const adjustTheta = (theta: number): number => {
        'worklet';
        let nt = theta;
        if(between(theta, amplitude.max, amplitude.min)){
            nt = Math.abs(theta - amplitude.max) < Math.abs(theta - amplitude.min) ? 
            amplitude.max : amplitude.min;
        }
        if((thetaContext.value === amplitude.max && !between(nt, amplitude.max - 1, amplitude.max)) ||
            thetaContext.value === amplitude.min && !between(nt, amplitude.min, amplitude.min + 1)) {
                return thetaContext.value;
            }
        return nt;
    }

    useAnimatedReaction(() => {
        return context.value;
      }, (theta) => {
        const pos = polar2Cartesian({ theta, radius: adjRadius });
        cursorPos.value = pos;
      }, [context]);
    
    const distance = (v: Vector, w: Vector): number => {
        'worklet'
        return Math.sqrt(
            (Math.max(v.x, w.x) - Math.min(v.x, w.x)) ** 2 + 
            (Math.max(v.y, w.y) - Math.min(v.y, w.y)) ** 2
        );
    }

    const onEnd = () => {
        'worklet';
        cursorScale.value = withSpring(1, { stiffness: 200 });  
    }

    const panGesture = Gesture.Pan()
        .onBegin(() => {
            cursorScale.value = withSpring(maxScale, { stiffness: 200 });
            runOnJS(useHapticFeedback)();
        })
        .onUpdate(({ absoluteX: x, absoluteY: y }) => {
            const touch = canvas2Cartesian({ x, y }, center);
            const dist = distance({ x: touch.x, y: -touch.y }, cursorPos.value);
            if(dist < maxDrift) {
                const v = { x: x - center.x, y: y - center.y };
                const polar = cartesian2Polar(v);
                const theta = thetaContext.value = adjustTheta(normalizeRad(polar.theta));
                const pos = polar2Cartesian({ theta, radius: adjRadius });
                cursorPos.value = pos;
                onChange(theta);
            }
            else {
                cursorScale.value = withSpring(1, { stiffness: 200 });
            }
        })
        .onEnd(onEnd)
        .onFinalize(onEnd)
        .onTouchesCancelled(onEnd)
        .onTouchesUp(onEnd)

    const rCursorStyle = useAnimatedStyle(() => {
        return {
          transform: [
            { translateX: cursorPos.value.x },
            { translateY: cursorPos.value.y },
            { scale: cursorScale.value }
          ]
        }
    });

    return (
        <GestureDetector gesture={panGesture}>
            <Animated.View style={[styles.cursor, rCursorStyle]}/>
        </GestureDetector>
    )
}

export default Cursor

const styles = StyleSheet.create({
    cursor: {
        position: 'absolute',
        width: size,
        height: size,
        borderRadius: size,
        backgroundColor: colors.innerCircle,
        ...shadow
      } as ViewStyle 
})