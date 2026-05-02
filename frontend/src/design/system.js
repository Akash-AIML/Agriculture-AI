import React from 'react';
import {
  StyleSheet, View, Text, Pressable,
  useWindowDimensions, Platform,
} from 'react-native';

// ── Breakpoints ───────────────────────────────────────────────────────────────
export const BP = { sm: 480, md: 768, lg: 1024, xl: 1280 };

export function useBreakpoint() {
  const { width } = useWindowDimensions();
  return {
    width,
    isMobile:  width < BP.md,
    isTablet:  width >= BP.md && width < BP.lg,
    isDesktop: width >= BP.lg,
    cols: width >= BP.lg ? 3 : width >= BP.md ? 2 : 1,
  };
}

// ── Tab bar height (used to offset scrollable content) ────────────────────────
export const TAB_BAR_HEIGHT = Platform.OS === 'ios' ? 88 : 72;

// ── Color tokens ──────────────────────────────────────────────────────────────
export const C = {
  green50:   '#f3fbf7', green100: '#dff3ea', green200: '#c2e9d8',
  green400:  '#4cb58a', green600: '#1f8f67', green700: '#166f4f',
  green800:  '#165843', green900: '#144235',
  amber50:   '#fff9ef', amber100: '#fef0d0', amber200: '#fce0a7',
  amber600:  '#c97a1f', amber700: '#9f5d17', amber900: '#6b3f0c',
  red50:     '#fef2f2', red100:  '#fde2e4', red200:  '#f8c7cb',
  red600:    '#c93f4a', red700:  '#a3313b',
  gray50:    '#f7f8fa', gray100: '#eef1f5', gray200: '#dde3ec',
  gray300:   '#c4cedc', gray400: '#8a97aa', gray500: '#627086',
  gray700:   '#334155', gray800: '#1f2937', gray900: '#0f172a',
  white:     '#ffffff',
  accent:    '#136f63',
  accentDark:'#0f5a51',
  blue50:    '#f4f8ff',
  blue100:   '#e2ecff',
  blue200:   '#c9dcff',
  blue700:   '#294f9e',
  surface:   '#f5fcef',
  surfaceLow:'#eff6e9',
  surfaceHigh:'#e3eade',
  outline:   '#707a6c',
};

// ── Typography ────────────────────────────────────────────────────────────────
export const T = StyleSheet.create({
  badge:   { fontSize: 10, fontWeight: '700', letterSpacing: 1.4, textTransform: 'uppercase' },
  h1:      { fontSize: 30, fontWeight: '800', lineHeight: 36 },
  h2:      { fontSize: 21, fontWeight: '700', lineHeight: 28 },
  h3:      { fontSize: 17, fontWeight: '700', lineHeight: 24 },
  body:    { fontSize: 14, lineHeight: 23 },
  small:   { fontSize: 12, lineHeight: 18 },
  tiny:    { fontSize: 10, lineHeight: 14 },
  label:   { fontSize: 11, fontWeight: '700', letterSpacing: 0.8 },
  mono:    { fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace', fontSize: 13 },
});

// ── Shared shadow ─────────────────────────────────────────────────────────────
export const SHADOW = {
  sm:  { shadowColor: '#0f172a', shadowOpacity: 0.05, shadowRadius: 8,  shadowOffset: { width: 0, height: 3 }, elevation: 2 },
  md:  { shadowColor: '#0f172a', shadowOpacity: 0.08, shadowRadius: 16, shadowOffset: { width: 0, height: 6 }, elevation: 4 },
  lg:  { shadowColor: '#0f172a', shadowOpacity: 0.12, shadowRadius: 24, shadowOffset: { width: 0, height: 10 }, elevation: 8 },
};

// ── Page wrapper (handles max-width centering + safe bottom padding) ───────────
export function PageContainer({ children, bg = C.green50, style }) {
  const { width } = useWindowDimensions();
  const maxW = width >= BP.xl ? 1200 : width >= BP.lg ? 1024 : '100%';
  return (
    <View style={[{ flex: 1, backgroundColor: bg }, style]}>
      <View style={{ flex: 1, width: '100%', maxWidth: maxW, alignSelf: 'center' }}>
        {children}
      </View>
    </View>
  );
}

// ── Card ──────────────────────────────────────────────────────────────────────
export function Card({ children, style, accent }) {
  return (
    <View style={[
      styles.card,
      SHADOW.sm,
      accent && { borderLeftWidth: 3, borderLeftColor: accent },
      style,
    ]}>
      {children}
    </View>
  );
}

export function LedgerBar({ compact = false }) {
  return (
    <View style={[styles.ledgerBar, compact && styles.ledgerBarCompact]}>
      <View style={styles.ledgerLeft}>
        <View style={styles.ledgerIconWrap}>
          <Text style={styles.ledgerIcon}>◎</Text>
        </View>
        <Text style={styles.ledgerTitle}>The Ledger</Text>
      </View>
      <Pressable style={styles.ledgerAction}>
        <Text style={styles.ledgerActionText}>⋯</Text>
      </Pressable>
    </View>
  );
}

export function HeroStats({ leftTitle, leftValue, rightTitle, rightValue }) {
  return (
    <View style={styles.heroStats}>
      <View style={styles.heroStat}>
        <Text style={styles.heroStatTitle}>{leftTitle}</Text>
        <Text style={styles.heroStatValue}>{leftValue}</Text>
      </View>
      <View style={styles.heroDivider} />
      <View style={styles.heroStat}>
        <Text style={styles.heroStatTitle}>{rightTitle}</Text>
        <Text style={styles.heroStatValue}>{rightValue}</Text>
      </View>
    </View>
  );
}

// ── Section badge ─────────────────────────────────────────────────────────────
export function Badge({ label, color = C.accent }) {
  return (
    <Text style={[T.badge, { color, marginBottom: 6 }]}>{label}</Text>
  );
}

// ── Confidence bar ────────────────────────────────────────────────────────────
export function ConfBar({ value, label, showLabel = true }) {
  const pct   = Math.min(100, Math.max(0, value || 0));
  const color = pct >= 75 ? C.accent : pct >= 50 ? C.amber600 : C.red600;
  return (
    <View style={{ marginTop: showLabel ? 4 : 0 }}>
      {showLabel && (
        <View style={styles.confLabelRow}>
          <Text style={[T.small, { color: C.gray700, flex: 1 }]} numberOfLines={1}>{label}</Text>
          <Text style={[T.small, { color, fontWeight: '700', minWidth: 44, textAlign: 'right' }]}>
            {pct.toFixed(1)}%
          </Text>
        </View>
      )}
      {!showLabel && (
        <Text style={[T.small, { color, fontWeight: '700', textAlign: 'right', marginBottom: 3 }]}>
          {pct.toFixed(1)}%
        </Text>
      )}
      <View style={styles.confTrack}>
        <View style={[styles.confFill, { width: `${pct}%`, backgroundColor: color }]} />
      </View>
    </View>
  );
}

// ── Primary button ────────────────────────────────────────────────────────────
export function PrimaryBtn({ label, onPress, disabled, loading, color = C.accent, icon }) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.primaryBtn,
        { backgroundColor: color },
        (disabled || loading) && { opacity: 0.5 },
        pressed && { transform: [{ scale: 0.98 }] },
      ]}
      onPress={onPress}
      disabled={disabled || loading}
    >
      {loading
        ? <Text style={styles.primaryBtnText}>⏳  Please wait…</Text>
        : <Text style={styles.primaryBtnText}>{icon ? `${icon} ` : ''}{label}</Text>
      }
    </Pressable>
  );
}

// ── Ghost / outline button ────────────────────────────────────────────────────
export function GhostBtn({ label, onPress, color = C.gray500 }) {
  return (
    <Pressable style={styles.ghostBtn} onPress={onPress}>
      <Text style={[T.small, { color, fontWeight: '600' }]}>{label}</Text>
    </Pressable>
  );
}

// ── Empty state ───────────────────────────────────────────────────────────────
export function EmptyState({ icon, title, sub, minHeight = 220 }) {
  return (
    <View style={[styles.emptyState, { minHeight }]}>
      <Text style={{ fontSize: 36, marginBottom: 10 }}>{icon}</Text>
      <Text style={[T.h3, { color: C.gray800, textAlign: 'center' }]}>{title}</Text>
      {sub && <Text style={[T.small, { color: C.gray400, marginTop: 6, textAlign: 'center', maxWidth: 260 }]}>{sub}</Text>}
    </View>
  );
}

// ── Error box ─────────────────────────────────────────────────────────────────
export function ErrorBox({ message }) {
  if (!message) return null;
  return (
    <View style={styles.errorBox}>
      <Text style={[T.small, { color: C.red700 }]}>⚠  {message}</Text>
    </View>
  );
}

// ── Upload zone ───────────────────────────────────────────────────────────────
export function UploadZone({ onPress, borderColor = C.green200 }) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.uploadZone,
        { borderColor },
        pressed && { backgroundColor: C.green100 },
      ]}
      onPress={onPress}
    >
      <Text style={{ fontSize: 30, marginBottom: 8, color: C.accent }}>⬆</Text>
      <Text style={[T.h3, { color: C.gray700 }]}>Upload Image</Text>
      <Text style={[T.small, { color: C.gray400, marginTop: 4 }]}>JPG or PNG, up to 10 MB</Text>
      <View style={[styles.uploadPill, { borderColor }]}>
        <Text style={[T.small, { color: C.accent, fontWeight: '700' }]}>Select File</Text>
      </View>
    </Pressable>
  );
}

// ── Image preview ─────────────────────────────────────────────────────────────
export function ImagePreview({ uri, onClear, Image: RNImage }) {
  return (
    <View style={styles.imgWrap}>
      <RNImage source={{ uri }} alt="preview" style={styles.img} resizeMode="cover" />
      <Pressable style={styles.imgOverlay} onPress={onClear}>
        <Text style={[T.small, { color: C.white, fontWeight: '700' }]}>Replace Image</Text>
      </Pressable>
    </View>
  );
}

// ── Pill tag ──────────────────────────────────────────────────────────────────
export function Pill({ label, bg = C.green100, color = C.green700, borderColor = C.green200 }) {
  return (
    <View style={[styles.pill, { backgroundColor: bg, borderColor }]}>
      <Text style={[T.tiny, { color, fontWeight: '700' }]}>{label}</Text>
    </View>
  );
}

// ── Section heading ───────────────────────────────────────────────────────────
export function SectionHead({ children }) {
  return (
    <Text style={[T.label, { color: C.gray400, marginBottom: 8, marginTop: 4 }]}>
      {children}
    </Text>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  card: {
    backgroundColor: C.white, borderRadius: 18, padding: 20,
    borderWidth: 1, borderColor: C.gray200,
  },
  ledgerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  ledgerBarCompact: { marginBottom: 10 },
  ledgerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  ledgerIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: C.green100,
    borderWidth: 1,
    borderColor: C.green200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ledgerIcon: { color: C.accent, fontSize: 13, fontWeight: '800' },
  ledgerTitle: { color: C.accent, fontSize: 24, fontWeight: '800' },
  ledgerAction: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: C.white,
    borderWidth: 1,
    borderColor: C.gray200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ledgerActionText: { color: C.gray500, fontSize: 20, lineHeight: 20 },
  heroStats: {
    marginTop: 14,
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: C.surfaceLow,
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: C.gray200,
    gap: 10,
  },
  heroStat: { minWidth: 96 },
  heroStatTitle: { color: C.gray400, fontSize: 10, fontWeight: '700', textTransform: 'uppercase' },
  heroStatValue: { color: C.gray800, fontSize: 13, fontWeight: '700', marginTop: 2 },
  heroDivider: { width: 1, alignSelf: 'stretch', backgroundColor: C.gray200 },
  confLabelRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  confTrack:    { height: 6, backgroundColor: C.gray200, borderRadius: 3, overflow: 'hidden' },
  confFill:     { height: '100%', borderRadius: 3 },

  primaryBtn: {
    height: 50, borderRadius: 14, alignItems: 'center',
    justifyContent: 'center', marginTop: 16,
  },
  primaryBtnText: { color: C.white, fontWeight: '700', fontSize: 15 },

  ghostBtn: { alignItems: 'center', paddingVertical: 10 },

  emptyState: {
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: C.gray50, borderRadius: 14,
    borderWidth: 1, borderColor: C.gray200, padding: 24,
  },

  errorBox: {
    marginTop: 12, backgroundColor: C.red50, borderRadius: 10,
    padding: 12, borderWidth: 1, borderColor: C.red200,
  },

  uploadZone: {
    minHeight: 190, borderRadius: 16, borderWidth: 2, borderStyle: 'dashed',
    backgroundColor: C.green50, alignItems: 'center',
    justifyContent: 'center', padding: 20, gap: 2,
  },
  uploadPill: {
    marginTop: 12, paddingHorizontal: 18, paddingVertical: 7,
    borderRadius: 999, borderWidth: 1, backgroundColor: C.white,
  },

  imgWrap:    { borderRadius: 14, overflow: 'hidden', height: 200 },
  img:        { width: '100%', height: '100%' },
  imgOverlay: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: 'rgba(0,0,0,0.5)', paddingVertical: 10, alignItems: 'center',
  },

  pill: {
    paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: 999, borderWidth: 1, margin: 3,
  },
});
