import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, Image, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../constants/theme';
import { X, User, Check, Camera, Image as ImageIcon } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { db } from '../services/dbService';
import { UserProfile } from '../types';
import { useFocusEffect } from '@react-navigation/native';

interface EditProfileScreenProps {
    navigation: any;
}

const AVATAR_PRESETS = [
    'https://i.pravatar.cc/150?img=1',
    'https://i.pravatar.cc/150?img=3',
    'https://i.pravatar.cc/150?img=5',
    'https://i.pravatar.cc/150?img=8',
    'https://i.pravatar.cc/150?img=12',
    'https://i.pravatar.cc/150?img=32',
];

const EditProfileScreen: React.FC<EditProfileScreenProps> = ({ navigation }) => {
    const [name, setName] = useState('');
    const [role, setRole] = useState('');
    const [avatar, setAvatar] = useState('');

    const pickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.5,
        });

        if (!result.canceled) {
            setAvatar(result.assets[0].uri);
        }
    };

    useFocusEffect(
        React.useCallback(() => {
            db.getProfile().then(p => {
                if (p) {
                    setName(p.name);
                    setRole(p.role);
                    setAvatar(p.avatar);
                }
            });
        }, [])
    );

    const handleSave = async () => {
        if (!name.trim()) {
            Alert.alert('오류', '이름을 입력해주세요.');
            return;
        }

        const current = await db.getProfile();
        const updatedProfile: UserProfile = {
            ...current,
            name,
            role: role || 'Planner',
            avatar,
        };

        await db.saveProfile(updatedProfile);

        Alert.alert('완료', '프로필이 수정되었습니다.');
        navigation.goBack();
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeButton}>
                    <X size={24} color={COLORS.text[100]} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>프로필 편집</Text>
                <TouchableOpacity onPress={handleSave} style={styles.saveButton}>
                    <Check size={20} color={COLORS.white} />
                </TouchableOpacity>
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <ScrollView contentContainerStyle={styles.content}>
                    <View style={styles.avatarSection}>
                        <TouchableOpacity style={styles.avatarWrapper} onPress={pickImage}>
                            {avatar ? (
                                <Image source={{ uri: avatar }} style={styles.avatarImage} />
                            ) : (
                                <View style={styles.avatarPlaceholder}>
                                    <User size={40} color={COLORS.text[300]} />
                                </View>
                            )}
                            <View style={styles.cameraIcon}>
                                <Camera size={14} color="white" />
                            </View>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.pickImageBtn} onPress={pickImage}>
                            <ImageIcon size={16} color={COLORS.primary[400]} />
                            <Text style={styles.pickImageText}>앨범에서 선택</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.presetContainer}>
                        <Text style={styles.label}>아바타 선택</Text>
                        <View style={styles.presetRow}>
                            {AVATAR_PRESETS.map(uri => (
                                <TouchableOpacity
                                    key={uri}
                                    onPress={() => setAvatar(uri)}
                                    style={[styles.presetItem, avatar === uri && styles.presetSelected]}
                                >
                                    <Image source={{ uri }} style={styles.presetImage} />
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    <View style={styles.form}>
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>이름</Text>
                            <TextInput
                                style={styles.input}
                                value={name}
                                onChangeText={setName}
                                placeholder="이름을 입력하세요"
                                placeholderTextColor={COLORS.text[500]}
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>역할 / 상태 메시지</Text>
                            <TextInput
                                style={styles.input}
                                value={role}
                                onChangeText={setRole}
                                placeholder="예: 프론트엔드 개발자"
                                placeholderTextColor={COLORS.text[500]}
                            />
                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.surface,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.05)',
    },
    closeButton: {
        padding: 4,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: COLORS.white,
    },
    saveButton: {
        backgroundColor: COLORS.primary[500],
        padding: 8,
        borderRadius: 20,
    },
    content: {
        padding: 24,
    },
    avatarSection: {
        alignItems: 'center',
        marginBottom: 30,
    },
    avatarWrapper: {
        position: 'relative',
    },
    avatarImage: {
        width: 100,
        height: 100,
        borderRadius: 50,
        borderWidth: 2,
        borderColor: COLORS.primary[500],
    },
    avatarPlaceholder: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: COLORS.background,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: COLORS.text[700],
    },
    cameraIcon: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: COLORS.primary[500],
        padding: 6,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: COLORS.surface,
    },
    presetContainer: {
        marginBottom: 30,
    },
    presetRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
        marginTop: 10,
    },
    presetItem: {
        padding: 2,
        borderRadius: 22,
        borderWidth: 2,
        borderColor: 'transparent',
    },
    presetSelected: {
        borderColor: COLORS.primary[500],
    },
    presetImage: {
        width: 40,
        height: 40,
        borderRadius: 20,
    },
    form: {
        gap: 20,
    },
    inputGroup: {
        gap: 8,
    },
    label: {
        fontSize: 12,
        fontWeight: '700',
        color: COLORS.text[300],
        marginLeft: 4,
    },
    input: {
        backgroundColor: COLORS.background,
        borderRadius: 16,
        padding: 16,
        color: COLORS.white,
        fontSize: 16,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    pickImageBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginTop: 12,
        paddingHorizontal: 12,
        paddingVertical: 6,
        backgroundColor: 'rgba(56, 189, 248, 0.1)',
        borderRadius: 20,
    },
    pickImageText: {
        color: COLORS.primary[400],
        fontSize: 12,
        fontWeight: 'bold',
    },
});

export default EditProfileScreen;
