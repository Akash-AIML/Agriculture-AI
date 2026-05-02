import React, { useState, useContext } from 'react';
import {
  Platform, StyleSheet, View, Text, ScrollView,
  useWindowDimensions, Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Surface, Chip, Divider } from 'react-native-paper';
import { VStack, HStack } from '@gluestack-ui/themed';
import * as ImagePicker from 'expo-image-picker';
import { Image } from '@gluestack-ui/themed';
import { analyzeCrop } from '../api';
import { GlobalContext } from '../context/GlobalState';
import { C, SH, BP, TAB_H, useEntrance } from '../design/tokens';
import {
  GradientHeader, AnimCard, AnimConfBar, AnimUploadZone,
  AnimBtn, GhostBtn, AnimResultCard, StatusBadge,
  TreatmentItem, EmptyState, ErrorBox, SectionHead,
} from '../components/ui';

export default function DiseaseScreen() {
  const { updateResult } = useContext(GlobalContext);
  const { width }        = useWindowDimensions();
  const insets           = useSafeAreaInsets();
  const isWide           = width >= BP.md;

  const [uri,     setUri]    = useState(null);
  const [loading, setLoad]   = useState(false);
  const [result,  setResult] = useState(null);
  const [error,   setError]  = useState(null);

  const bottomPad = TAB_H + insets.bottom + 16;
  const maxW = width >= BP.xl ? 1200 : width >= BP.lg ? 960 : '100%';

  const pick = async () => {
    const r = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true, aspect: [1, 1], quality: 0.85,
    });
    if (!r.canceled) { setUri(r.assets[0].uri); setResult(null); setError(null); }
  };

  const clear = () => { setUri(null); setResult(null); setError(null); updateResult('disease', null); };

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
      const data = await analyzeCrop('disease', fd);
      setResult(data); updateResult('disease', data);
    } catch (e) { setError(e.message); }
    finally     { setLoad(false); }
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: '#f5fdf7' }}
      contentContainerStyle={{ paddingBottom: bottomPad }}
      showsVerticalScrollIndicator={false}
    >
      <View style={{ maxWidth: maxW, width: '100%', alignSelf: 'center', padding: 16, gap: 16 }}>

        <GradientHeader
          badge="🔬  LEAF DIAGNOSIS"
          title="Plant Disease Scanner"
          subtitle="Upload a clear leaf photo to detect diseases and get treatment guidance."
          emoji="🌿"
          color1={C.accent}
          color2={C.accentDark}
        />

        <View style={[{ gap: 16 }, isWide && { flexDirection: 'row', alignItems: 'flex-start' }]}>

          {/* ── Upload panel ─────────────────────────────────────── */}
          <AnimCard delay={100} style={isWide && { flex: 1 }}>
            <View style={s.panelInner}>
              <Text style={s.panelTitle}>Image Upload</Text>

              {!uri ? (
                <AnimUploadZone onPress={pick} borderColor={C.g200} color={C.accent} />
              ) : (
                <View style={s.previewWrap}>
                  <Image source={{ uri }} alt="leaf" style={s.preview} resizeMode="cover" />
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

              <AnimBtn
                label="Analyze Leaf"
                icon="🔬"
                onPress={analyze}
                disabled={!uri}
                loading={loading}
              />
              {uri && !loading && <GhostBtn label="Clear image" onPress={clear} />}
              <ErrorBox message={error} />
            </View>
          </AnimCard>

          {/* ── Result panel ─────────────────────────────────────── */}
          <AnimCard delay={200} style={isWide && { flex: 1 }}>
            <View style={s.panelInner}>
              <Text style={s.panelTitle}>Diagnosis Result</Text>

              {!result ? (
                <EmptyState
                  icon="🧪"
                  title="No analysis yet"
                  sub="Upload and analyze a leaf photo to see the diagnosis."
                />
              ) : (
                <VStack space="md">
                  <StatusBadge
                    healthy={result.is_healthy}
                    disease={result.disease}
                    confidence={result.confidence}
                    uncertain={result.uncertain}
                  />

                  <AnimResultCard visible={!!result} style={s.metricSurface}>
                    <View style={s.metricInner}>
                      <SectionHead>CONFIDENCE BREAKDOWN</SectionHead>
                      <AnimConfBar value={result.confidence} active={!!result} />
                    </View>
                  </AnimResultCard>

                  {!result.is_healthy && result.treatments?.length > 0 && (
                    <AnimResultCard visible delay={100} style={[s.metricSurface, { backgroundColor: '#fffbeb' }]}>
                      <View style={s.metricInner}>
                        <SectionHead color={C.a700}>RECOMMENDED TREATMENTS</SectionHead>
                        {result.treatments.map((t, i) => (
                          <TreatmentItem key={i} text={t} index={i} />
                        ))}
                      </View>
                    </AnimResultCard>
                  )}

                  {result.top3?.length > 1 && (
                    <AnimResultCard visible style={s.metricSurface}>
                      <View style={s.metricInner}>
                        <SectionHead>TOP PREDICTIONS</SectionHead>
                        {result.top3.map((item, i) => (
                          <AnimConfBar
                            key={i}
                            value={item.confidence}
                            label={item.label}
                            active={!!result}
                          />
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
  panelInner:    { padding: 20, gap: 0 },
  panelTitle:    { fontSize: 15, fontWeight: '800', color: C.n800, marginBottom: 16, letterSpacing: 0.2 },
  previewWrap:   { borderRadius: 16, overflow: 'hidden', height: 200 },
  preview:       { width: '100%', height: '100%' },
  previewOverlay:{
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: 'rgba(0,0,0,0.45)', paddingVertical: 10, alignItems: 'center',
  },
  changeChip:    { backgroundColor: 'rgba(255,255,255,0.2)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.4)' },
  metricSurface: { borderRadius: 14, borderWidth: 1, borderColor: C.n200 },
  metricInner:   { padding: 14 },
});
