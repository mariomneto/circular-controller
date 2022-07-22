import React from 'react';
import { Text, TextStyle, ViewStyle } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { Extrapolate, interpolate, runOnJS, useAnimatedReaction, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { between } from 'react-native-redash';
import { colors } from '../utils/colors';
import { useHapticFeedback } from '../utils/utils';

const size = 24;
const maxScale = 1.5;
const maxSnapScale = 1.7;
const detractor = 25;
const snapAngle = 0.1;

export interface LabelTheme {
    primaryColor?: string | number;
    accentColor?: string | number;
    primaryText?: string | number;
    snapText?: string | number;
}

interface LabelProps {
    name: string;
    index: number;
    radius: number;
    position: number;
    cursor: Animated.SharedValue<number>;
    theme?: LabelTheme;
    snapOn?: boolean;
    onTap: (i: number) => void;
}

const Label: React.FC<LabelProps> = ({ name, index, radius, position, theme, cursor, onTap }: LabelProps) => {
    const styles = stylesheet(theme);
    const labelRadius = radius * 1.15;
    const tx = useSharedValue(Math.cos(position) * labelRadius);
    const ty = useSharedValue(Math.sin(position) * labelRadius);
    const scale = useSharedValue(1);
    const snap = useSharedValue<boolean>(false);

    const dist = Math.PI / 5;
    const intVal = {
        in: [-dist, 0, dist],
        out: [1, maxScale, 1]
    }

    useAnimatedReaction(() => {
        return between(cursor.value, 0, Math.PI / 2) ? cursor.value + Math.PI * 2 : cursor.value;
      }, (cursor) => {
        const diff = Math.abs(position - cursor);
        if (diff < snapAngle) {
            if(!snap.value) {
                scale.value = withSpring(maxSnapScale);
                tx.value = withSpring(Math.cos(position) * radius * 1.25);
                ty.value = withSpring(Math.sin(position) * radius * 1.25);
                snap.value = true;
            }
        }
        else {
            const sv = interpolate(diff, intVal.in, intVal.out, Extrapolate.CLAMP);
            scale.value = withSpring(sv, { overshootClamping: true });
            tx.value = Math.cos(position) * (labelRadius + (scale.value - 1) * detractor);
            ty.value = Math.sin(position) * (labelRadius + (scale.value - 1) * detractor);
            snap.value = false;
        }
      }, [cursor]);


    const rLabelStyle = useAnimatedStyle(() => {
        return {
            transform: [
                { translateX: tx.value },
                { translateY: ty.value },
                { scale: scale.value }
            ]
        }
    });

    const rSnapStyle = useAnimatedStyle(() => {
        if(snap.value) {
            const backgroundColor = theme?.accentColor ? theme.accentColor : colors.innerCircle;
            return { 
                backgroundColor
            };
        }

        const backgroundColor = theme?.primaryColor ? theme.primaryColor : colors.outerCircle;        
        return {
            backgroundColor
        }
    });

    const onEndTap = () => {
        'worklet';
        onTap(index);
        snap.value = true;
        runOnJS(useHapticFeedback)();
    }

    const tapGesture = Gesture.Tap()
        .maxDuration(10000)
        .onEnd(onEndTap)
        // .onTouchesCancelled(onEndTap)
        // .onFinalize(onEndTap)
    
    return(
        <GestureDetector gesture={tapGesture}>
            <Animated.View
                style={[
                    stylesheet(theme).label(),
                    rLabelStyle,
                    rSnapStyle
                ]}
            >
                <Text style={styles.title}>{name}</Text>
            </Animated.View>
        </GestureDetector>
    )
}

export default Label

const stylesheet = (theme?: LabelTheme) => {
    return {
        label: () => ({
            position: 'absolute',
            justifyContent: 'center',
            alignItems: 'center',
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: theme?.primaryColor ? theme.primaryColor : colors.outerCircle
        } as ViewStyle),
        title: {
            fontWeight: 'bold',
            color: 'white'
        } as TextStyle
    }
}