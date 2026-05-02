import React from 'react';
import './global.css';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Platform, View, Text, StyleSheet, Animated, useRef, useEffect, useWindowDimensions } from 'react-native';
import { GluestackUIProvider } from '@gluestack-ui/themed';
import { config } from '@gluestack-ui/config';
import { Provider as PaperProvider, MD3LightTheme } from 'react-native-paper';
import DiseaseScreen  from './src/screens/DiseaseScreen';
import SoilScreen     from './src/screens/SoilScreen';
import CropScreen     from './src/screens/CropScreen';
import AdviceScreen   from './src/screens/AdviceScreen';
import { GlobalProvider } from './src/context/GlobalState';
import { C, BP } from './src/design/tokens';

const Tab = createBottomTabNavigator();

// Custom Paper theme
const theme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary:         C.accent,
    secondary:       C.g600,
    surface:         C.n0,
    surfaceVariant:  C.g50,
    background:      C.g50,
    onSurface:       C.n900,
    outline:         C.n200,
  },
  roundness: 4,
};

const TABS = [
  { name: 'Disease', emoji: '🔬', Screen: DiseaseScreen, color: C.accent },
  { name: 'Soil',    emoji: '🪨', Screen: SoilScreen,    color: C.a600   },
  { name: 'Crop',    emoji: '🌾', Screen: CropScreen,    color: C.g700   },
  { name: 'Advice',  emoji: '🤖', Screen: AdviceScreen,  color: C.b600   },
];

function TabIcon({ emoji, label, focused, color }) {
  const scale = React.useRef(new Animated.Value(focused ? 1 : 0.9)).current;
  const bg    = React.useRef(new Animated.Value(focused ? 1 : 0)).current;

  React.useEffect(() => {
    Animated.parallel([
      Animated.spring(scale, { toValue: focused ? 1 : 0.88, tension: 80, friction: 7, useNativeDriver: true }),
      Animated.timing(bg,    { toValue: focused ? 1 : 0, duration: 200, useNativeDriver: false }),
    ]).start();
  }, [focused]);

  const bgColor = bg.interpolate({
    inputRange: [0, 1], outputRange: ['rgba(0,0,0,0)', color + '18'],
  });

  return (
    <Animated.View style={[s.tabItem, { transform: [{ scale }], backgroundColor: bgColor }]}>
      <Text style={[s.tabEmoji, focused && s.tabEmojiActive]}>{emoji}</Text>
      <Text style={[s.tabLabel, focused && { color, fontWeight: '800' }]}>{label}</Text>
    </Animated.View>
  );
}

function AppTabs() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const tabW = Math.min(width - 32, 680);
  const left = (width - tabW) / 2;

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        sceneStyle: { backgroundColor: C.g50 },
        tabBarStyle: {
          position:       'absolute',
          left,
          right:          left,
          bottom:         Platform.OS === 'ios' ? insets.bottom + 8 : 12,
          width:          tabW,
          height:         60,
          borderTopWidth: 0,
          borderRadius:   22,
          backgroundColor: C.n0,
          paddingHorizontal: 6,
          ...Platform.select({
            web:     { boxShadow: '0 -2px 32px rgba(0,0,0,0.12), 0 4px 16px rgba(0,0,0,0.06)' },
            default: {
              shadowColor: '#000', shadowOffset: { width: 0, height: -4 },
              shadowOpacity: 0.12, shadowRadius: 24, elevation: 20,
            },
          }),
        },
      }}
    >
      {TABS.map(({ name, emoji, Screen, color }) => (
        <Tab.Screen
          key={name}
          name={name}
          component={Screen}
          options={{
            title: 'AgroSense AI',
            tabBarIcon: ({ focused }) => (
              <TabIcon emoji={emoji} label={name} focused={focused} color={color} />
            ),
          }}
        />
      ))}
    </Tab.Navigator>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <GluestackUIProvider config={config}>
        <PaperProvider theme={theme}>
          <GlobalProvider>
            <NavigationContainer>
              <AppTabs />
            </NavigationContainer>
          </GlobalProvider>
        </PaperProvider>
      </GluestackUIProvider>
    </SafeAreaProvider>
  );
}

const s = StyleSheet.create({
  tabItem: {
    alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 14, paddingVertical: 5,
    borderRadius: 14, gap: 2, minWidth: 70,
  },
  tabEmoji:       { fontSize: 18 },
  tabEmojiActive: { fontSize: 20 },
  tabLabel:       { fontSize: 10, fontWeight: '600', color: C.n400 },
});
