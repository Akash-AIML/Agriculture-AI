import { useEffect, useRef } from 'react';
import { Animated, Easing, Platform, useWindowDimensions, StyleSheet } from 'react-native';

// ── Breakpoints ───────────────────────────────────────────────────────────────
export const BP = { sm: 480, md: 768, lg: 1024, xl: 1280 };
export function useBreakpoint() {
  const { width, height } = useWindowDimensions();
  return {
    width, height,
    isMobile:  width < BP.md,
    isTablet:  width >= BP.md && width < BP.lg,
    isDesktop: width >= BP.lg,
    isXL:      width >= BP.xl,
  };
}

// ── Tab bar height ────────────────────────────────────────────────────────────
export const TAB_H = Platform.OS === 'ios' ? 90 : 72;

// ── Colors ────────────────────────────────────────────────────────────────────
export const C = {
  // Brand greens
  g50: '#f0fdf4', g100: '#dcfce7', g200: '#bbf7d0', g300: '#86efac',
  g400: '#4ade80', g500: '#22c55e', g600: '#16a34a', g700: '#15803d',
  g800: '#166534', g900: '#14532d',
  // Accent
  accent: '#059669', accentDark: '#047857', accentLight: '#ecfdf5',
  // Amber
  a50: '#fffbeb', a100: '#fef3c7', a200: '#fde68a', a300: '#fcd34d',
  a500: '#f59e0b', a600: '#d97706', a700: '#b45309', a900: '#78350f',
  // Red
  r50: '#fef2f2', r100: '#fee2e2', r200: '#fecaca',
  r500: '#ef4444', r600: '#dc2626', r700: '#b91c1c',
  // Neutral
  n0:   '#ffffff', n50:  '#f8fafc', n100: '#f1f5f9', n200: '#e2e8f0',
  n300: '#cbd5e1', n400: '#94a3b8', n500: '#64748b',
  n600: '#475569', n700: '#374151', n800: '#1f2937', n900: '#0f172a',
  // Blue
  b50: '#eff6ff', b100: '#dbeafe', b500: '#3b82f6', b600: '#2563eb',
};

// ── Typography ────────────────────────────────────────────────────────────────
export const FONT = {
  display: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  body:    Platform.OS === 'ios' ? 'System'  : 'sans-serif',
};

// ── Shadows ───────────────────────────────────────────────────────────────────
export const SH = {
  xs: Platform.select({ web: { boxShadow: '0 1px 3px rgba(0,0,0,0.06)' },
        default: { shadowColor:'#000', shadowOpacity:.04, shadowRadius:4,  shadowOffset:{width:0,height:1}, elevation:1 }}),
  sm: Platform.select({ web: { boxShadow: '0 2px 8px rgba(0,0,0,0.08)' },
        default: { shadowColor:'#000', shadowOpacity:.07, shadowRadius:8,  shadowOffset:{width:0,height:3}, elevation:3 }}),
  md: Platform.select({ web: { boxShadow: '0 4px 20px rgba(0,0,0,0.10)' },
        default: { shadowColor:'#000', shadowOpacity:.10, shadowRadius:16, shadowOffset:{width:0,height:6}, elevation:6 }}),
  lg: Platform.select({ web: { boxShadow: '0 8px 40px rgba(0,0,0,0.14)' },
        default: { shadowColor:'#000', shadowOpacity:.14, shadowRadius:28, shadowOffset:{width:0,height:10},elevation:12 }}),
  green: Platform.select({ web: { boxShadow: '0 4px 20px rgba(5,150,105,0.30)' },
        default: { shadowColor:C.accent, shadowOpacity:.35, shadowRadius:12, shadowOffset:{width:0,height:4}, elevation:6 }}),
};

// ── Animation hooks ───────────────────────────────────────────────────────────

/** Fade + slide-up entrance on mount */
export function useEntrance(delay = 0, dy = 24) {
  const opacity   = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(dy)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1, duration: 380, delay,
        easing: Easing.out(Easing.quad), useNativeDriver: true,
      }),
      Animated.spring(translateY, {
        toValue: 0, delay, tension: 60, friction: 10, useNativeDriver: true,
      }),
    ]).start();
  }, []);
  return { opacity, transform: [{ translateY }] };
}

/** Animated value that fills from 0 → target on trigger */
export function useBarFill(target, trigger, duration = 900) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (trigger) {
      Animated.timing(anim, {
        toValue: target, duration,
        easing: Easing.out(Easing.exp), useNativeDriver: false,
      }).start();
    } else {
      anim.setValue(0);
    }
  }, [trigger, target]);
  return anim;
}

/** Continuous pulse glow (for loading state) */
export function usePulse(active) {
  const anim = useRef(new Animated.Value(0.5)).current;
  useEffect(() => {
    if (active) {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(anim, { toValue: 1,   duration: 700, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
          Animated.timing(anim, { toValue: 0.5, duration: 700, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        ])
      );
      loop.start();
      return () => loop.stop();
    } else {
      anim.setValue(1);
    }
  }, [active]);
  return anim;
}

/** Spring pop for result cards appearing */
export function useSpringIn(trigger) {
  const scale   = useRef(new Animated.Value(0.88)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (trigger) {
      Animated.parallel([
        Animated.spring(scale,   { toValue: 1, tension: 65, friction: 8, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 1, duration: 260, easing: Easing.out(Easing.quad), useNativeDriver: true }),
      ]).start();
    }
  }, [trigger]);
  return { opacity, transform: [{ scale }] };
}

/** Shimmer loading skeleton */
export function useShimmer() {
  const x = useRef(new Animated.Value(-1)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(x, { toValue: 1, duration: 1100, easing: Easing.inOut(Easing.quad), useNativeDriver: true })
    );
    loop.start();
    return () => loop.stop();
  }, []);
  return x;
}
