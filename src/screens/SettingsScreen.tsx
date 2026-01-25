import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SHADOWS, GRADIENTS } from '../constants/theme';
import { CloudUpload, CloudDownload, LogOut, User } from 'lucide-react-native';
import { db } from '../services/dbService';
import { apiService } from '../services/apiService';
import { notificationService } from '../services/notificationService';
import { UserProfile } from '../types';
import { useFocusEffect } from '@react-navigation/native';

interface SettingsScreenProps {
    onLogout: () => void;
    navigation: any;
}

const SettingsScreen: React.FC<SettingsScreenProps> = ({ onLogout, navigation }) => {
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    useFocusEffect(
        React.useCallback(() => {
            db.getProfile().then(setProfile);
        }, [])
    );

    const handleBackup = async () => {
        setIsLoading(true);
        const events = await db.getEvents();
        await apiService.pushEvents(events);
        setIsLoading(false);
        Alert.alert("완료", "클라우드 백업이 완료되었습니다! ☁️");
    };

    const handleRestore = async () => {
        Alert.alert(
            "주의",
            "데이터를 덮어쓰시겠습니까?",
            [
                { text: "취소", style: "cancel" },
                {
                    text: "확인",
                    style: 'destructive',
                    onPress: async () => {
                        setIsLoading(true);
                        await apiService.fetchEvents();
                        setIsLoading(false);
                        Alert.alert("완료", "복원되었습니다.");
                    }
                }
            ]
        );
    };

    const handleLogout = async () => {
        await db.setLoggedIn(false);
        onLogout();
    };

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={[COLORS.background, '#1e1b4b']}
                style={StyleSheet.absoluteFillObject}
            />
            <SafeAreaView style={{ flex: 1 }}>
                <ScrollView contentContainerStyle={styles.content}>
                    <View style={styles.profileHeader}>
                        <TouchableOpacity onPress={() => navigation.navigate('EditProfile')} style={{ alignItems: 'center' }}>
                            <LinearGradient
                                colors={GRADIENTS.primary}
                                style={styles.avatarContainer}
                            >
                                {profile?.avatar ? (
                                    <Image source={{ uri: profile.avatar }} style={styles.avatar} />
                                ) : (
                                    <User size={40} color={COLORS.white} />
                                )}
                            </LinearGradient>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                <Text style={styles.name}>{profile?.name || 'User'}</Text>
                                <Text style={{ color: COLORS.primary[400], fontSize: 16 }}>✎</Text>
                            </View>
                        </TouchableOpacity>
                        <View style={styles.roleBadge}>
                            <Text style={styles.roleText}>{profile?.role || 'Planner'}</Text>
                        </View>
                    </View>

                    <View style={styles.card}>
                        <Text style={styles.sectionTitle}>GOAL SETTINGS</Text>
                        <TouchableOpacity
                            style={styles.menuButton}
                            onPress={() => navigation.navigate('ManageGoals')} // Requires routing setup
                        >
                            <Text style={styles.menuText}>목표 및 카테고리 관리</Text>
                            {/* Simple arrow or icon */}
                            <Text style={{ color: COLORS.text[500] }}>{'>'}</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.card}>
                        <Text style={styles.sectionTitle}>DATA SYNC</Text>
                        <View style={styles.row}>
                            <TouchableOpacity
                                style={styles.actionButton}
                                onPress={handleBackup}
                                disabled={isLoading}
                            >
                                <LinearGradient
                                    colors={['rgba(56, 189, 248, 0.2)', 'rgba(56, 189, 248, 0.05)']}
                                    style={styles.gradientButton}
                                >
                                    <CloudUpload size={24} color={COLORS.primary[400]} />
                                    <Text style={[styles.actionText, { color: COLORS.primary[400] }]}>백업</Text>
                                </LinearGradient>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.actionButton}
                                onPress={handleRestore}
                                disabled={isLoading}
                            >
                                <LinearGradient
                                    colors={['rgba(168, 85, 247, 0.2)', 'rgba(168, 85, 247, 0.05)']}
                                    style={styles.gradientButton}
                                >
                                    <CloudDownload size={24} color={COLORS.secondary[400]} />
                                    <Text style={[styles.actionText, { color: COLORS.secondary[400] }]}>복원</Text>
                                </LinearGradient>
                            </TouchableOpacity>
                        </View>
                        {isLoading && <ActivityIndicator style={{ marginTop: 10 }} color={COLORS.primary[400]} />}
                    </View>

                    <View style={styles.card}>
                        <Text style={styles.sectionTitle}>NOTIFICATIONS</Text>
                        <TouchableOpacity
                            style={styles.menuButton}
                            onPress={async () => {
                                const events = await db.getEvents();
                                await notificationService.sendTestNotification(events);
                                Alert.alert("알림 발송", "오늘의 일정 브리핑 알림을 보냈습니다.\n(앱을 닫거나 알림 센터를 확인하세요)");
                            }}
                        >
                            <Text style={styles.menuText}>오늘 일정 브리핑 받아보기</Text>
                            <Text style={{ color: COLORS.primary[400] }}>🔔</Text>
                        </TouchableOpacity>
                    </View>

                    <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                        <LogOut size={20} color={COLORS.text[300]} />
                        <Text style={styles.logoutText}>로그아웃</Text>
                    </TouchableOpacity>

                </ScrollView>
            </SafeAreaView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    content: {
        padding: 24,
        alignItems: 'center',
    },
    profileHeader: {
        alignItems: 'center',
        marginBottom: 40,
        marginTop: 20,
    },
    avatarContainer: {
        width: 100,
        height: 100,
        borderRadius: 50,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
        borderWidth: 2,
        borderColor: 'rgba(255,255,255,0.2)',
        ...SHADOWS.glow,
    },
    avatar: {
        width: 92,
        height: 92,
        borderRadius: 46,
    },
    name: {
        fontSize: 24,
        fontWeight: '800',
        color: COLORS.white,
        marginBottom: 8,
        letterSpacing: 1,
    },
    roleBadge: {
        backgroundColor: 'rgba(255,255,255,0.1)',
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    roleText: {
        color: COLORS.primary[400],
        fontSize: 12,
        fontWeight: 'bold',
        textTransform: 'uppercase',
    },
    card: {
        width: '100%',
        backgroundColor: COLORS.surface,
        borderRadius: 24,
        padding: 24,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 12,
        fontWeight: 'bold',
        color: COLORS.text[500],
        textTransform: 'uppercase',
        marginBottom: 16,
        letterSpacing: 2,
    },
    row: {
        flexDirection: 'row',
        gap: 12,
    },
    actionButton: {
        flex: 1,
        borderRadius: 20,
        overflow: 'hidden',
    },
    gradientButton: {
        padding: 20,
        alignItems: 'center',
        gap: 8,
    },
    actionText: {
        fontWeight: 'bold',
        fontSize: 12,
    },
    logoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        padding: 16,
        opacity: 0.8,
    },
    logoutText: {
        color: COLORS.text[300],
        fontWeight: 'bold',
    },
    menuButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        backgroundColor: COLORS.background,
        borderRadius: 16,
        marginTop: 8,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    menuText: {
        color: COLORS.white,
        fontWeight: '600',
        fontSize: 14,
    },
});

export default SettingsScreen;
