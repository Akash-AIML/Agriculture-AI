import React, { useRef, useEffect, useState } from 'react';
import {
  Animated, StyleSheet, View, Text, Pressable, Platform,
  useWindowDimensions,
} from 'react-native';
import { Surface, Chip, ProgressBar } from 'react-native-paper';
import { Box } from '@gluestack-ui/themed';
import { C, SH, BP, useBarFill, useEntrance, useSpringIn, usePulse } from './tokens';

// ── AnimatedSurface — paper Surface with entrance animation ──────────────────
export function AnimCard({ children, style, delay = 0, elevation = 2, accent }) {
  const anim = useEntrance(delay, 20);
  return (
    <Animated.View style={[anim, style]}>
      <Surface
        style={[
          s.card,
          SH.sm,
          accent && { borderLeftWidth: 3, borderLeftColor: accent },
        ]}
        elevation={elevation}
      >
        {children}
      </Surface>
    </Animated.View>
  );
}

// ── Animated confidence bar ───────────────────────────────────────────────────
export function AnimConfBar({ value = 0, label, active }) {
  const pct   = Math.min(100, Math.max(0, value));
  const color = pct >= 75 ? C.accent : pct >= 50 ? C.a600 : C.r600;
  const anim  = useBarFill(pct / 100, active);

  return (
    <View style={{ marginVertical: 5 }}>
      {label && (
        <View style={s.barLabelRow}>
          <Text style={s.barLabel} numberOfLines={1}>{label}</Text>
          <Text style={[s.barPct, { color }]}>{pct.toFixed(1)}%</Text>
        </View>
      )}
      <View style={s.barTrack}>
        <Animated.View style={[s.barFill, {
          backgroundColor: color,
          width: anim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }),
        }]} />
      </View>
    </View>
  );
}

// ── GradientHeader — SVG-based gradient banner ────────────────────────────────
export function GradientHeader({ badge, title, subtitle, emoji, color1 = C.accent, color2 = C.accentDark, style }) {
  const anim = useEntrance(0, -16);
  return (
    <Animated.View style={[anim, style]}>
      <Surface style={[s.gradHeader, SH.md]} elevation={3}>
        {/* Decorative circles */}
        <View style={[s.circle1, { backgroundColor: color1 + '22' }]} />
        <View style={[s.circle2, { backgroundColor: color2 + '15' }]} />
        <View style={s.gradContent}>
          <View style={{ flex: 1 }}>
            <View style={[s.badgePill, { backgroundColor: color1 + '20', borderColor: color1 + '40' }]}>
              <Text style={[s.badgeText, { color: color1 }]}>{badge}</Text>
            </View>
            <Text style={[s.headerTitle, { color: C.n900 }]}>{title}</Text>
            <Text style={[s.headerSub, { color: C.n500 }]}>{subtitle}</Text>
          </View>
          <View style={[s.emojiBox, { backgroundColor: color1 + '18', borderColor: color1 + '35' }]}>
            <Text style={s.emojiText}>{emoji}</Text>
          </View>
        </View>
      </Surface>
    </Animated.View>
  );
}

// ── AnimUploadZone ────────────────────────────────────────────────────────────
export function AnimUploadZone({ onPress, borderColor = C.g200, color = C.accent }) {
  const scale  = useRef(new Animated.Value(1)).current;
  const onIn   = () => Animated.spring(scale, { toValue: 0.97, useNativeDriver: true }).start();
  const onOut  = () => Animated.spring(scale, { toValue: 1,    useNativeDriver: true }).start();
  const anim   = useEntrance(120);

  return (
    <Animated.View style={[anim, { transform: [{ scale }] }]}>
      <Pressable
        onPress={onPress}
        onPressIn={onIn}
        onPressOut={onOut}
        style={[s.uploadZone, { borderColor }]}
      >
        <View style={[s.uploadIconWrap, { backgroundColor: borderColor + '60' }]}>
          <Text style={{ fontSize: 28 }}>📷</Text>
        </View>
        <Text style={[s.uploadTitle, { color: C.n700 }]}>Choose Image</Text>
        <Text style={[s.uploadHint, { color: C.n400 }]}>JPG · PNG · Max 10 MB</Text>
        <View style={[s.uploadPill, { backgroundColor: color + '15', borderColor: color + '40' }]}>
          <Text style={[s.uploadPillText, { color }]}>Browse Files</Text>
        </View>
      </Pressable>
    </Animated.View>
  );
}

// ── AnimButton — spring press + glow ─────────────────────────────────────────
export function AnimBtn({ label, onPress, disabled, loading, color = C.accent, icon, style }) {
  const scale   = useRef(new Animated.Value(1)).current;
  const opacity = usePulse(loading);
  const onIn    = () => !disabled && Animated.spring(scale, { toValue: 0.96, useNativeDriver: true }).start();
  const onOut   = () => Animated.spring(scale, { toValue: 1, tension: 80, friction: 5, useNativeDriver: true }).start();

  return (
    <Animated.View style={[{ transform: [{ scale }] }, style]}>
      <Pressable
        onPress={onPress}
        onPressIn={onIn}
        onPressOut={onOut}
        disabled={disabled || loading}
        style={[
          s.btn,
          { backgroundColor: color },
          SH.green,
          (disabled || loading) && { opacity: 0.55 },
        ]}
      >
        <Animated.Text style={[s.btnText, loading && { opacity }]}>
          {loading ? '⏳  Processing…' : `${icon ? icon + '  ' : ''}${label}`}
        </Animated.Text>
      </Pressable>
    </Animated.View>
  );
}

// ── GhostBtn ──────────────────────────────────────────────────────────────────
export function GhostBtn({ label, onPress }) {
  return (
    <Pressable style={s.ghostBtn} onPress={onPress}>
      <Text style={s.ghostBtnText}>{label}</Text>
    </Pressable>
  );
}

// ── AnimResultCard — spring-pops on appear ────────────────────────────────────
export function AnimResultCard({ children, visible, style, elevation = 2 }) {
  const anim = useSpringIn(visible);
  if (!visible) return null;
  return (
    <Animated.View style={[anim, style]}>
      <Surface style={[s.resultCard, SH.sm]} elevation={elevation}>
        {children}
      </Surface>
    </Animated.View>
  );
}

// ── StatusBadge ───────────────────────────────────────────────────────────────
export function StatusBadge({ healthy, disease, confidence, uncertain }) {
  const anim = useSpringIn(true);
  const bg   = healthy ? C.g100 : C.r100;
  const bd   = healthy ? C.g200 : C.r200;
  const tc   = healthy ? C.g800 : C.r700;

  return (
    <Animated.View style={[anim, { borderRadius: 16, overflow: 'hidden' }]}>
      <Surface style={[s.statusCard, { backgroundColor: bg, borderColor: bd }, SH.xs]} elevation={0}>
        <View style={[s.statusDot, { backgroundColor: healthy ? C.g500 : C.r500 }]} />
        <View style={{ flex: 1 }}>
          <Text style={[s.statusTag, { color: healthy ? C.accent : C.r600 }]}>
            {healthy ? '✓  HEALTHY' : '✗  DISEASE DETECTED'}
          </Text>
          <Text style={[s.statusName, { color: tc }]} numberOfLines={2}>{disease}</Text>
          {uncertain && (
            <Chip
              icon="alert"
              style={[s.warnChip]}
              textStyle={{ fontSize: 11, color: C.a700 }}
              compact
            >
              Low confidence
            </Chip>
          )}
        </View>
        <View style={s.statusPct}>
          <Text style={[s.statusPctNum, { color: tc }]}>{confidence?.toFixed(0)}%</Text>
          <Text style={[s.statusPctLabel, { color: tc + 'aa' }]}>conf.</Text>
        </View>
      </Surface>
    </Animated.View>
  );
}

// ── TreatmentItem ─────────────────────────────────────────────────────────────
export function TreatmentItem({ text, index }) {
  const anim = useEntrance(index * 80, 12);
  return (
    <Animated.View style={[anim, s.treatRow]}>
      <View style={s.treatNum}><Text style={s.treatNumText}>{index + 1}</Text></View>
      <Text style={s.treatText}>{text}</Text>
    </Animated.View>
  );
}

// ── SoilTypeHero ──────────────────────────────────────────────────────────────
export function SoilTypeHero({ soilType, confidence, theme, cached }) {
  const anim = useSpringIn(true);
  return (
    <Animated.View style={anim}>
      <Surface style={[s.soilHero, { backgroundColor: theme.bg, borderColor: theme.border }, SH.xs]} elevation={0}>
        <View style={[s.soilAccentBar, { backgroundColor: theme.accent }]} />
        <View style={{ flex: 1, paddingLeft: 14 }}>
          <Text style={[s.soilLabel, { color: theme.accent }]}>DETECTED SOIL TYPE</Text>
          <Text style={[s.soilName,  { color: theme.text  }]}>{soilType}</Text>
        </View>
        <View style={{ alignItems: 'flex-end', gap: 6 }}>
          <View style={[s.soilPct, { backgroundColor: theme.accent + '20' }]}>
            <Text style={[s.soilPctText, { color: theme.accent }]}>{confidence?.toFixed(1)}%</Text>
          </View>
          {cached && (
            <Chip compact style={s.cacheChip} textStyle={{ fontSize: 10, color: C.a700 }} icon="lightning-bolt">
              Cached
            </Chip>
          )}
        </View>
      </Surface>
    </Animated.View>
  );
}

// ── PropRow — 3-col property grid ─────────────────────────────────────────────
export function PropGrid({ items }) {
  return (
    <View style={s.propGrid}>
      {items.map((item, i) => {
        const anim = useEntrance(i * 60, 8);
        return (
          <Animated.View key={i} style={[anim, s.propCell]}>
            <Surface style={[s.propCard, SH.xs]} elevation={1}>
              <Text style={s.propIcon}>{item.icon}</Text>
              <Text style={s.propKey}>{item.label}</Text>
              <Text style={s.propVal}>{item.value || '—'}</Text>
            </Surface>
          </Animated.View>
        );
      })}
    </View>
  );
}

// ── CropHero ──────────────────────────────────────────────────────────────────
export function CropHero({ crop, tip, cached }) {
  const anim = useSpringIn(true);
  return (
    <Animated.View style={anim}>
      <Surface style={[s.cropHero, SH.md]} elevation={3}>
        <View style={s.cropHeroBg} />
        <Text style={s.cropHeroLabel}>BEST CROP FOR YOUR FIELD</Text>
        <Text style={s.cropHeroEmoji}>🌱</Text>
        <Text style={s.cropHeroName}>{crop}</Text>
        {tip && <Text style={s.cropHeroTip}>{tip}</Text>}
        {cached && (
          <Chip compact style={s.cacheChip} textStyle={{ fontSize: 10, color: C.a700 }} icon="lightning-bolt">
            Cached result
          </Chip>
        )}
      </Surface>
    </Animated.View>
  );
}

// ── AltRow — ranked crop alternative ─────────────────────────────────────────
export function AltRow({ rec, index }) {
  const anim   = useEntrance(index * 70, 10);
  const MEDALS = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣'];
  const fill   = useBarFill(rec.probability / 100, true, 700 + index * 120);
  return (
    <Animated.View style={[anim, s.altRow]}>
      <Text style={s.medal}>{MEDALS[index] || `#${index + 1}`}</Text>
      <Text style={s.altName}>{rec.crop}</Text>
      <View style={s.altTrack}>
        <Animated.View style={[s.altFill, {
          width: fill.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }),
        }]} />
      </View>
      <Text style={s.altPct}>{rec.probability.toFixed(1)}%</Text>
    </Animated.View>
  );
}

// ── EmptyState ────────────────────────────────────────────────────────────────
export function EmptyState({ icon, title, sub }) {
  const anim = useEntrance(80);
  return (
    <Animated.View style={[anim, s.emptyWrap]}>
      <Text style={s.emptyIcon}>{icon}</Text>
      <Text style={s.emptyTitle}>{title}</Text>
      {sub && <Text style={s.emptySub}>{sub}</Text>}
    </Animated.View>
  );
}

// ── ErrorBox ──────────────────────────────────────────────────────────────────
export function ErrorBox({ message }) {
  if (!message) return null;
  return (
    <Surface style={[s.errBox, SH.xs]} elevation={0}>
      <Text style={s.errText}>⚠  {message}</Text>
    </Surface>
  );
}

// ── Section heading ───────────────────────────────────────────────────────────
export function SectionHead({ children, color = C.n400 }) {
  return (
    <Text style={[s.secHead, { color }]}>{children}</Text>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  card: { borderRadius: 18, overflow: 'hidden', backgroundColor: C.n0 },

  barLabelRow:  { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
  barLabel:     { fontSize: 13, color: C.n600, flex: 1, marginRight: 8 },
  barPct:       { fontSize: 13, fontWeight: '700', minWidth: 46, textAlign: 'right' },
  barTrack:     { height: 8, backgroundColor: C.n200, borderRadius: 4, overflow: 'hidden' },
  barFill:      { height: '100%', borderRadius: 4 },

  gradHeader:   { borderRadius: 20, overflow: 'hidden', backgroundColor: C.n0 },
  circle1:      { position: 'absolute', width: 180, height: 180, borderRadius: 90, top: -60, right: -40 },
  circle2:      { position: 'absolute', width: 120, height: 120, borderRadius: 60, bottom: -30, right: 60 },
  gradContent:  { flexDirection: 'row', alignItems: 'center', padding: 22, gap: 14 },
  badgePill:    { alignSelf: 'flex-start', borderRadius: 999, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 3, marginBottom: 8 },
  badgeText:    { fontSize: 10, fontWeight: '700', letterSpacing: 1.2 },
  headerTitle:  { fontSize: 26, fontWeight: '800', lineHeight: 32, marginBottom: 6 },
  headerSub:    { fontSize: 13, lineHeight: 19 },
  emojiBox:     { width: 64, height: 64, borderRadius: 18, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  emojiText:    { fontSize: 30 },

  uploadZone:   {
    minHeight: 190, borderRadius: 18, borderWidth: 2, borderStyle: 'dashed',
    backgroundColor: C.n50, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 4,
  },
  uploadIconWrap:{ width: 64, height: 64, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  uploadTitle:  { fontSize: 16, fontWeight: '700' },
  uploadHint:   { fontSize: 12, marginTop: 2 },
  uploadPill:   { marginTop: 12, paddingHorizontal: 20, paddingVertical: 8, borderRadius: 999, borderWidth: 1 },
  uploadPillText:{ fontSize: 13, fontWeight: '700' },

  btn:        { height: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginTop: 16 },
  btnText:    { color: C.n0, fontWeight: '800', fontSize: 15, letterSpacing: 0.3 },
  ghostBtn:   { alignItems: 'center', paddingVertical: 12 },
  ghostBtnText:{ fontSize: 13, color: C.n400, fontWeight: '500' },

  resultCard: { borderRadius: 16, backgroundColor: C.n0 },

  statusCard:   { borderRadius: 16, borderWidth: 1, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12 },
  statusDot:    { width: 10, height: 10, borderRadius: 5, marginTop: 2 },
  statusTag:    { fontSize: 10, fontWeight: '700', letterSpacing: 1.2, marginBottom: 4 },
  statusName:   { fontSize: 18, fontWeight: '800', lineHeight: 24 },
  warnChip:     { marginTop: 8, alignSelf: 'flex-start', backgroundColor: C.a100 },
  statusPct:    { alignItems: 'center' },
  statusPctNum: { fontSize: 26, fontWeight: '900' },
  statusPctLabel:{ fontSize: 10, fontWeight: '600', letterSpacing: 0.5 },

  treatRow:    { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginTop: 10 },
  treatNum:    { width: 22, height: 22, borderRadius: 11, backgroundColor: C.a600, alignItems: 'center', justifyContent: 'center', marginTop: 1 },
  treatNumText:{ fontSize: 11, fontWeight: '800', color: C.n0 },
  treatText:   { flex: 1, fontSize: 14, color: C.n700, lineHeight: 21 },

  soilHero:        { borderRadius: 16, borderWidth: 1, overflow: 'hidden', flexDirection: 'row', alignItems: 'center', paddingRight: 16, paddingVertical: 14 },
  soilAccentBar:   { width: 5, alignSelf: 'stretch', borderTopRightRadius: 0, borderBottomRightRadius: 0 },
  soilLabel:       { fontSize: 10, fontWeight: '700', letterSpacing: 1.2, marginBottom: 4 },
  soilName:        { fontSize: 24, fontWeight: '800' },
  soilPct:         { borderRadius: 10, paddingHorizontal: 10, paddingVertical: 5 },
  soilPctText:     { fontSize: 15, fontWeight: '800' },
  cacheChip:       { backgroundColor: C.a100 },

  propGrid: { flexDirection: 'row', gap: 8, marginTop: 4 },
  propCell: { flex: 1 },
  propCard: { borderRadius: 14, padding: 12, alignItems: 'center', backgroundColor: C.n0 },
  propIcon: { fontSize: 22, marginBottom: 4 },
  propKey:  { fontSize: 9, fontWeight: '700', color: C.n400, letterSpacing: 0.8, textAlign: 'center', textTransform: 'uppercase' },
  propVal:  { fontSize: 13, fontWeight: '700', color: C.n800, textAlign: 'center', marginTop: 2 },

  cropHero:     { borderRadius: 20, padding: 24, alignItems: 'center', backgroundColor: C.g100, overflow: 'hidden' },
  cropHeroBg:   { position: 'absolute', width: 200, height: 200, borderRadius: 100, backgroundColor: C.g200 + '60', top: -60, right: -60 },
  cropHeroLabel:{ fontSize: 10, fontWeight: '700', letterSpacing: 1.4, color: C.accent, marginBottom: 10 },
  cropHeroEmoji:{ fontSize: 56 },
  cropHeroName: { fontSize: 28, fontWeight: '900', color: C.g900, textTransform: 'capitalize', marginTop: 8, textAlign: 'center' },
  cropHeroTip:  { fontSize: 13, color: C.g700, textAlign: 'center', marginTop: 8, lineHeight: 20, maxWidth: 280 },

  altRow:   { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 10 },
  medal:    { fontSize: 18, minWidth: 28 },
  altName:  { fontSize: 13, fontWeight: '600', color: C.n800, minWidth: 80, textTransform: 'capitalize' },
  altTrack: { flex: 1, height: 7, backgroundColor: C.n200, borderRadius: 4, overflow: 'hidden' },
  altFill:  { height: '100%', backgroundColor: C.accent, borderRadius: 4 },
  altPct:   { fontSize: 12, fontWeight: '700', color: C.accent, minWidth: 42, textAlign: 'right' },

  emptyWrap:  { alignItems: 'center', justifyContent: 'center', minHeight: 220, padding: 24, backgroundColor: C.n50, borderRadius: 18, borderWidth: 1, borderColor: C.n200 },
  emptyIcon:  { fontSize: 44, marginBottom: 12 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: C.n700, textAlign: 'center' },
  emptySub:   { fontSize: 13, color: C.n400, textAlign: 'center', marginTop: 6, lineHeight: 20, maxWidth: 260 },

  errBox: { backgroundColor: C.r50, borderRadius: 12, padding: 12, borderWidth: 1, borderColor: C.r200, marginTop: 12 },
  errText:{ fontSize: 13, color: C.r700 },

  secHead:{ fontSize: 10, fontWeight: '800', letterSpacing: 1.4, textTransform: 'uppercase', marginBottom: 10, marginTop: 2 },
});
