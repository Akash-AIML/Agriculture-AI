import React, { useState, useContext, useRef } from 'react';
import {
  Platform, StyleSheet, View, Text, TextInput,
  ScrollView, Animated, useWindowDimensions,
  KeyboardAvoidingView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Surface, Chip, ProgressBar } from 'react-native-paper';
import { VStack, HStack } from '@gluestack-ui/themed';
import { recommendCrop } from '../api';
import { GlobalContext } from '../context/GlobalState';
import { C, SH, BP, TAB_H, useEntrance } from '../design/tokens';
import {
  GradientHeader, AnimCard, AnimBtn, AnimResultCard,
  CropHero, AltRow, EmptyState, ErrorBox, SectionHead,
} from '../components/ui';

const FIELDS = [
  { key: 'N',           label: 'Nitrogen',    unit: 'kg/ha', icon: '🧪', hint: '0–200',  kb: 'decimal-pad' },
  { key: 'P',           label: 'Phosphorus',  unit: 'kg/ha', icon: '⚗️',  hint: '0–200',  kb: 'decimal-pad' },
  { key: 'K',           label: 'Potassium',   unit: 'kg/ha', icon: '🔬', hint: '0–200',  kb: 'decimal-pad' },
  { key: 'temperature', label: 'Temperature', unit: '°C',    icon: '🌡️',  hint: '0–50',   kb: 'decimal-pad' },
  { key: 'humidity',    label: 'Humidity',    unit: '%',     icon: '💧', hint: '0–100',  kb: 'decimal-pad' },
  { key: 'ph',          label: 'Soil pH',     unit: 'pH',    icon: '🧫', hint: '0–14',   kb: 'decimal-pad' },
  { key: 'rainfall',    label: 'Rainfall',    unit: 'mm/yr', icon: '🌧️',  hint: '0–3000', kb: 'numeric'     },
];

function FieldRow({ f, value, onChange, hasError, index }) {
  const [focused, setFocused] = useState(false);
  const borderAnim = useRef(new Animated.Value(0)).current;
  const anim = useEntrance(index * 40, 12);

  const onFocus = () => {
    setFocused(true);
    Animated.spring(borderAnim, { toValue: 1, useNativeDriver: false }).start();
  };
  const onBlur = () => {
    setFocused(false);
    Animated.spring(borderAnim, { toValue: 0, useNativeDriver: false }).start();
  };

  const borderColor = borderAnim.interpolate({
    inputRange: [0, 1], outputRange: [hasError ? C.r200 : C.n200, C.accent],
  });
  const bgColor = borderAnim.interpolate({
    inputRange: [0, 1], outputRange: [hasError ? C.r50 : C.n50, C.accentLight],
  });

  return (
    <Animated.View style={anim}>
      <Animated.View style={[s.field, { borderColor, backgroundColor: bgColor }]}>
        <View style={[s.fieldIcon, focused && s.fieldIconActive]}>
          <Text style={{ fontSize: 16 }}>{f.icon}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[s.fieldLabel, focused && { color: C.accent }]}>{f.label}</Text>
          <Text style={s.fieldHint}>{f.hint}</Text>
        </View>
        <TextInput
          style={[s.fieldInput, focused && { color: C.accent }]}
          keyboardType={f.kb}
          value={value}
          onChangeText={v => onChange(f.key, v)}
          onFocus={onFocus}
          onBlur={onBlur}
          placeholder="0"
          placeholderTextColor={C.n300}
          selectTextOnFocus
        />
        <Text style={[s.fieldUnit, focused && { color: C.accent }]}>{f.unit}</Text>
      </Animated.View>
    </Animated.View>
  );
}

export default function CropScreen() {
  const { updateResult } = useContext(GlobalContext);
  const { width }        = useWindowDimensions();
  const insets           = useSafeAreaInsets();
  const isWide           = width >= BP.md;
  const isDesktop        = width >= BP.lg;

  const [form, setForm]   = useState(Object.fromEntries(FIELDS.map(f => [f.key, ''])));
  const [errKey, setEK]   = useState(null);
  const [loading, setLoad]= useState(false);
  const [result, setR]    = useState(null);
  const [error, setE]     = useState(null);

  const bottomPad = TAB_H + insets.bottom + 16;
  const maxW = width >= BP.xl ? 1200 : width >= BP.lg ? 960 : '100%';

  const onChange = (k, v) => { setForm(p => ({ ...p, [k]: v })); if (errKey === k) setEK(null); };

  const submit = async () => {
    setE(null); setR(null);
    const payload = {};
    for (const f of FIELDS) {
      if (!form[f.key]) { setEK(f.key); setE(`Please fill in ${f.label}`); return; }
      payload[f.key] = parseFloat(form[f.key]);
    }
    setLoad(true);
    try {
      const data = await recommendCrop(payload);
      setR(data); updateResult('crop', data);
    } catch (e) { setE(e.message); }
    finally { setLoad(false); }
  };

  const leftF  = isDesktop ? FIELDS.slice(0, 4) : FIELDS;
  const rightF = isDesktop ? FIELDS.slice(4)    : [];

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        style={{ flex: 1, backgroundColor: C.g50 }}
        contentContainerStyle={{ paddingBottom: bottomPad }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={{ maxWidth: maxW, width: '100%', alignSelf: 'center', padding: 16, gap: 16 }}>

          <GradientHeader
            badge="🌾  SMART PLANNING"
            title="Crop Recommendation"
            subtitle="Enter soil nutrients and climate data to find your best crop."
            emoji="🧭"
            color1={C.accent}
            color2={C.g900}
          />

          <View style={[{ gap: 16 }, isWide && { flexDirection: 'row', alignItems: 'flex-start' }]}>

            {/* Form panel */}
            <AnimCard delay={100} style={[isWide && { flex: 1.1 }]}>
              <View style={s.inner}>
                <Text style={s.panelTitle}>Field Parameters</Text>
                <Text style={s.panelSub}>Enter measured or estimated values for your field</Text>

                {isDesktop ? (
                  <HStack space="sm">
                    <VStack style={{ flex: 1 }} space="sm">
                      {leftF.map((f, i) => (
                        <FieldRow key={f.key} f={f} value={form[f.key]} onChange={onChange} hasError={errKey === f.key} index={i} />
                      ))}
                    </VStack>
                    <VStack style={{ flex: 1 }} space="sm">
                      {rightF.map((f, i) => (
                        <FieldRow key={f.key} f={f} value={form[f.key]} onChange={onChange} hasError={errKey === f.key} index={i + 4} />
                      ))}
                    </VStack>
                  </HStack>
                ) : (
                  <VStack space="sm">
                    {FIELDS.map((f, i) => (
                      <FieldRow key={f.key} f={f} value={form[f.key]} onChange={onChange} hasError={errKey === f.key} index={i} />
                    ))}
                  </VStack>
                )}

                <AnimBtn label="Get Recommendation" icon="🌾" onPress={submit} loading={loading} />
                <ErrorBox message={error} />
              </View>
            </AnimCard>

            {/* Result panel */}
            <AnimCard delay={200} style={isWide && { flex: 0.9 }}>
              <View style={s.inner}>
                <Text style={s.panelTitle}>Recommendation</Text>

                {!result ? (
                  <EmptyState
                    icon="🧭"
                    title="Awaiting analysis"
                    sub="Submit field values to get your personalized crop suggestion."
                  />
                ) : (
                  <VStack space="md">
                    <CropHero
                      crop={result.recommended_crop || result.crop}
                      tip={result.tip}
                      cached={result.cached}
                    />

                    {result.recommendations?.length > 1 && (
                      <AnimResultCard visible style={[s.metric, { borderColor: C.n200 }]}>
                        <View style={s.metricIn}>
                          <SectionHead>RANKED ALTERNATIVES</SectionHead>
                          {result.recommendations.map((rec, i) => (
                            <AltRow key={i} rec={rec} index={i} />
                          ))}
                        </View>
                      </AnimResultCard>
                    )}

                    {result.input_warnings?.length > 0 && (
                      <AnimResultCard visible style={[s.metric, { backgroundColor: C.a50, borderColor: C.a200 }]}>
                        <View style={s.metricIn}>
                          <SectionHead color={C.a700}>INPUT WARNINGS</SectionHead>
                          {result.input_warnings.map((w, i) => (
                            <Text key={i} style={s.warnText}>⚠  {w}</Text>
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
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  inner:      { padding: 20 },
  panelTitle: { fontSize: 15, fontWeight: '800', color: C.n800, marginBottom: 4 },
  panelSub:   { fontSize: 12, color: C.n400, marginBottom: 16 },

  field: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    borderRadius: 14, paddingHorizontal: 14, paddingVertical: 11,
    borderWidth: 1.5,
  },
  fieldIcon:       { width: 34, height: 34, borderRadius: 10, backgroundColor: C.n100, alignItems: 'center', justifyContent: 'center' },
  fieldIconActive: { backgroundColor: C.accentLight },
  fieldLabel:      { fontSize: 13, fontWeight: '700', color: C.n700 },
  fieldHint:       { fontSize: 10, color: C.n400 },
  fieldInput:      { fontSize: 17, fontWeight: '800', color: C.n900, textAlign: 'right', minWidth: 60, padding: 0 },
  fieldUnit:       { fontSize: 11, color: C.n400, fontWeight: '600', minWidth: 38 },

  metric:   { borderRadius: 14, borderWidth: 1 },
  metricIn: { padding: 14 },
  warnText: { fontSize: 13, color: C.a700, marginTop: 5, lineHeight: 19 },
});
