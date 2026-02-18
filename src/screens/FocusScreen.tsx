import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, Pressable, Alert, Dimensions, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { X, Play, Pause, RotateCcw, Coffee, Volume2, VolumeX } from 'lucide-react-native';
import { Audio } from 'expo-av';
import { COLORS, GRADIENTS, SHADOWS } from '../constants/theme';
import { db } from '../services/dbService';
import { CircularProgress } from '../components/CircularProgress';

const { width, height } = Dimensions.get('window');

interface FocusScreenProps {
    navigation: any;
}

const FOCUS_PRESETS = [15, 25, 45, 60];
const BREAK_TIME = 5 * 60;  // 5 minutes

export default function FocusScreen({ navigation }: FocusScreenProps) {
    const [focusDuration, setFocusDuration] = useState(25 * 60);
    const [timeLeft, setTimeLeft] = useState(25 * 60);
    const [isActive, setIsActive] = useState(false);
    const [mode, setMode] = useState<'focus' | 'break'>('focus');
    const [isSoundEnabled, setIsSoundEnabled] = useState(true);
    const [sound, setSound] = useState<Audio.Sound | null>(null);

    const playSound = async () => {
        if (!isSoundEnabled) return;
        try {
            const { sound: newSound } = await Audio.Sound.createAsync(
                { uri: 'https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3' } // A clean "Ding" sound
            );
            setSound(newSound);
            await newSound.playAsync();
        } catch (error) {
            console.log('Error playing sound:', error);
        }
    };

    const handleTimerComplete = useCallback(async () => {
        setIsActive(false);
        await playSound(); // Play sound on completion
        if (mode === 'focus') {
            const { leveledUp, newLevel } = await db.addXP(50); // 50 XP for focus session
            Alert.alert(
                "몰입 완료! 🎉",
                `선택하신 ${Math.floor(focusDuration / 60)}분간의 몰입 세션을 마쳤습니다! 50 XP를 획득하셨습니다.${leveledUp ? `\n\n축하합니다! 레벨 ${newLevel}로 올랐습니다! 🚀` : ''}`,
                [
                    { text: "휴식 시작", onPress: () => startBreak() },
                    { text: "종료", onPress: () => navigation.goBack() }
                ]
            );
        } else {
            Alert.alert("휴식 종료", "다시 몰입할 준비가 되셨나요?", [
                { text: "집중 시작", onPress: () => startFocus() },
                { text: "종료", onPress: () => navigation.goBack() }
            ]);
        }
    }, [mode, navigation]);

    useEffect(() => {
        return sound
            ? () => {
                sound.unloadAsync();
            }
            : undefined;
    }, [sound]);

    useEffect(() => {
        let interval: NodeJS.Timeout | null = null;

        if (isActive) {
            interval = setInterval(() => {
                setTimeLeft((prev) => {
                    if (prev <= 1) {
                        clearInterval(interval!);
                        handleTimerComplete();
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        }


        return () => {
            if (interval) clearInterval(interval);
        };
    }, [isActive, handleTimerComplete]);

    const startFocus = (duration?: number) => {
        const targetDuration = duration || focusDuration;
        setMode('focus');
        setFocusDuration(targetDuration);
        setTimeLeft(targetDuration);
        setIsActive(true);
    };

    const startBreak = () => {
        setMode('break');
        setTimeLeft(BREAK_TIME);
        setIsActive(true);
    };

    const toggleTimer = () => {
        setIsActive(!isActive);
    };

    const resetTimer = () => {
        setIsActive(false);
        setTimeLeft(mode === 'focus' ? focusDuration : BREAK_TIME);
    };

    const handlePresetPress = (minutes: number) => {
        const seconds = minutes * 60;
        setFocusDuration(seconds);
        setTimeLeft(seconds);
        setIsActive(false);
        setMode('focus');
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const progress = timeLeft / (mode === 'focus' ? focusDuration : BREAK_TIME);

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={mode === 'focus' ? ['#0F172A', '#1E1B4B', '#1E293B'] : ['#064E3B', '#0B1F1B', '#0F172A']}
                style={StyleSheet.absoluteFillObject}
            />

            {/* Mesh/Aurora effect layers */}
            <LinearGradient
                colors={mode === 'focus' ? ['transparent', 'rgba(56, 189, 248, 0.05)', 'transparent'] : ['transparent', 'rgba(74, 222, 128, 0.05)', 'transparent']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFillObject}
            />
            <LinearGradient
                colors={mode === 'focus' ? ['transparent', 'rgba(168, 85, 247, 0.03)', 'transparent'] : ['transparent', 'rgba(45, 212, 191, 0.03)', 'transparent']}
                start={{ x: 1, y: 0 }}
                end={{ x: 0, y: 1 }}
                style={StyleSheet.absoluteFillObject}
            />

            <SafeAreaView style={styles.safeArea}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeButton}>
                        <X color={COLORS.white} size={28} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>{mode === 'focus' ? 'DEEP FOCUS' : 'REST TIME'}</Text>
                    <TouchableOpacity onPress={() => setIsSoundEnabled(!isSoundEnabled)} style={styles.closeButton}>
                        {isSoundEnabled ? (
                            <Volume2 color={COLORS.white} size={24} />
                        ) : (
                            <VolumeX color={COLORS.text[400]} size={24} />
                        )}
                    </TouchableOpacity>
                </View>

                <View style={styles.timerContainer}>
                    <CircularProgress
                        size={width * 0.82}
                        strokeWidth={14}
                        progress={progress}
                        color={mode === 'focus' ? COLORS.primary[400] : COLORS.success[400]}
                    >
                        <BlurView intensity={30} tint="dark" style={styles.glassCard}>
                            <View style={styles.modeIconContainer}>
                                {mode === 'focus' ? (
                                    <Play size={32} color={COLORS.primary[400]} fill={COLORS.primary[400]} />
                                ) : (
                                    <Coffee size={32} color={COLORS.success[400]} />
                                )}
                            </View>

                            <Text style={styles.timerText}>{formatTime(timeLeft)}</Text>

                            <Text style={styles.modeSubText}>
                                {mode === 'focus' ? '몰두하는 당신의 모습이 아름답습니다' : '잠시 숨을 고르며 재충전하세요'}
                            </Text>
                        </BlurView>
                    </CircularProgress>
                </View>

                {mode === 'focus' && !isActive && (
                    <View style={styles.presetsContainer}>
                        {FOCUS_PRESETS.map((mins) => (
                            <Pressable
                                key={mins}
                                onPress={() => handlePresetPress(mins)}
                                style={({ pressed }) => [
                                    styles.presetButton,
                                    focusDuration === mins * 60 && styles.activePresetButton,
                                    pressed && { opacity: 0.7 }
                                ]}
                            >
                                <Text style={[
                                    styles.presetText,
                                    focusDuration === mins * 60 && styles.activePresetText
                                ]}>{mins}m</Text>
                            </Pressable>
                        ))}
                    </View>
                )}

                <View style={styles.controls}>
                    <Pressable onPress={resetTimer} style={({ pressed }) => [styles.secondaryButton, pressed && { opacity: 0.7 }]}>
                        <RotateCcw size={24} color={COLORS.text[300]} pointerEvents="none" />
                    </Pressable>

                    <Pressable onPress={toggleTimer} style={({ pressed }) => [styles.mainButton, pressed && { transform: [{ scale: 0.95 }] }]}>
                        <LinearGradient
                            colors={mode === 'focus' ? GRADIENTS.primary : GRADIENTS.secondary}
                            style={styles.mainButtonGradient}
                            pointerEvents="none"
                        >
                            {isActive ? (
                                <Pause size={32} color={COLORS.white} />
                            ) : (
                                <Play size={32} color={COLORS.white} fill={COLORS.white} />
                            )}
                        </LinearGradient>
                    </Pressable>

                    <View style={{ width: 48 }} />
                </View>
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    safeArea: {
        flex: 1,
        justifyContent: 'space-between',
        paddingVertical: 20,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 24,
    },
    closeButton: {
        padding: 5,
    },
    headerTitle: {
        color: COLORS.white,
        fontSize: 14,
        fontWeight: '800',
        letterSpacing: 2,
    },
    timerContainer: {
        alignItems: 'center',
        paddingHorizontal: 30,
    },
    glassCard: {
        width: width * 0.75,
        aspectRatio: 1,
        borderRadius: width * 0.4,
        overflow: 'hidden',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.02)',
        borderWidth: 0.5, // Thinner border
        borderColor: 'rgba(255, 255, 255, 0.08)',
    },
    modeIconContainer: {
        marginBottom: 20,
        opacity: 0.8,
    },
    timerText: {
        fontSize: 72,
        fontWeight: '100', // Ultra thin for sophistication
        color: COLORS.white,
        fontVariant: ['tabular-nums'],
        letterSpacing: -2,
    },
    modeSubText: {
        color: COLORS.text[400],
        fontSize: 13,
        marginTop: 20,
        textAlign: 'center',
        paddingHorizontal: 40,
        lineHeight: 18,
    },
    presetsContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 12,
        marginTop: -20,
    },
    presetButton: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.03)',
        borderWidth: 0.5,
        borderColor: 'rgba(255, 255, 255, 0.05)',
    },
    activePresetButton: {
        backgroundColor: COLORS.primary[400] + '15',
        borderColor: COLORS.primary[400] + '66',
    },
    presetText: {
        color: COLORS.text[300],
        fontSize: 14,
        fontWeight: '600',
    },
    activePresetText: {
        color: COLORS.primary[400],
    },
    controls: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingBottom: 40,
    },
    mainButton: {
        marginHorizontal: 40,
        ...SHADOWS.glow,
    },
    mainButtonGradient: {
        width: 80,
        height: 80,
        borderRadius: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    secondaryButton: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: 'rgba(255,255,255,0.05)',
        justifyContent: 'center',
        alignItems: 'center',
    }
});
