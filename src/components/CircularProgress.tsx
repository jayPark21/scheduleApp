import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { COLORS } from '../constants/theme';

interface CircularProgressProps {
    progress: number; // 0 to 1
    size: number;
    strokeWidth: number;
    color: string;
    children?: React.ReactNode;
}

export const CircularProgress: React.FC<CircularProgressProps> = ({
    progress,
    size,
    strokeWidth,
    color,
    children
}) => {
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const strokeDashoffset = circumference - progress * circumference;

    // Calculate indicator position
    const angle = (progress * 360 - 90) * (Math.PI / 180);
    const indicatorX = size / 2 + radius * Math.cos(angle);
    const indicatorY = size / 2 + radius * Math.sin(angle);

    return (
        <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
            <Svg width={size} height={size} style={styles.svg}>
                {/* Background Circle */}
                <Circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke="rgba(255, 255, 255, 0.05)"
                    strokeWidth={strokeWidth}
                    fill="transparent"
                />
                {/* Progress Circle */}
                <Circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke={color}
                    strokeWidth={strokeWidth}
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    fill="transparent"
                    transform={`rotate(-90 ${size / 2} ${size / 2})`}
                />
                {/* Indicator Point */}
                {progress > 0 && (
                    <Circle
                        cx={indicatorX}
                        cy={indicatorY}
                        r={strokeWidth / 2 + 2}
                        fill={color}
                        stroke="rgba(255, 255, 255, 0.5)"
                        strokeWidth={2}
                    />
                )}
            </Svg>
            <View style={StyleSheet.absoluteFillObject}>
                {children}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    svg: {
        transform: [{ scaleX: 1 }],
    },
});
