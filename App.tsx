import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

import { COLORS, SHADOWS } from './src/constants/theme';
import { db } from './src/services/dbService';

// Screens
import LoginScreen from './src/screens/LoginScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import CalendarScreen from './src/screens/CalendarScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import AddEventScreen from './src/screens/AddEventScreen';
import ManageGoalsScreen from './src/screens/ManageGoalsScreen';
import EditProfileScreen from './src/screens/EditProfileScreen';
import { notificationService } from './src/services/notificationService';

import { Home, Calendar as CalendarIcon, Settings, Plus, User } from 'lucide-react-native';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function TabNavigator({ onLogout }: { onLogout: () => void }) {
    return (
        <Tab.Navigator
            screenOptions={{
                headerShown: false,
                tabBarStyle: {
                    position: 'absolute',
                    bottom: 25,
                    left: 20,
                    right: 20,
                    borderTopWidth: 0,
                    /* elevation: 0 is removed to allow SHADOWS.large to work */
                    backgroundColor: '#151C2F', // Dark surface
                    borderRadius: 25,
                    height: 70,
                    ...SHADOWS.large,
                    borderWidth: 1,
                    borderColor: 'rgba(255,255,255,0.05)',
                },
                tabBarShowLabel: false,
                tabBarActiveTintColor: COLORS.primary[400], // Neon Blue
                tabBarInactiveTintColor: COLORS.text[500],
            }}
        >
            <Tab.Screen
                name="Dashboard"
                component={DashboardScreen}
                options={{
                    tabBarIcon: ({ color, size }) => (
                        <View style={{ alignItems: 'center' }}>
                            <Home color={color} size={24} />
                        </View>
                    ),
                }}
            />

            {/* 
        This is a dummy tab for the center "Add" button purely for visual layout 
        if we wanted a custom button. But navigating to 'AddEvent' stack screen 
        from a tab press is tricky without a listener.
        Instead, I'll put the FAB in the Dashboard screen as implemented.
        So just standard tabs here.
      */}

            <Tab.Screen
                name="Calendar"
                component={CalendarScreen}
                options={{
                    tabBarIcon: ({ color, size }) => (
                        <View style={{ alignItems: 'center' }}>
                            <CalendarIcon color={color} size={24} />
                        </View>
                    ),
                }}
            />
            <Tab.Screen
                name="Profile"
                children={({ navigation }) => <SettingsScreen onLogout={onLogout} navigation={navigation} />}
                options={{
                    tabBarIcon: ({ color, size }) => (
                        <View style={{ alignItems: 'center' }}>
                            <User color={color} size={24} />
                        </View>
                    ),
                }}
            />
        </Tab.Navigator>
    );
}

export default function App() {
    const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);

    useEffect(() => {
        checkLoginStatus();
    }, []);

    const checkLoginStatus = async () => {
        const loggedIn = await db.isLoggedIn();
        setIsLoggedIn(loggedIn);
        if (loggedIn) {
            await notificationService.registerForPushNotificationsAsync();
        }
    };

    const handleLogin = async () => {
        await db.setLoggedIn(true);
        setIsLoggedIn(true);
    };

    const handleLogout = async () => {
        // Logic handled in SettingsScreen to clear DB flag
        // Here just update state
        setIsLoggedIn(false);
    };

    if (isLoggedIn === null) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" color={COLORS.primary[500]} />
            </View>
        );
    }

    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <SafeAreaProvider>
                <NavigationContainer>
                    <StatusBar style="auto" />
                    <Stack.Navigator screenOptions={{ headerShown: false }}>
                        {!isLoggedIn ? (
                            <Stack.Screen name="Login">
                                {props => <LoginScreen {...props} onLogin={handleLogin} />}
                            </Stack.Screen>
                        ) : (
                            <>
                                <Stack.Screen name="MainTabs">
                                    {() => <TabNavigator onLogout={handleLogout} />}
                                </Stack.Screen>
                                <Stack.Screen
                                    name="AddEvent"
                                    component={AddEventScreen}
                                    options={{ presentation: 'modal' }}
                                />
                                <Stack.Screen
                                    name="ManageGoals"
                                    component={ManageGoalsScreen}
                                    options={{ presentation: 'card', headerShown: false }}
                                />
                                <Stack.Screen
                                    name="EditProfile"
                                    component={EditProfileScreen}
                                    options={{ presentation: 'card', headerShown: false }}
                                />
                            </>
                        )}
                    </Stack.Navigator>
                </NavigationContainer>
            </SafeAreaProvider>
        </GestureHandlerRootView>
    );
}
