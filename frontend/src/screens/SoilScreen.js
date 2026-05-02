import React, { useState, useContext } from 'react';
import { Platform, StyleSheet, View, Text, ScrollView, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Surface, Chip } from 'react-native-paper';
import { VStack } from '@gluestack-ui/themed';
import * as ImagePicker from 'expo-image-picker';
import { Image } from '@gluestack-ui/themed';
import { analyzeCrop } from '../api';
import { GlobalContext } from '../context/GlobalState';
import { C, SH, BP, TAB_H } from '../design/tokens';
import {
  GradientHeader, AnimCard, AnimConfBar, AnimUploadZone,
  AnimBtn, GhostBtn, AnimResultCard, SoilTypeHero,
  PropGrid, EmptyState, ErrorBox, SectionHead,
} from '../components/ui';
import { Animated } from 'react-native';
import { useEntrance } from '../design/tokens';

const SOIL_THEME = {
  Clay: { bg: C.a100, border: C.a200, text: C.a900, accent: C.a600 },
  Loamy: { bg: C.g100, border: C.g200, text: C.g800, accent: C.accent },
  Red: { bg: C.r100, border: C.r200, text: C.r700, accent: C.r600 },
  Sandy: { bg: '#fef9c3', border: '#fde68a', text: '#713f12', accent: '#ca8a04' },
};
const DEFAULT_THEME = { bg: C.g100, border: C.g200, text: C.g800, accent: C.accent };

function CropPill({ label, theme, index }) {
  const anim = useEntrance(index * 50, 6);
  return (
    <Animated.View style={anim}>
      <Chip
        style={[s.cropChip, { backgroundColor: theme.bg, borderColor: theme.border }]}
        textStyle={{ fontSize: 12, color: theme.text, fontWeight: '700' }}
        compact
      >
        {label}
      </Chip>
    </Animated.View>
  );
}

function TipRow({ tip, index }) {
  const anim = useEntrance(index * 70, 10);
  return (
    <Animated.View style={[anim, s.tipRow]}>
      <View style={s.tipArrow}><Text style={s.tipArrowText}>→</Text></View>
      <Text style={s.tipText}>{tip}</Text>
    </Animated.View>
  );
}

export default function SoilScreen() {
  const { updateResult } = useContext(GlobalContext);
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const isWide = width >= BP.md;

  const [uri, setUri] = useState(null);
  const [loading, setLoad] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const bottomPad = TAB_H + insets.bottom + 16;
  const maxW = width >= BP.xl ? 1400 : width >= BP.lg ? 1100 : '100%';
  const theme = result ? (SOIL_THEME[result.soil_type] || DEFAULT_THEME) : DEFAULT_THEME;
  const props = result?.properties || result || {};

  const pick = async () => {
    const r = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true, aspect: [1, 1], quality: 0.85,
    });
    if (!r.canceled) { setUri(r.assets[0].uri); setResult(null); setError(null); }
  };
  const clear = () => { setUri(null); setResult(null); setError(null); updateResult('soil', null); };

  const analyze = async () => {
    if (!uri) return;
    setLoad(true); setError(null);
    try {
      const fd = new FormData();
      const fn = uri.split('/').pop() || 'image.jpg';
      const tp = (/\.(\w+)$/.exec(fn)?.[1]) ? `image/${/\.(\w+)$/.exec(fn)[1]}` : 'image/jpeg';
      if (Platform.OS === 'web') {
        const blob = await (await fetch(uri)).blob();
        fd.append('file', new File([blob], fn, { type: tp }));
      } else {
        fd.append('file', { uri, name: fn, type: tp });
      }
      const data = await analyzeCrop('soil', fd);
      setResult(data); updateResult('soil', data);
    } catch (e) { setError(e.message); }
    finally { setLoad(false); }
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: '#fffdf5' }}
      contentContainerStyle={{ paddingBottom: bottomPad }}
      showsVerticalScrollIndicator={false}
    >
      <View style={{ maxWidth: maxW, width: '100%', alignSelf: 'center', padding: 16, gap: 16 }}>

        <GradientHeader
          badge="🪨  SOIL INTELLIGENCE"
          title="Soil Type Analyzer"
          subtitle="Classify soil from a photo and get growing suitability insights."
          emoji="🌱"
          color1={C.a600}
          color2={C.a900}
        />

        <View style={[{ gap: 16 }, isWide && { flexDirection: 'row', alignItems: 'flex-start' }]}>

          {/* Upload */}
          <AnimCard delay={100} style={isWide && { flex: 1 }}>
            <View style={s.inner}>
              <Text style={s.panelTitle}>Image Upload</Text>
              {!uri ? (
                <AnimUploadZone onPress={pick} borderColor={C.a200} color={C.a600} />
              ) : (
                <View style={s.previewWrap}>
                  <Image source={{ uri }} alt="soil" style={s.preview} resizeMode="cover" />
                  <View style={s.previewOverlay}>
                    <Chip
                      icon="camera"
                      onPress={pick}
                      style={s.changeChip}
                      textStyle={{ color: C.n0, fontSize: 12, fontWeight: '700' }}
                    >
                      Change Photo
                    </Chip>
                  </View>
                </View>
              )}
              <AnimBtn label="Analyze Soil" icon="🪨" onPress={analyze} disabled={!uri} loading={loading} color={C.a600} />
              {uri && !loading && <GhostBtn label="Clear image" onPress={clear} />}
              <ErrorBox message={error} />
            </View>
          </AnimCard>

          {/* Results */}
          <AnimCard delay={200} style={isWide && { flex: 1 }}>
            <View style={s.inner}>
              <Text style={s.panelTitle}>Soil Report</Text>
              {!result ? (
                <EmptyState icon="🌱" title="No report yet" sub="Analyze a soil image to view classification and insights." />
              ) : (
                <VStack space="md">
                  <SoilTypeHero
                    soilType={result.soil_type}
                    confidence={result.confidence}
                    theme={theme}
                    cached={result.cached}
                  />

                  <AnimResultCard visible style={[s.metric, { backgroundColor: C.n50, borderColor: C.n200 }]}>
                    <View style={s.metricIn}>
                      <SectionHead>CONFIDENCE SCORE</SectionHead>
                      <AnimConfBar value={result.confidence} active={!!result} />
                    </View>
                  </AnimResultCard>

                  <PropGrid items={[
                    { icon: '💧', label: 'Water Retention', value: props.water_retention },
                    { icon: '🌊', label: 'Drainage', value: props.drainage },
                    { icon: '🌿', label: 'Fertility', value: props.fertility },
                  ]} />

                  {props.suitable_crops?.length > 0 && (
                    <AnimResultCard visible style={[s.metric, { backgroundColor: theme.bg, borderColor: theme.border }]}>
                      <View style={s.metricIn}>
                        <SectionHead color={theme.accent}>SUITABLE CROPS</SectionHead>
                        <View style={s.chipRow}>
                          {props.suitable_crops.map((c, i) => (
                            <CropPill key={i} label={c} theme={theme} index={i} />
                          ))}
                        </View>
                      </View>
                    </AnimResultCard>
                  )}

                  {props.tips?.length > 0 && (
                    <AnimResultCard visible style={[s.metric, { backgroundColor: C.g50, borderColor: C.g200 }]}>
                      <View style={s.metricIn}>
                        <SectionHead color={C.g700}>MANAGEMENT TIPS</SectionHead>
                        {props.tips.map((tip, i) => <TipRow key={i} tip={tip} index={i} />)}
                      </View>
                    </AnimResultCard>
                  )}

                  {result.all_classes?.length > 1 && (
                    <AnimResultCard visible style={[s.metric, { borderColor: C.n200 }]}>
                      <View style={s.metricIn}>
                        <SectionHead>ALL SOIL CLASSES</SectionHead>
                        {result.all_classes.map((item, i) => (
                          <AnimConfBar key={i} value={item.confidence} label={item.label} active={!!result} />
                        ))}
                      </View>
                    </AnimResultCard>
                  )}
                </VStack>
              )}
            </View>
          </AnimCard>
        </View>
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  inner: { padding: 20 },
  panelTitle: { fontSize: 15, fontWeight: '800', color: C.n800, marginBottom: 16 },
  previewWrap: { borderRadius: 16, overflow: 'hidden', height: 200 },
  preview: { width: '100%', height: '100%' },
  previewOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(0,0,0,0.45)', paddingVertical: 10, alignItems: 'center' },
  changeChip: { backgroundColor: 'rgba(255,255,255,0.2)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.4)' },
  metric: { borderRadius: 14, borderWidth: 1 },
  metricIn: { padding: 14 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 4 },
  cropChip: { borderWidth: 1 },
  tipRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginTop: 8 },
  tipArrow: { width: 22, height: 22, borderRadius: 11, backgroundColor: C.accent, alignItems: 'center', justifyContent: 'center', marginTop: 1 },
  tipArrowText: { color: C.n0, fontWeight: '800', fontSize: 12 },
  tipText: { flex: 1, fontSize: 14, color: C.n700, lineHeight: 20 },
});
