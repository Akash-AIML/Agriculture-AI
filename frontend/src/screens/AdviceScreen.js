import React, { useState, useRef, useContext, useCallback, useEffect } from 'react';
import {
  Platform, StyleSheet, View, Text, TextInput,
  FlatList, Animated, useWindowDimensions,
  KeyboardAvoidingView, Pressable,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Surface, Chip, IconButton } from 'react-native-paper';
import { HStack, VStack } from '@gluestack-ui/themed';
import { getAdvice } from '../api';
import { GlobalContext } from '../context/GlobalState';
import { C, SH, BP, TAB_H, useEntrance, usePulse } from '../design/tokens';

const QUICK = [
  { label: 'Best treatment?', icon: '💊' },
  { label: 'Fertilizer advice', icon: '🌱' },
  { label: 'When to plant?', icon: '📅' },
  { label: 'Improve soil quality', icon: '🪨' },
];

let _id = 0;
const mk = (role, text, extra = {}) => ({ id: String(++_id), role, text, ts: new Date(), ...extra });

// ── Animated chat bubble ──────────────────────────────────────────────────────
function Bubble({ item, isWide }) {
  const isUser = item.role === 'user';
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(isUser ? 8 : -8)).current;
  const scale = useRef(new Animated.Value(0.92)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 220, useNativeDriver: true }),
      Animated.spring(translateY, { toValue: 0, tension: 70, friction: 9, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1, tension: 70, friction: 9, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <Animated.View
      style={[
        s.msgRow,
        isUser && s.msgRowUser,
        { opacity, transform: [{ translateY }, { scale }] },
      ]}
    >
      {!isUser && (
        <View style={s.avatar}>
          <Text style={{ fontSize: 15 }}>🤖</Text>
        </View>
      )}
      <Surface
        style={[
          s.bubble,
          isUser ? s.bubbleUser : s.bubbleBot,
          item.isError && s.bubbleErr,
          { maxWidth: isWide ? '62%' : '78%' },
          SH.sm,
        ]}
        elevation={isUser ? 2 : 1}
      >
        <Text style={[s.bubbleText, isUser && s.bubbleTextUser]}>
          {item.text}
        </Text>
        <Text style={[s.bubbleTime, isUser && { color: 'rgba(255,255,255,0.5)' }]}>
          {item.ts.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </Surface>
    </Animated.View>
  );
}

// ── Typing indicator ──────────────────────────────────────────────────────────
function Typing() {
  const [d, setD] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setD(x => (x + 1) % 3), 360);
    return () => clearInterval(t);
  }, []);
  return (
    <View style={s.msgRow}>
      <View style={s.avatar}><Text style={{ fontSize: 15 }}>🤖</Text></View>
      <Surface style={[s.bubble, s.bubbleBot, { paddingVertical: 16 }, SH.sm]} elevation={1}>
        <View style={s.dots}>
          {[0, 1, 2].map(i => (
            <Animated.View
              key={i}
              style={[s.dot, i === d && s.dotOn]}
            />
          ))}
        </View>
      </Surface>
    </View>
  );
}

// ── Context badge ─────────────────────────────────────────────────────────────
function CtxBadge({ icon, label, active, isWide }) {
  const scale = useRef(new Animated.Value(active ? 1 : 0.92)).current;
  useEffect(() => {
    Animated.spring(scale, { toValue: active ? 1 : 0.92, useNativeDriver: true }).start();
  }, [active]);
  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Chip
        style={[s.ctxChip, active && s.ctxChipOn]}
        textStyle={{ fontSize: 11, color: active ? C.accent : C.n400, fontWeight: '700' }}
        compact
      >
        {icon} {label}
      </Chip>
    </Animated.View>
  );
}

export default function AdviceScreen() {
  const { analysisResults } = useContext(GlobalContext);
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const isWide = width >= BP.md;
  const listRef = useRef();

  const [text, setText] = useState('');
  const [loading, setLoad] = useState(false);
  const [msgs, setMsgs] = useState([
    mk('assistant', 'Hello! I\'m KrishiBot 🌿\n\nI can give personalized farming advice based on your disease, soil, and crop analysis. What would you like to know?'),
  ]);

  const hasCtx = !!(analysisResults?.disease || analysisResults?.soil || analysisResults?.crop);
  const maxW = Math.min(width, BP.xl);
  const INPUT_H = 70;
  const BOTTOM = TAB_H + insets.bottom;

  const scrollEnd = useCallback(() => {
    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
  }, []);

  const send = async (override) => {
    const msg = (override || text).trim();
    if (!msg || loading) return;
    setText('');
    setMsgs(p => [...p, mk('user', msg)]);
    setLoad(true);
    scrollEnd();
    try {
      const data = await getAdvice({
        prompt: msg,
        disease_result: analysisResults?.disease || null,
        soil_result: analysisResults?.soil || null,
        crop_result: analysisResults?.crop || null,
        stream: false,
      });
      setMsgs(p => [...p, mk('assistant', data.advice)]);
    } catch (e) {
      setMsgs(p => [...p, mk('assistant', `Sorry, something went wrong: ${e.message}`, { isError: true })]);
    } finally {
      setLoad(false);
      scrollEnd();
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: C.g50 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? BOTTOM + INPUT_H : 0}
    >
      <View style={{ flex: 1, maxWidth: maxW, width: '100%', alignSelf: 'center' }}>

        {/* ── Header ─────────────────────────────────────────── */}
        <Surface style={[s.header, { paddingTop: insets.top + 10 }, SH.sm]} elevation={2}>
          <View style={s.headerTop}>
            <HStack style={{ alignItems: 'center', gap: 10, flex: 1 }}>
              <Surface style={s.botAvatar} elevation={2}>
                <Text style={{ fontSize: 22 }}>🤖</Text>
              </Surface>
              <View>
                <Text style={s.headerName}>KrishiBot</Text>
                <HStack style={{ alignItems: 'center', gap: 5, marginTop: 1 }}>
                  <View style={s.onlineDot} />
                  <Text style={s.onlineLabel}>AI Agricultural Advisor · Online</Text>
                </HStack>
              </View>
            </HStack>

            {/* Context badges */}
            <HStack style={{ gap: 4 }}>
              <CtxBadge icon="🔬" label="Disease" active={!!analysisResults?.disease} isWide={isWide} />
              <CtxBadge icon="🪨" label="Soil" active={!!analysisResults?.soil} isWide={isWide} />
              <CtxBadge icon="🌾" label="Crop" active={!!analysisResults?.crop} isWide={isWide} />
            </HStack>
          </View>

          {!hasCtx && (
            <View style={s.ctxHint}>
              <Text style={s.ctxHintText}>
                💡  Run Disease, Soil, or Crop analysis first for personalized advice
              </Text>
            </View>
          )}
        </Surface>

        {/* ── Messages ───────────────────────────────────────── */}
        <FlatList
          ref={listRef}
          data={msgs}
          keyExtractor={m => m.id}
          renderItem={({ item }) => <Bubble item={item} isWide={isWide} />}
          contentContainerStyle={{ padding: 16, paddingBottom: BOTTOM + INPUT_H + 80 }}
          onContentSizeChange={scrollEnd}
          showsVerticalScrollIndicator={false}
          ListFooterComponent={loading ? <Typing /> : null}
        />

        {/* ── Quick prompts ──────────────────────────────────── */}
        {msgs.length <= 1 && !loading && (
          <View style={[s.quick, { bottom: BOTTOM + INPUT_H + 8 }]}>
            <Text style={s.quickLabel}>QUICK QUESTIONS</Text>
            <View style={s.quickRow}>
              {QUICK.map((q, i) => (
                <Pressable
                  key={i}
                  style={({ pressed }) => [s.quickBtn, pressed && { opacity: 0.75, transform: [{ scale: 0.97 }] }]}
                  onPress={() => send(q.label)}
                >
                  <Text style={s.quickIcon}>{q.icon}</Text>
                  <Text style={s.quickText}>{q.label}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        )}

        {/* ── Input bar — floats above tab bar ──────────────── */}
        <Surface
          style={[s.inputBar, { bottom: BOTTOM }, SH.md]}
          elevation={8}
        >
          <View style={s.inputWrap}>
            <TextInput
              style={s.input}
              placeholder="Ask about crops, diseases, soil…"
              placeholderTextColor={C.n300}
              value={text}
              onChangeText={setText}
              multiline
              maxLength={600}
              returnKeyType="send"
              blurOnSubmit={false}
              onSubmitEditing={() => send()}
            />
          </View>
          <Pressable
            style={({ pressed }) => [
              s.sendBtn,
              (!text.trim() || loading) && s.sendBtnOff,
              pressed && { transform: [{ scale: 0.92 }] },
            ]}
            onPress={() => send()}
            disabled={!text.trim() || loading}
          >
            <Text style={s.sendIcon}>{loading ? '⏳' : '↑'}</Text>
          </Pressable>
        </Surface>
      </View>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  header: {
    backgroundColor: C.n0, paddingHorizontal: 16, paddingBottom: 12,
    borderBottomWidth: 1, borderBottomColor: C.g100,
  },
  headerTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 4 },
  botAvatar: {
    width: 46, height: 46, borderRadius: 14, backgroundColor: C.g100,
    alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: C.g200,
  },
  headerName: { fontSize: 16, fontWeight: '800', color: C.g900 },
  onlineDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#22c55e' },
  onlineLabel: { fontSize: 11, color: C.n400 },

  ctxChip: { backgroundColor: C.n100, borderWidth: 1, borderColor: C.n200 },
  ctxChipOn: { backgroundColor: C.g100, borderColor: C.g200 },

  ctxHint: {
    marginTop: 10, backgroundColor: C.a100, borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 8,
    borderWidth: 1, borderColor: C.a200,
  },
  ctxHintText: { fontSize: 12, color: C.a700, textAlign: 'center', fontWeight: '500' },

  msgRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, marginBottom: 8, paddingHorizontal: 2 },
  msgRowUser: { flexDirection: 'row-reverse' },

  avatar: {
    width: 32, height: 32, borderRadius: 10, backgroundColor: C.g100,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: C.g200, flexShrink: 0,
  },

  bubble: {
    borderRadius: 18, paddingHorizontal: 14, paddingVertical: 10,
  },
  bubbleBot: { backgroundColor: C.n0, borderBottomLeftRadius: 4, borderWidth: 1, borderColor: C.n200 },
  bubbleUser: { backgroundColor: C.accent, borderBottomRightRadius: 4 },
  bubbleErr: { backgroundColor: C.r50, borderColor: C.r200 },
  bubbleText: { fontSize: 14, color: C.n800, lineHeight: 22 },
  bubbleTextUser: { color: C.n0 },
  bubbleTime: { fontSize: 10, color: C.n400, marginTop: 4, textAlign: 'right' },

  dots: { flexDirection: 'row', gap: 5, paddingHorizontal: 4 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: C.n200 },
  dotOn: { backgroundColor: C.accent },

  quick: { position: 'absolute', left: 16, right: 16 },
  quickLabel: { fontSize: 9, fontWeight: '800', letterSpacing: 1.4, color: C.n400, marginBottom: 7 },
  quickRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  quickBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999,
    backgroundColor: C.n0, borderWidth: 1, borderColor: C.g200,
    ...SH.xs,
  },
  quickIcon: { fontSize: 13 },
  quickText: { fontSize: 12, color: C.g700, fontWeight: '600' },

  inputBar: {
    position: 'absolute', left: 0, right: 0,
    flexDirection: 'row', alignItems: 'flex-end', gap: 10,
    paddingHorizontal: 16, paddingVertical: 12,
    backgroundColor: C.n0, borderTopWidth: 1, borderTopColor: C.g100,
  },
  inputWrap: {
    flex: 1, backgroundColor: C.n50, borderRadius: 16,
    borderWidth: 1.5, borderColor: C.n200,
    paddingHorizontal: 14, paddingVertical: 9, maxHeight: 120,
  },
  input: { fontSize: 14, color: C.n900, lineHeight: 20, padding: 0 },

  sendBtn: {
    width: 46, height: 46, borderRadius: 14, backgroundColor: C.accent,
    alignItems: 'center', justifyContent: 'center',
    ...SH.green,
  },
  sendBtnOff: { opacity: 0.4 },
  sendIcon: { color: C.n0, fontSize: 22, fontWeight: '900', lineHeight: 26 },
});
