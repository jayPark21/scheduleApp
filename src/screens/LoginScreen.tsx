import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, ImageBackground } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SHADOWS, GRADIENTS } from '../constants/theme';
import { Sparkles, ArrowRight } from 'lucide-react-native';

interface LoginScreenProps {
    onLogin: () => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
    const [isLoading, setIsLoading] = useState(false);

    const handleLogin = () => {
        setIsLoading(true);
        setTimeout(() => {
            setIsLoading(false);
            onLogin();
        }, 1500);
    };

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={['#0f172a', '#1e1b4b', '#312e81']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFillObject}
            />

            {/* Decorative Circles */}
            <View style={[styles.circle, styles.circle1]} />
            <View style={[styles.circle, styles.circle2]} />

            <View style={styles.content}>
                <View style={styles.iconContainer}>
                    <LinearGradient
                        colors={GRADIENTS.primary}
                        style={styles.iconGradient}
                    >
                        <Sparkles size={40} color={COLORS.white} />
                    </LinearGradient>
                </View>

                <Text style={styles.title}>SoloFlow AI</Text>
                <Text style={styles.subtitle}>Future of Task Management</Text>

                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Welcome Back</Text>
                    <Text style={styles.cardText}>
                        AI 기반의 스마트한 업무 비서와 함께{'\n'}
                        초효율적인 하루를 설계하세요.
                    </Text>

                    <TouchableOpacity
                        style={styles.buttonWrapper}
                        onPress={handleLogin}
                        disabled={isLoading}
                    >
                        <LinearGradient
                            colors={GRADIENTS.primary}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.button}
                        >
                            {isLoading ? (
                                <ActivityIndicator color={COLORS.white} />
                            ) : (
                                <>
                                    <Text style={styles.buttonText}>시스템 접속</Text>
                                    <ArrowRight size={20} color={COLORS.white} />
                                </>
                            )}
                        </LinearGradient>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    circle: {
        position: 'absolute',
        borderRadius: 999,
        opacity: 0.2,
    },
    circle1: {
        width: 300,
        height: 300,
        backgroundColor: COLORS.primary[500],
        top: -50,
        right: -50,
    },
    circle2: {
        width: 200,
        height: 200,
        backgroundColor: COLORS.secondary[500],
        bottom: -20,
        left: -20,
    },
    content: {
        alignItems: 'center',
        width: '100%',
        maxWidth: 400,
        zIndex: 10,
    },
    iconContainer: {
        marginBottom: 24,
        ...SHADOWS.glow,
    },
    iconGradient: {
        width: 80,
        height: 80,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
    },
    title: {
        fontSize: 36,
        fontWeight: '900',
        color: COLORS.white,
        marginBottom: 8,
        letterSpacing: 1,
        textShadowColor: COLORS.primary[500],
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 10,
    },
    subtitle: {
        fontSize: 16,
        color: COLORS.primary[100],
        marginBottom: 50,
        fontWeight: '600',
        letterSpacing: 2,
        textTransform: 'uppercase',
        opacity: 0.8,
    },
    card: {
        backgroundColor: 'rgba(21, 28, 47, 0.7)', // Glass feeling
        padding: 30,
        borderRadius: 30,
        width: '100%',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        ...SHADOWS.medium,
    },
    cardTitle: {
        fontSize: 24,
        fontWeight: '800',
        color: COLORS.white,
        marginBottom: 12,
    },
    cardText: {
        fontSize: 15,
        color: COLORS.text[300],
        textAlign: 'center',
        marginBottom: 30,
        lineHeight: 24,
    },
    buttonWrapper: {
        width: '100%',
        ...SHADOWS.glow,
    },
    button: {
        paddingVertical: 18,
        paddingHorizontal: 40,
        borderRadius: 20,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        width: '100%',
        justifyContent: 'center',
    },
    buttonText: {
        color: COLORS.white,
        fontSize: 16,
        fontWeight: '800',
        letterSpacing: 1,
        textTransform: 'uppercase',
    },
});

export default LoginScreen;
