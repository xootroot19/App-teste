import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  KeyboardAvoidingView,
  Linking,
  Modal,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');

const STORAGE_KEY = '@bunny_models_state_v1';

const C = {
  pink: '#F21872',
  pinkDark: '#D90E61',
  pinkSoft: '#FCE4EE',
  pinkUltra: '#FFF2F7',
  bg: '#FFF9FB',
  white: '#FFFFFF',
  text: '#191416',
  muted: '#81777B',
  border: '#F0E5E9',
  success: '#2E835B',
  danger: '#C84B61',
  shadow: '#9A5470',
};

const STATUS = [
  'Orçamento',
  'Confirmado',
  'Em andamento',
  'Finalizado',
  'Aguardando pagamento',
  'Pago',
];
const TYPES = ['Ensaio', 'Campanha', 'Editorial', 'Evento', 'Lookbook', 'Outro'];
const PLACES = ['Estúdio', 'Locação externa', 'Local do cliente', 'Evento', 'Outro'];
const EXPENSE_CATS = [
  'Uber ida',
  'Uber volta',
  'Hospedagem',
  'Alimentação',
  'Produção',
  'Beauty',
  'Estacionamento',
  'Pedágio',
  'Outro',
];
const PAYERS = ['Cliente', 'Modelo', 'Agência'];

const AGENCY_INSTAGRAM_URL = 'https://www.instagram.com/';
const INITIAL_PROPOSAL = {
  id: 'proposal-first-client',
  client: 'Lucas Viana',
  type: 'Job presencial',
  city: 'Ferraz de Vasconcelos - SP',
  fee: 3500,
  note: 'Proposta de trabalho presencial. Despesas de deslocamento e outros custos aprovados podem ser reembolsados mediante comprovante.',
  expenses: [
    { id: 'proposal-uber-ida', category: 'Uber ida', value: 90, payer: 'Modelo', reimbursable: true },
    { id: 'proposal-uber-volta', category: 'Uber volta', value: 90, payer: 'Modelo', reimbursable: true },
  ],
};


const money = (v) =>
  Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const toNumber = (v) => {
  if (typeof v === 'number') return v;
  const normalized = String(v || '')
    .replace(/\s/g, '')
    .replace(/R\$/g, '')
    .replace(/\./g, '')
    .replace(',', '.')
    .replace(/[^0-9.-]/g, '');
  return Number(normalized) || 0;
};
const id = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

function BunnyMark({ size = 68, color = C.white }) {
  return (
    <View style={{ width: size, height: size * 1.03, alignItems: 'center' }}>
      <View style={{ flexDirection: 'row', gap: size * 0.05, height: size * 0.52 }}>
        <View
          style={{
            width: size * 0.22,
            height: size * 0.48,
            borderWidth: size * 0.055,
            borderColor: color,
            borderRadius: size,
            transform: [{ rotate: '-12deg' }],
          }}
        />
        <View
          style={{
            width: size * 0.22,
            height: size * 0.48,
            borderWidth: size * 0.055,
            borderColor: color,
            borderRadius: size,
            transform: [{ rotate: '12deg' }],
          }}
        />
      </View>
      <View
        style={{
          marginTop: -size * 0.12,
          width: size * 0.58,
          height: size * 0.48,
          borderWidth: size * 0.055,
          borderColor: color,
          borderRadius: size,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Ionicons name="close" size={size * 0.18} color={color} />
      </View>
    </View>
  );
}

function ScaleButton({ children, onPress, style, disabled = false }) {
  const scale = useRef(new Animated.Value(1)).current;
  const down = () => Animated.spring(scale, { toValue: 0.97, useNativeDriver: true }).start();
  const up = () => Animated.spring(scale, { toValue: 1, friction: 4, useNativeDriver: true }).start();
  return (
    <Animated.View style={[style, { transform: [{ scale }], opacity: disabled ? 0.5 : 1 }]}>
      <Pressable
        disabled={disabled}
        onPress={onPress}
        onPressIn={down}
        onPressOut={up}
        style={{ width: '100%' }}
      >
        {children}
      </Pressable>
    </Animated.View>
  );
}

function FadeIn({ children, delay = 0, style }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const y = useRef(new Animated.Value(16)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 350, delay, useNativeDriver: true }),
      Animated.spring(y, { toValue: 0, delay, useNativeDriver: true, friction: 8 }),
    ]).start();
  }, []);
  return <Animated.View style={[style, { opacity, transform: [{ translateY: y }] }]}>{children}</Animated.View>;
}

function HeaderIcon({ name, onPress }) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.75} style={styles.headerIcon}>
      <Ionicons name={name} size={20} color={C.white} />
    </TouchableOpacity>
  );
}

function Field({ icon, placeholder, value, onChangeText, secureTextEntry, keyboardType, right }) {
  return (
    <View style={styles.field}>
      {icon ? <Ionicons name={icon} size={20} color={C.text} style={{ marginRight: 12 }} /> : null}
      <TextInput
        style={styles.fieldInput}
        placeholder={placeholder}
        placeholderTextColor="#A79DA1"
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        autoCapitalize="none"
      />
      {right}
    </View>
  );
}

function Pill({ label, active, onPress, small = false }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      style={[styles.pill, small && styles.pillSmall, active && styles.pillActive]}
    >
      <Text style={[styles.pillText, active && styles.pillTextActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

function TopArea({ title, subtitle, back, onBack, right }) {
  return (
    <View style={styles.topArea}>
      <View style={styles.topRow}>
        {back ? <HeaderIcon name="chevron-back" onPress={onBack} /> : <View style={{ width: 42 }} />}
        <View style={{ flex: 1 }} />
        {right || <View style={{ width: 42 }} />}
      </View>
      <Text style={styles.topTitle}>{title}</Text>
      {subtitle ? <Text style={styles.topSubtitle}>{subtitle}</Text> : null}
    </View>
  );
}

function BottomNav({ active, onChange }) {
  const items = [
    ['home-outline', 'Início', 'home'],
    ['briefcase-outline', 'Jobs', 'jobs'],
    ['wallet-outline', 'Financeiro', 'finance'],
    ['person-outline', 'Perfil', 'profile'],
  ];
  return (
    <View style={styles.bottomNav}>
      {items.map(([icon, label, key]) => {
        const selected = active === key;
        return (
          <TouchableOpacity key={key} style={styles.navItem} onPress={() => onChange(key)} activeOpacity={0.8}>
            <View style={[styles.navDot, selected && styles.navDotActive]}>
              <Ionicons name={selected ? icon.replace('-outline', '') : icon} size={20} color={selected ? C.white : C.muted} />
            </View>
            <Text style={[styles.navLabel, selected && styles.navLabelActive]}>{label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

function Splash({ onDone }) {
  const scale = useRef(new Animated.Value(0.7)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.spring(scale, { toValue: 1, friction: 6, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 1, duration: 500, useNativeDriver: true }),
    ]).start();
    const t = setTimeout(onDone, 1500);
    return () => clearTimeout(t);
  }, []);
  return (
    <View style={styles.splash}>
      <StatusBar barStyle="light-content" />
      <Animated.View style={{ alignItems: 'center', opacity, transform: [{ scale }] }}>
        <BunnyMark size={92} />
        <Text style={styles.splashBrand}>bunnymodels</Text>
        <Text style={styles.splashSub}>Conecte-se. Organize. Cresça.</Text>
      </Animated.View>
    </View>
  );
}

function Login({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [remember, setRemember] = useState(true);
  const [message, setMessage] = useState('');
  const submit = () => {
    if (!email.trim() || !password.trim()) {
      setMessage('Preencha usuário e senha para entrar.');
      return;
    }
    setMessage('');
    onLogin();
  };
  return (
    <SafeAreaView style={styles.loginScreen}>
      <StatusBar barStyle="light-content" backgroundColor={C.pink} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: 30 }}>
          <View style={styles.loginHero}>
            <View style={styles.decorOne} />
            <View style={styles.decorDots}><View style={styles.dot} /><View style={styles.dot} /><View style={styles.dot} /></View>
            <BunnyMark size={70} />
            <Text style={styles.loginBrand}>bunnymodels</Text>
            <Text style={styles.loginSlogan}>Conecte-se. Ganhe. Seja você.</Text>
          </View>
          <FadeIn delay={100} style={styles.loginBody}>
            <Field icon="person-outline" placeholder="E-mail ou usuário" value={email} onChangeText={setEmail} keyboardType="email-address" />
            <Field
              icon="lock-closed-outline"
              placeholder="Senha"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!show}
              right={<TouchableOpacity onPress={() => setShow((v) => !v)}><Ionicons name={show ? 'eye-off-outline' : 'eye-outline'} size={23} color={C.muted} /></TouchableOpacity>}
            />
            <View style={styles.loginOptions}>
              <TouchableOpacity style={styles.remember} onPress={() => setRemember((v) => !v)}>
                <View style={[styles.checkbox, remember && styles.checkboxOn]}>{remember ? <Ionicons name="checkmark" size={15} color={C.white} /> : null}</View>
                <Text style={styles.rememberText}>Lembrar de mim</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setMessage('Link de recuperação demonstrativo enviado.')}>
                <Text style={styles.linkText}>Esqueceu a senha?</Text>
              </TouchableOpacity>
            </View>
            {message ? <Text style={styles.formMessage}>{message}</Text> : null}
            <ScaleButton onPress={submit} style={{ marginTop: 8 }}>
              <View style={styles.primaryButton}><Text style={styles.primaryButtonText}>Entrar</Text><Ionicons name="arrow-forward" size={21} color={C.white} /></View>
            </ScaleButton>
            <View style={styles.dividerRow}><View style={styles.divider} /><Text style={styles.dividerText}>ou</Text><View style={styles.divider} /></View>
            <ScaleButton onPress={onLogin}>
              <View style={styles.googleButton}><View style={styles.googleG}><Text style={{ fontWeight: '900', color: '#4285F4' }}>G</Text></View><Text style={styles.googleText}>Entrar com o Google</Text></View>
            </ScaleButton>
            <View style={styles.signupRow}><Text style={styles.signupText}>Não tem uma conta? </Text><TouchableOpacity onPress={() => setMessage('Cadastro demonstrativo disponível em breve.')}><Text style={styles.linkText}>Cadastre-se</Text></TouchableOpacity></View>
          </FadeIn>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Home({ jobs, onNewJob, onNavigate, onOpenJob, onOpenProposal, onOpenPix, proposalAvailable }) {
  const [balanceVisible, setBalanceVisible] = useState(true);
  const pending = jobs.filter((j) => j.status !== 'Pago').reduce((s, j) => s + j.total, 0);
  const received = jobs.filter((j) => j.status === 'Pago').reduce((s, j) => s + j.total, 0);
  const availablePix = jobs.filter((j) => j.proofSubmitted && !j.withdrawn).reduce((s, j) => s + j.total, 0);
  const shortcuts = [
    ['qr-code-outline', 'Sacar Pix', onOpenPix],
    ['add-circle-outline', 'Novo Job', onNewJob],
    ['calendar-outline', 'Agenda', () => onNavigate('jobs')],
    ['people-outline', 'Clientes', () => onNavigate('clients')],
    ['wallet-outline', 'Financeiro', () => onNavigate('finance')],
  ];
  return (
    <View style={styles.screen}>
      <StatusBar barStyle="light-content" backgroundColor={C.pink} />
      <View style={styles.homeHeroFaithful}>
        <View style={styles.heroTopRow}>
          <TouchableOpacity style={styles.heroAvatar} activeOpacity={0.85} onPress={() => onNavigate('profile')}><Ionicons name="person-outline" size={25} color={C.white} /><View style={styles.avatarPing} /></TouchableOpacity>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <HeaderIcon name={balanceVisible ? 'eye-outline' : 'eye-off-outline'} onPress={() => setBalanceVisible((v) => !v)} />
            <HeaderIcon name="help-circle-outline" onPress={() => {}} />
            <View><HeaderIcon name="notifications-outline" onPress={onOpenProposal} />{proposalAvailable ? <View style={styles.notificationBadge}><Text style={styles.notificationBadgeText}>1</Text></View> : null}</View>
          </View>
        </View>
        <Text style={styles.helloFaithful}>Olá, Franciele</Text>
      </View>

      <ScrollView contentContainerStyle={styles.homeFaithfulContent} showsVerticalScrollIndicator={false}>
        <FadeIn style={styles.accountPanel}>
          <View style={styles.accountTopLine}><View><Text style={styles.accountTitle}>Conta</Text><Text style={styles.accountAmount}>{balanceVisible ? money(availablePix) : '••••'}</Text></View><TouchableOpacity onPress={onOpenPix} style={styles.accountArrow}><Ionicons name="chevron-forward" size={24} color={C.muted} /></TouchableOpacity></View>
          <Text style={styles.accountHint}>{availablePix > 0 ? 'Disponível para saque via Pix' : 'Envie o comprovante de um job finalizado para liberar o saque'}</Text>
        </FadeIn>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.shortcutsRowFaithful}>
          {shortcuts.map(([icon, label, action], i) => (
            <FadeIn key={label} delay={60 * i} style={styles.shortcutItemFaithful}>
              <TouchableOpacity onPress={action} activeOpacity={0.8} style={styles.shortcutCircleFaithful}><Ionicons name={icon} size={25} color={C.text} />{label === 'Sacar Pix' && availablePix > 0 ? <View style={styles.shortcutMiniBadge}><Text style={styles.shortcutMiniBadgeText}>R$</Text></View> : null}</TouchableOpacity>
              <Text style={styles.shortcutLabelFaithful}>{label}</Text>
            </FadeIn>
          ))}
        </ScrollView>

        {proposalAvailable ? <FadeIn delay={220}>
          <TouchableOpacity style={styles.proposalHomeCard} activeOpacity={0.88} onPress={onOpenProposal}>
            <View style={styles.proposalHomeIcon}><Ionicons name="sparkles-outline" size={22} color={C.pink} /></View>
            <View style={{ flex: 1 }}><Text style={styles.proposalHomeEyebrow}>NOVA PROPOSTA</Text><Text style={styles.proposalHomeTitle}>Job presencial em Ferraz de Vasconcelos</Text><Text style={styles.proposalHomeMeta}>Valor de {money(INITIAL_PROPOSAL.fee)} + despesas aprovadas</Text></View>
            <Ionicons name="chevron-forward" size={20} color={C.muted} />
          </TouchableOpacity>
        </FadeIn> : null}

        <FadeIn delay={260} style={styles.pixInfoCard}>
          <View style={styles.pixInfoIcon}><Ionicons name="qr-code-outline" size={24} color={C.text} /></View>
          <View style={{ flex: 1 }}><Text style={styles.pixInfoTitle}>Saque por Pix</Text><Text style={styles.pixInfoText}>Após finalizar um job, envie o comprovante do trabalho pelo DM oficial da agência e confirme o envio no app.</Text></View>
          <TouchableOpacity onPress={onOpenPix}><Text style={styles.linkText}>Sacar</Text></TouchableOpacity>
        </FadeIn>

        <View style={styles.sectionHeader}><Text style={styles.sectionTitle}>Jobs recentes</Text>{jobs.length ? <TouchableOpacity onPress={() => onNavigate('jobs')}><Text style={styles.linkText}>Ver todos</Text></TouchableOpacity> : null}</View>
        {jobs.length === 0 ? (
          <FadeIn delay={300} style={styles.emptyCard}>
            <View style={styles.emptyIcon}><Ionicons name="briefcase-outline" size={34} color={C.pink} /></View>
            <Text style={styles.emptyTitle}>Nenhum job ainda</Text>
            <Text style={styles.emptyText}>Aceite uma proposta ou crie seu primeiro trabalho para acompanhar cachê, despesas e pagamento.</Text>
            <ScaleButton onPress={onNewJob} style={{ width: '100%', marginTop: 16 }}><View style={styles.primaryButton}><Ionicons name="add" size={20} color={C.white} /><Text style={styles.primaryButtonText}>Criar primeiro job</Text></View></ScaleButton>
          </FadeIn>
        ) : jobs.slice(0, 3).map((job, i) => <JobCard key={job.id} job={job} onPress={() => onOpenJob(job.id)} delay={i * 70} />)}
      </ScrollView>
    </View>
  );
}

function JobCard({ job, onPress, delay = 0 }) {
  const color = job.status === 'Pago' ? C.success : job.status === 'Aguardando pagamento' ? C.danger : C.pink;
  return (
    <FadeIn delay={delay}>
      <TouchableOpacity onPress={onPress} activeOpacity={0.88} style={styles.jobCard}>
        <View style={[styles.jobIcon, { backgroundColor: C.pinkUltra }]}><Ionicons name="sparkles-outline" size={23} color={C.pink} /></View>
        <View style={{ flex: 1 }}>
          <Text style={styles.jobClient} numberOfLines={1}>{job.client}</Text>
          <Text style={styles.jobMeta}>{job.type} • {job.date || 'Sem data'}</Text>
          <View style={styles.statusLine}><View style={[styles.statusDot, { backgroundColor: color }]} /><Text style={[styles.jobStatus, { color }]}>{job.status}</Text></View>
        </View>
        <View style={{ alignItems: 'flex-end' }}><Text style={styles.jobValue}>{money(job.total)}</Text><Ionicons name="chevron-forward" size={20} color={C.muted} style={{ marginTop: 10 }} /></View>
      </TouchableOpacity>
    </FadeIn>
  );
}

function Jobs({ jobs, onOpenJob, onNewJob }) {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('Todos');
  const filtered = jobs.filter((j) => {
    const okFilter = filter === 'Todos' || j.status === filter;
    const q = search.trim().toLowerCase();
    const okSearch = !q || j.client.toLowerCase().includes(q) || j.type.toLowerCase().includes(q);
    return okFilter && okSearch;
  });
  return (
    <View style={styles.screen}>
      <TopArea title="Jobs" subtitle="Organize cada trabalho do briefing ao pagamento." right={<HeaderIcon name="add" onPress={onNewJob} />} />
      <ScrollView contentContainerStyle={styles.content}>
        <Field icon="search-outline" placeholder="Pesquisar cliente ou tipo" value={search} onChangeText={setSearch} />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingBottom: 14 }}>
          {['Todos', ...STATUS].map((s) => <Pill key={s} small label={s} active={filter === s} onPress={() => setFilter(s)} />)}
        </ScrollView>
        {filtered.length === 0 ? (
          <View style={styles.emptyCard}><View style={styles.emptyIcon}><Ionicons name="search-outline" size={30} color={C.pink} /></View><Text style={styles.emptyTitle}>{jobs.length ? 'Nada encontrado' : 'Nenhum job cadastrado'}</Text><Text style={styles.emptyText}>{jobs.length ? 'Tente outro termo ou filtro.' : 'Seu histórico de trabalhos vai aparecer aqui.'}</Text>{!jobs.length ? <ScaleButton onPress={onNewJob} style={{ width: '100%', marginTop: 14 }}><View style={styles.primaryButton}><Text style={styles.primaryButtonText}>Novo job</Text></View></ScaleButton> : null}</View>
        ) : filtered.map((j, i) => <JobCard key={j.id} job={j} onPress={() => onOpenJob(j.id)} delay={i * 45} />)}
      </ScrollView>
    </View>
  );
}

function AnimatedNumber({ value, formatter = money }) {
  const anim = useRef(new Animated.Value(0)).current;
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    anim.setValue(0);
    const listener = anim.addListener(({ value: v }) => setDisplay(v));
    Animated.timing(anim, { toValue: Number(value || 0), duration: 700, useNativeDriver: false }).start();
    return () => anim.removeListener(listener);
  }, [value]);
  return <Text style={styles.metricValue}>{formatter(display)}</Text>;
}

function Finance({ jobs }) {
  const total = jobs.reduce((s, j) => s + j.total, 0);
  const received = jobs.filter((j) => j.status === 'Pago').reduce((s, j) => s + j.total, 0);
  const pending = total - received;
  const fees = jobs.reduce((s, j) => s + j.fee, 0);
  const reimburse = jobs.reduce((s, j) => s + j.reimbursable, 0);
  const own = jobs.reduce((s, j) => s + j.modelPaid, 0);
  const profit = jobs.reduce((s, j) => s + j.profit, 0);
  const metrics = [
    ['Total movimentado', total, 'stats-chart-outline'],
    ['Recebido', received, 'checkmark-circle-outline'],
    ['Pendente', pending, 'time-outline'],
    ['Cachês', fees, 'cash-outline'],
    ['Reembolsos', reimburse, 'repeat-outline'],
    ['Despesas da modelo', own, 'receipt-outline'],
    ['Lucro estimado', profit, 'trending-up-outline'],
  ];
  return (
    <View style={styles.screen}>
      <TopArea title="Financeiro" subtitle="Visão clara do que entrou, do que falta e do seu resultado." />
      <ScrollView contentContainerStyle={styles.content}>
        <FadeIn style={styles.financeMain}>
          <Text style={styles.eyebrow}>SALDO RECEBIDO</Text><AnimatedNumber value={received} /><Text style={styles.muted}>{jobs.length} job{jobs.length === 1 ? '' : 's'} no total</Text>
        </FadeIn>
        <View style={styles.metricGrid}>
          {metrics.slice(1).map(([label, value, icon], i) => (
            <FadeIn key={label} delay={i * 55} style={styles.metricCard}>
              <View style={styles.metricIcon}><Ionicons name={icon} size={20} color={C.pink} /></View><Text style={styles.metricLabel}>{label}</Text><AnimatedNumber value={value} />
            </FadeIn>
          ))}
        </View>
        <View style={styles.sectionHeader}><Text style={styles.sectionTitle}>Visão mensal</Text></View>
        <View style={styles.monthCard}>
          <View style={styles.monthBarRow}><Text style={styles.monthName}>Setembro</Text><Text style={styles.monthValue}>{money(total)}</Text></View>
          <View style={styles.progressTrack}><View style={[styles.progressFill, { width: total > 0 ? '82%' : '6%' }]} /></View>
          <Text style={styles.muted}>{total > 0 ? 'Movimentação atual calculada a partir dos seus jobs.' : 'Crie um job para iniciar sua visão financeira.'}</Text>
        </View>
      </ScrollView>
    </View>
  );
}

function Profile({ onLogout }) {
  const [notifications, setNotifications] = useState(true);
  const [privacy, setPrivacy] = useState(true);
  const rows = [
    ['settings-outline', 'Configurações'],
    ['shield-checkmark-outline', 'Privacidade'],
    ['help-circle-outline', 'Central de ajuda'],
  ];
  return (
    <View style={styles.screen}>
      <TopArea title="Perfil" subtitle="Sua conta e preferências profissionais." />
      <ScrollView contentContainerStyle={styles.content}>
        <FadeIn style={styles.profileCard}>
          <View style={styles.profileAvatar}><Ionicons name="person" size={38} color={C.pink} /></View>
          <Text style={styles.profileName}>Modelo Bunny</Text><Text style={styles.profileEmail}>modelo@bunnymodels.app</Text><View style={styles.agencyBadge}><Ionicons name="business-outline" size={15} color={C.pinkDark} /><Text style={styles.agencyText}>Bunny Models</Text></View>
        </FadeIn>
        <View style={styles.settingsCard}>
          <View style={styles.settingRow}><View style={styles.settingLeft}><Ionicons name="notifications-outline" size={21} color={C.text} /><Text style={styles.settingText}>Notificações</Text></View><Switch value={notifications} onValueChange={setNotifications} trackColor={{ false: '#ddd', true: '#F7A0C3' }} thumbColor={notifications ? C.pink : '#fff'} /></View>
          <View style={styles.settingRow}><View style={styles.settingLeft}><Ionicons name="lock-closed-outline" size={21} color={C.text} /><Text style={styles.settingText}>Modo privado</Text></View><Switch value={privacy} onValueChange={setPrivacy} trackColor={{ false: '#ddd', true: '#F7A0C3' }} thumbColor={privacy ? C.pink : '#fff'} /></View>
          {rows.map(([icon, label]) => <TouchableOpacity key={label} style={styles.settingRow} activeOpacity={0.7}><View style={styles.settingLeft}><Ionicons name={icon} size={21} color={C.text} /><Text style={styles.settingText}>{label}</Text></View><Ionicons name="chevron-forward" size={18} color={C.muted} /></TouchableOpacity>)}
        </View>
        <ScaleButton onPress={onLogout}><View style={styles.logoutButton}><Ionicons name="log-out-outline" size={20} color={C.danger} /><Text style={styles.logoutText}>Sair da conta</Text></View></ScaleButton>
      </ScrollView>
    </View>
  );
}

function Clients({ clients, setClients, jobs, onBack }) {
  const [modal, setModal] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');
  const save = () => {
    if (!name.trim()) return;
    setClients((prev) => [...prev, { id: id(), name: name.trim(), phone, notes, favorite: false, rating: 5 }]);
    setName(''); setPhone(''); setNotes(''); setModal(false);
  };
  return (
    <View style={styles.screen}>
      <TopArea title="Clientes" subtitle="Relacionamento, histórico e movimentação." back onBack={onBack} right={<HeaderIcon name="add" onPress={() => setModal(true)} />} />
      <ScrollView contentContainerStyle={styles.content}>
        {clients.length === 0 ? <View style={styles.emptyCard}><View style={styles.emptyIcon}><Ionicons name="people-outline" size={32} color={C.pink} /></View><Text style={styles.emptyTitle}>Nenhum cliente ainda</Text><Text style={styles.emptyText}>Cadastre clientes para centralizar contato, histórico e resultados.</Text><ScaleButton onPress={() => setModal(true)} style={{ width: '100%', marginTop: 14 }}><View style={styles.primaryButton}><Text style={styles.primaryButtonText}>Criar cliente</Text></View></ScaleButton></View> : clients.map((c) => {
          const history = jobs.filter((j) => j.client === c.name);
          const volume = history.reduce((s, j) => s + j.total, 0);
          return <View key={c.id} style={styles.clientCard}><View style={styles.clientAvatar}><Ionicons name="business-outline" size={22} color={C.pink} /></View><View style={{ flex: 1 }}><Text style={styles.clientName}>{c.name}</Text><Text style={styles.clientMeta}>{c.phone || 'Sem telefone'} • {history.length} job{history.length === 1 ? '' : 's'}</Text><Text style={styles.clientVolume}>{money(volume)} movimentados</Text></View><TouchableOpacity onPress={() => setClients((prev) => prev.map((x) => x.id === c.id ? { ...x, favorite: !x.favorite } : x))}><Ionicons name={c.favorite ? 'heart' : 'heart-outline'} size={22} color={C.pink} /></TouchableOpacity></View>;
        })}
      </ScrollView>
      <Modal visible={modal} transparent animationType="slide" onRequestClose={() => setModal(false)}>
        <View style={styles.modalBackdrop}><KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.sheet}><View style={styles.sheetHandle} /><View style={styles.sheetTitleRow}><Text style={styles.sheetTitle}>Novo cliente</Text><TouchableOpacity onPress={() => setModal(false)}><Ionicons name="close" size={25} color={C.text} /></TouchableOpacity></View><Field icon="person-outline" placeholder="Nome" value={name} onChangeText={setName} /><Field icon="call-outline" placeholder="Telefone" value={phone} onChangeText={setPhone} keyboardType="phone-pad" /><Field icon="document-text-outline" placeholder="Observações" value={notes} onChangeText={setNotes} /><ScaleButton onPress={save} disabled={!name.trim()}><View style={styles.primaryButton}><Text style={styles.primaryButtonText}>Salvar cliente</Text></View></ScaleButton></KeyboardAvoidingView></View>
      </Modal>
    </View>
  );
}

function NewJob({ onClose, onSave, initialJob }) {
  const [step, setStep] = useState(1);
  const [client, setClient] = useState(initialJob?.client || '');
  const [type, setType] = useState(initialJob?.type || '');
  const [place, setPlace] = useState(initialJob?.place || '');
  const [address, setAddress] = useState(initialJob?.address || '');
  const [date, setDate] = useState(initialJob?.date || '');
  const [time, setTime] = useState(initialJob?.time || '');
  const [feeText, setFeeText] = useState(initialJob ? String(initialJob.fee) : '');
  const [expenses, setExpenses] = useState(initialJob?.expenses || []);
  const [expenseModal, setExpenseModal] = useState(false);
  const [error, setError] = useState('');
  const fee = toNumber(feeText);
  const reimbursable = expenses.filter((e) => e.reimbursable).reduce((s, e) => s + e.value, 0);
  const modelPaid = expenses.filter((e) => e.payer === 'Modelo').reduce((s, e) => s + e.value, 0);
  const agencyPaid = expenses.filter((e) => e.payer === 'Agência').reduce((s, e) => s + e.value, 0);
  const clientPaid = expenses.filter((e) => e.payer === 'Cliente').reduce((s, e) => s + e.value, 0);
  const modelNonReimb = expenses.filter((e) => e.payer === 'Modelo' && !e.reimbursable).reduce((s, e) => s + e.value, 0);
  const total = fee + reimbursable;
  const profit = Math.max(0, fee - modelNonReimb);
  const next = () => {
    if (step === 1 && (!client.trim() || !type || !place || !date.trim() || !time.trim())) {
      setError('Preencha cliente, tipo, local, data e horário.'); return;
    }
    if (step === 2 && fee <= 0) { setError('Informe um cachê maior que zero.'); return; }
    setError(''); setStep((s) => Math.min(3, s + 1));
  };
  const save = () => onSave({
    id: initialJob?.id || id(), client: client.trim(), type, place, address: address.trim(), date: date.trim(), time: time.trim(), fee,
    expenses, reimbursable, modelPaid, agencyPaid, clientPaid, total, profit,
    status: initialJob?.status || 'Confirmado', createdAt: initialJob?.createdAt || Date.now(),
  });
  return (
    <View style={styles.screen}>
      <TopArea title={initialJob ? 'Editar job' : 'Novo job'} subtitle={`Etapa ${step} de 3`} back onBack={onClose} />
      <View style={styles.steps}><View style={[styles.stepBar, step >= 1 && styles.stepBarOn]} /><View style={[styles.stepBar, step >= 2 && styles.stepBarOn]} /><View style={[styles.stepBar, step >= 3 && styles.stepBarOn]} /></View>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content}>
          {step === 1 ? <FadeIn key="s1"><Text style={styles.formTitle}>Informações do trabalho</Text><Text style={styles.formSub}>Comece pelo essencial. Você pode revisar tudo antes de salvar.</Text><Field icon="business-outline" placeholder="Cliente / contratante" value={client} onChangeText={setClient} /><Text style={styles.inputLabel}>Tipo de trabalho</Text><View style={styles.pillWrap}>{TYPES.map((x) => <Pill key={x} label={x} active={type === x} onPress={() => setType(x)} />)}</View><Text style={styles.inputLabel}>Onde será</Text><View style={styles.pillWrap}>{PLACES.map((x) => <Pill key={x} label={x} active={place === x} onPress={() => setPlace(x)} />)}</View><Field icon="location-outline" placeholder="Endereço" value={address} onChangeText={setAddress} /><View style={{ flexDirection: 'row', gap: 10 }}><View style={{ flex: 1 }}><Field icon="calendar-outline" placeholder="DD/MM/AAAA" value={date} onChangeText={setDate} /></View><View style={{ width: 125 }}><Field icon="time-outline" placeholder="00:00" value={time} onChangeText={setTime} /></View></View></FadeIn> : null}
          {step === 2 ? <FadeIn key="s2"><Text style={styles.formTitle}>Valores e despesas</Text><Text style={styles.formSub}>O total a receber é recalculado automaticamente.</Text><Field icon="cash-outline" placeholder="Cachê (ex.: 1200)" value={feeText} onChangeText={setFeeText} keyboardType="numeric" /><View style={styles.totalMini}><Text style={styles.totalMiniLabel}>Total a receber</Text><Text style={styles.totalMiniValue}>{money(total)}</Text><Text style={styles.muted}>Cachê + despesas reembolsáveis</Text></View><View style={styles.sectionHeader}><Text style={styles.sectionTitle}>Despesas</Text><TouchableOpacity onPress={() => setExpenseModal(true)}><Text style={styles.linkText}>+ Adicionar</Text></TouchableOpacity></View>{expenses.length === 0 ? <View style={styles.noExpense}><Ionicons name="receipt-outline" size={25} color={C.pink} /><Text style={styles.noExpenseText}>Nenhuma despesa adicionada.</Text></View> : expenses.map((e) => <View key={e.id} style={styles.expenseRow}><View style={styles.expenseIcon}><Ionicons name="receipt-outline" size={19} color={C.pink} /></View><View style={{ flex: 1 }}><Text style={styles.expenseName}>{e.category}</Text><Text style={styles.expenseMeta}>{e.payer} • {e.reimbursable ? 'Reembolsável' : 'Não reembolsável'}</Text></View><Text style={styles.expenseValue}>{money(e.value)}</Text><TouchableOpacity onPress={() => setExpenses((prev) => prev.filter((x) => x.id !== e.id))}><Ionicons name="trash-outline" size={20} color={C.danger} /></TouchableOpacity></View>)}</FadeIn> : null}
          {step === 3 ? <FadeIn key="s3"><Text style={styles.formTitle}>Revisão do job</Text><Text style={styles.formSub}>Confira os dados e salve quando estiver tudo certo.</Text><View style={styles.reviewCard}><ReviewRow label="Cliente" value={client} /><ReviewRow label="Trabalho" value={type} /><ReviewRow label="Local" value={place} /><ReviewRow label="Data" value={`${date} • ${time}`} /><ReviewRow label="Cachê" value={money(fee)} /><ReviewRow label="Reembolsos" value={money(reimbursable)} strong /><View style={styles.reviewDivider} /><ReviewRow label="Total a receber" value={money(total)} strong big /></View><View style={styles.calcGrid}><SmallCalc label="Pago pela modelo" value={modelPaid} /><SmallCalc label="Pago pela agência" value={agencyPaid} /><SmallCalc label="Pago pelo cliente" value={clientPaid} /><SmallCalc label="Lucro aproximado" value={profit} success /></View></FadeIn> : null}
          {error ? <Text style={styles.formMessage}>{error}</Text> : null}
          <View style={styles.formActions}>{step > 1 ? <ScaleButton onPress={() => { setError(''); setStep((s) => s - 1); }} style={{ flex: 1 }}><View style={styles.secondaryButton}><Text style={styles.secondaryButtonText}>Voltar</Text></View></ScaleButton> : null}<ScaleButton onPress={step === 3 ? save : next} style={{ flex: 1 }}><View style={styles.primaryButton}><Text style={styles.primaryButtonText}>{step === 3 ? 'Salvar job' : 'Continuar'}</Text><Ionicons name={step === 3 ? 'checkmark' : 'arrow-forward'} size={20} color={C.white} /></View></ScaleButton></View>
        </ScrollView>
      </KeyboardAvoidingView>
      <ExpenseSheet visible={expenseModal} onClose={() => setExpenseModal(false)} onAdd={(expense) => { setExpenses((prev) => [...prev, expense]); setExpenseModal(false); }} />
    </View>
  );
}

function ReviewRow({ label, value, strong, big }) { return <View style={styles.reviewRow}><Text style={styles.reviewLabel}>{label}</Text><Text style={[styles.reviewValue, strong && { fontWeight: '800' }, big && { fontSize: 18, color: C.pinkDark }]}>{value}</Text></View>; }
function SmallCalc({ label, value, success }) { return <View style={styles.smallCalc}><Text style={styles.smallCalcLabel}>{label}</Text><Text style={[styles.smallCalcValue, success && { color: C.success }]}>{money(value)}</Text></View>; }

function ExpenseSheet({ visible, onClose, onAdd }) {
  const [category, setCategory] = useState(EXPENSE_CATS[0]);
  const [value, setValue] = useState('');
  const [payer, setPayer] = useState('Modelo');
  const [reimbursable, setReimbursable] = useState(true);
  const add = () => {
    const numeric = toNumber(value); if (numeric <= 0) return;
    onAdd({ id: id(), category, value: numeric, payer, reimbursable }); setValue('');
  };
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalBackdrop}><KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={[styles.sheet, { maxHeight: '88%' }]}><View style={styles.sheetHandle} /><View style={styles.sheetTitleRow}><Text style={styles.sheetTitle}>Adicionar despesa</Text><TouchableOpacity onPress={onClose}><Ionicons name="close" size={25} color={C.text} /></TouchableOpacity></View><ScrollView showsVerticalScrollIndicator={false}><Text style={styles.inputLabel}>Categoria</Text><View style={styles.pillWrap}>{EXPENSE_CATS.map((x) => <Pill key={x} small label={x} active={category === x} onPress={() => setCategory(x)} />)}</View><Field icon="cash-outline" placeholder="Valor" value={value} onChangeText={setValue} keyboardType="numeric" /><Text style={styles.inputLabel}>Quem paga</Text><View style={styles.pillWrap}>{PAYERS.map((x) => <Pill key={x} label={x} active={payer === x} onPress={() => setPayer(x)} />)}</View><TouchableOpacity style={styles.reimbRow} onPress={() => setReimbursable((v) => !v)}><View><Text style={styles.reimbTitle}>Despesa reembolsável</Text><Text style={styles.reimbSub}>Será somada ao total a receber.</Text></View><Switch value={reimbursable} onValueChange={setReimbursable} trackColor={{ false: '#ddd', true: '#F7A0C3' }} thumbColor={reimbursable ? C.pink : '#fff'} /></TouchableOpacity><ScaleButton onPress={add} disabled={toNumber(value) <= 0} style={{ marginTop: 14 }}><View style={styles.primaryButton}><Text style={styles.primaryButtonText}>Adicionar despesa</Text></View></ScaleButton></ScrollView></KeyboardAvoidingView></View>
    </Modal>
  );
}


function ProposalModal({ visible, onClose, onAccept }) {
  const scale = useRef(new Animated.Value(0.94)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!visible) return;
    scale.setValue(0.94); opacity.setValue(0);
    Animated.parallel([
      Animated.spring(scale, { toValue: 1, friction: 7, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 1, duration: 220, useNativeDriver: true }),
    ]).start();
  }, [visible]);
  const expenseTotal = INITIAL_PROPOSAL.expenses.reduce((s, e) => s + e.value, 0);
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.centerModalBackdrop}>
        <Animated.View style={[styles.proposalModalCard, { opacity, transform: [{ scale }] }]}>
          <View style={styles.proposalModalTop}><View style={styles.proposalModalIcon}><Ionicons name="notifications" size={24} color={C.white} /></View><TouchableOpacity onPress={onClose} style={styles.modalClose}><Ionicons name="close" size={22} color={C.text} /></TouchableOpacity></View>
          <Text style={styles.proposalKicker}>NOVA PROPOSTA DE JOB</Text>
          <Text style={styles.proposalModalTitle}>Job presencial em Ferraz de Vasconcelos</Text>
          <Text style={styles.proposalModalText}>Contratante: {INITIAL_PROPOSAL.client}</Text>
          <View style={styles.proposalMoneyBox}><View><Text style={styles.proposalMoneyLabel}>Valor do job</Text><Text style={styles.proposalMoneyValue}>{money(INITIAL_PROPOSAL.fee)}</Text></View><View style={styles.proposalPlus}><Ionicons name="add" size={18} color={C.pink} /></View><View><Text style={styles.proposalMoneyLabel}>Despesas previstas</Text><Text style={styles.proposalMoneySmall}>{money(expenseTotal)}</Text></View></View>
          <View style={styles.proposalDetailLine}><Ionicons name="location-outline" size={19} color={C.pink} /><Text style={styles.proposalDetailText}>{INITIAL_PROPOSAL.city}</Text></View>
          <View style={styles.proposalDetailLine}><Ionicons name="briefcase-outline" size={19} color={C.pink} /><Text style={styles.proposalDetailText}>{INITIAL_PROPOSAL.type}</Text></View>
          <Text style={styles.proposalNote}>{INITIAL_PROPOSAL.note}</Text>
          <ScaleButton onPress={onAccept} style={{ marginTop: 16 }}><View style={styles.primaryButton}><Text style={styles.primaryButtonText}>Aceitar proposta</Text><Ionicons name="arrow-forward" size={20} color={C.white} /></View></ScaleButton>
          <TouchableOpacity onPress={onClose} style={styles.proposalDecline}><Text style={styles.proposalDeclineText}>Agora não</Text></TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
}

function PixModal({ visible, onClose, available, onWithdraw }) {
  const [keyType, setKeyType] = useState('CPF');
  const [pixKey, setPixKey] = useState('');
  const [feedback, setFeedback] = useState('');
  useEffect(() => { if (!visible) { setPixKey(''); setFeedback(''); } }, [visible]);
  const submit = () => {
    if (available <= 0) { setFeedback('Nenhum valor está liberado para saque no momento.'); return; }
    if (!pixKey.trim()) { setFeedback('Informe uma chave Pix para continuar.'); return; }
    onWithdraw(); setFeedback('Saque demonstrativo solicitado com sucesso.');
    setTimeout(onClose, 700);
  };
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalBackdrop}><KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.sheet}><View style={styles.sheetHandle} /><View style={styles.sheetTitleRow}><View><Text style={styles.sheetTitle}>Sacar por Pix</Text><Text style={styles.sheetSub}>Valor liberado após o envio do comprovante.</Text></View><TouchableOpacity onPress={onClose}><Ionicons name="close" size={24} color={C.text} /></TouchableOpacity></View>
      <View style={styles.pixBalanceCard}><Text style={styles.pixBalanceLabel}>Disponível</Text><Text style={styles.pixBalanceValue}>{money(available)}</Text><View style={styles.pixSecurityRow}><Ionicons name={available > 0 ? 'lock-open-outline' : 'lock-closed-outline'} size={17} color={available > 0 ? C.success : C.muted} /><Text style={[styles.pixSecurityText, available > 0 && { color: C.success }]}>{available > 0 ? 'Saque liberado' : 'Aguardando comprovante de job finalizado'}</Text></View></View>
      <Text style={styles.inputLabel}>Tipo de chave</Text><View style={styles.pillWrap}>{['CPF', 'E-mail', 'Celular', 'Aleatória'].map((x) => <Pill key={x} small label={x} active={keyType === x} onPress={() => setKeyType(x)} />)}</View>
      <Field icon="key-outline" placeholder={`Chave Pix (${keyType})`} value={pixKey} onChangeText={setPixKey} keyboardType={keyType === 'Celular' || keyType === 'CPF' ? 'numeric' : 'default'} />
      <View style={styles.pixWarning}><Ionicons name="shield-checkmark-outline" size={20} color={C.pink} /><Text style={styles.pixWarningText}>Este Snack demonstra o fluxo. Nenhuma transferência bancária real é feita.</Text></View>
      {feedback ? <Text style={styles.formMessage}>{feedback}</Text> : null}
      <ScaleButton onPress={submit} disabled={available <= 0}><View style={styles.primaryButton}><Ionicons name="qr-code-outline" size={20} color={C.white} /><Text style={styles.primaryButtonText}>Solicitar saque</Text></View></ScaleButton>
      </KeyboardAvoidingView></View>
    </Modal>
  );
}

function ProofModal({ visible, onClose, onConfirm }) {
  const [opened, setOpened] = useState(false);
  useEffect(() => { if (!visible) setOpened(false); }, [visible]);
  const openInstagram = async () => {
    try { await Linking.openURL(AGENCY_INSTAGRAM_URL); setOpened(true); } catch (e) { setOpened(true); }
  };
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalBackdrop}><View style={styles.sheet}><View style={styles.sheetHandle} /><View style={styles.sheetTitleRow}><Text style={styles.sheetTitle}>Liberar saque</Text><TouchableOpacity onPress={onClose}><Ionicons name="close" size={24} color={C.text} /></TouchableOpacity></View>
      <View style={styles.proofHero}><View style={styles.proofIcon}><Ionicons name="document-attach-outline" size={28} color={C.pink} /></View><Text style={styles.proofTitle}>Envie o comprovante de realização</Text><Text style={styles.proofText}>Abra o Instagram, envie pelo DM oficial da agência o comprovante de realização do job e depois confirme o envio aqui.</Text></View>
      <ScaleButton onPress={openInstagram}><View style={styles.instagramButton}><Ionicons name="logo-instagram" size={21} color={C.white} /><Text style={styles.primaryButtonText}>Abrir Instagram</Text></View></ScaleButton>
      <ScaleButton onPress={onConfirm} disabled={!opened} style={{ marginTop: 10 }}><View style={[styles.primaryButton, { backgroundColor: opened ? C.success : '#BDB4B7' }]}><Ionicons name="checkmark-circle-outline" size={20} color={C.white} /><Text style={styles.primaryButtonText}>Já enviei o comprovante</Text></View></ScaleButton>
      <Text style={styles.proofFootnote}>Por segurança, o botão de confirmação é liberado depois que você abre o Instagram.</Text>
      </View></View>
    </Modal>
  );
}

function JobDetail({ job, onBack, onEdit, onDelete, onDuplicate, onStatus, onProof, onOpenPix }) {
  const [statusOpen, setStatusOpen] = useState(false);
  const [proofOpen, setProofOpen] = useState(false);
  if (!job) return null;
  const canSendProof = ['Finalizado', 'Aguardando pagamento'].includes(job.status) && !job.proofSubmitted;
  const allowedStatus = STATUS.filter((s) => s !== 'Pago' || job.proofSubmitted);
  return (
    <View style={styles.screen}>
      <TopArea title={job.client} subtitle={`${job.type} • ${job.date}`} back onBack={onBack} right={<HeaderIcon name="ellipsis-horizontal" onPress={() => setStatusOpen((v) => !v)} />} />
      <ScrollView contentContainerStyle={styles.content}>
        {statusOpen ? <View style={styles.statusPicker}><Text style={styles.inputLabel}>Alterar status</Text><View style={styles.pillWrap}>{allowedStatus.map((s) => <Pill key={s} small label={s} active={job.status === s} onPress={() => { onStatus(s); setStatusOpen(false); }} />)}</View></View> : null}
        <FadeIn style={styles.detailValueCard}><Text style={styles.eyebrow}>TOTAL A RECEBER</Text><Text style={styles.detailBig}>{money(job.total)}</Text><View style={styles.detailStatus}><View style={[styles.statusDot, { backgroundColor: job.status === 'Pago' ? C.success : C.pink }]} /><Text style={styles.detailStatusText}>{job.status}</Text></View></FadeIn>
        <View style={styles.detailCard}><DetailLine icon="briefcase-outline" label="Tipo" value={job.type} /><DetailLine icon="calendar-outline" label="Data e horário" value={`${job.date} • ${job.time}`} /><DetailLine icon="location-outline" label="Local" value={job.place} /><DetailLine icon="navigate-outline" label="Endereço" value={job.address || 'Não informado'} /></View>
        <View style={styles.detailCard}><ReviewRow label="Cachê" value={money(job.fee)} /><ReviewRow label="Reembolsos" value={money(job.reimbursable)} /><ReviewRow label="Despesas da modelo" value={money(job.modelPaid)} /><View style={styles.reviewDivider} /><ReviewRow label="Total" value={money(job.total)} strong big /></View>
        {job.expenses.length ? <><View style={styles.sectionHeader}><Text style={styles.sectionTitle}>Despesas</Text></View>{job.expenses.map((e) => <View key={e.id} style={styles.expenseRow}><View style={styles.expenseIcon}><Ionicons name="receipt-outline" size={19} color={C.pink} /></View><View style={{ flex: 1 }}><Text style={styles.expenseName}>{e.category}</Text><Text style={styles.expenseMeta}>{e.payer} • {e.reimbursable ? 'Reembolsável' : 'Não reembolsável'}</Text></View><Text style={styles.expenseValue}>{money(e.value)}</Text></View>)}</> : null}

        {job.proofSubmitted && !job.withdrawn ? <TouchableOpacity style={styles.unlockedCard} activeOpacity={0.85} onPress={onOpenPix}><View style={styles.unlockedIcon}><Ionicons name="lock-open-outline" size={22} color={C.success} /></View><View style={{ flex: 1 }}><Text style={styles.unlockedTitle}>Saque Pix liberado</Text><Text style={styles.unlockedText}>Comprovante registrado. Toque para sacar {money(job.total)}.</Text></View><Ionicons name="chevron-forward" size={20} color={C.success} /></TouchableOpacity> : null}
        {canSendProof ? <ScaleButton onPress={() => setProofOpen(true)}><View style={styles.primaryButton}><Ionicons name="document-attach-outline" size={20} color={C.white} /><Text style={styles.primaryButtonText}>Enviar comprovante e liberar Pix</Text></View></ScaleButton> : null}
        {!job.proofSubmitted && !canSendProof && job.status !== 'Pago' ? <View style={styles.lockedInfo}><Ionicons name="lock-closed-outline" size={19} color={C.muted} /><Text style={styles.lockedInfoText}>Finalize o job para liberar o envio do comprovante.</Text></View> : null}

        <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}><ScaleButton onPress={onEdit} style={{ flex: 1 }}><View style={styles.secondaryButton}><Ionicons name="create-outline" size={19} color={C.text} /><Text style={styles.secondaryButtonText}>Editar</Text></View></ScaleButton><ScaleButton onPress={onDuplicate} style={{ flex: 1 }}><View style={styles.secondaryButton}><Ionicons name="copy-outline" size={19} color={C.text} /><Text style={styles.secondaryButtonText}>Duplicar</Text></View></ScaleButton></View>
        <ScaleButton onPress={onDelete} style={{ marginTop: 10 }}><View style={styles.dangerButton}><Ionicons name="trash-outline" size={19} color={C.danger} /><Text style={styles.dangerButtonText}>Excluir job</Text></View></ScaleButton>
      </ScrollView>
      <ProofModal visible={proofOpen} onClose={() => setProofOpen(false)} onConfirm={() => { onProof(); setProofOpen(false); }} />
    </View>
  );
}

function DetailLine({ icon, label, value }) { return <View style={styles.detailLine}><View style={styles.detailIcon}><Ionicons name={icon} size={20} color={C.pink} /></View><View style={{ flex: 1 }}><Text style={styles.detailLabel}>{label}</Text><Text style={styles.detailText}>{value}</Text></View></View>; }

export default function App() {
  const [phase, setPhase] = useState('splash');
  const [logged, setLogged] = useState(false);
  const [tab, setTab] = useState('home');
  const [route, setRoute] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [clients, setClients] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [editingJob, setEditingJob] = useState(null);
  const [proposalVisible, setProposalVisible] = useState(false);
  const [proposalHandled, setProposalHandled] = useState(false);
  const [pixVisible, setPixVisible] = useState(false);
  const [storageReady, setStorageReady] = useState(false);


  useEffect(() => {
    let mounted = true;

    const loadStoredData = async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (!mounted || !raw) return;

        const saved = JSON.parse(raw);
        if (Array.isArray(saved.jobs)) setJobs(saved.jobs);
        if (Array.isArray(saved.clients)) setClients(saved.clients);
        if (typeof saved.proposalHandled === 'boolean') setProposalHandled(saved.proposalHandled);
      } catch (error) {
        console.warn('Não foi possível carregar os dados locais:', error);
      } finally {
        if (mounted) setStorageReady(true);
      }
    };

    loadStoredData();
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    if (!storageReady) return;

    const persist = async () => {
      try {
        await AsyncStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({ jobs, clients, proposalHandled })
        );
      } catch (error) {
        console.warn('Não foi possível salvar os dados locais:', error);
      }
    };

    persist();
  }, [jobs, clients, proposalHandled, storageReady]);

  const selectedJob = jobs.find((j) => j.id === selectedId);
  const availablePix = jobs.filter((j) => j.proofSubmitted && !j.withdrawn).reduce((sum, j) => sum + j.total, 0);

  useEffect(() => {
    if (!logged || proposalHandled) return;
    const t = setTimeout(() => setProposalVisible(true), 750);
    return () => clearTimeout(t);
  }, [logged, proposalHandled]);

  const openJob = (jobId) => { setSelectedId(jobId); setRoute('detail'); };
  const saveJob = (job) => {
    const normalized = { ...job, proofSubmitted: job.proofSubmitted || false, withdrawn: job.withdrawn || false };
    setJobs((prev) => {
      const exists = prev.some((x) => x.id === normalized.id);
      return exists ? prev.map((x) => x.id === normalized.id ? normalized : x) : [normalized, ...prev];
    });
    setClients((prev) => prev.some((c) => c.name.toLowerCase() === normalized.client.toLowerCase()) ? prev : [...prev, { id: id(), name: normalized.client, phone: '', notes: '', favorite: false, rating: 5 }]);
    setEditingJob(null); setRoute(null); setTab('home');
  };
  const deleteJob = () => { setJobs((prev) => prev.filter((j) => j.id !== selectedId)); setSelectedId(null); setRoute(null); setTab('jobs'); };
  const duplicate = () => {
    if (!selectedJob) return;
    const copy = { ...selectedJob, id: id(), status: 'Orçamento', createdAt: Date.now(), proofSubmitted: false, withdrawn: false, expenses: selectedJob.expenses.map((e) => ({ ...e, id: id() })) };
    setJobs((prev) => [copy, ...prev]); setSelectedId(copy.id); setRoute('detail');
  };
  const setStatus = (status) => setJobs((prev) => prev.map((j) => j.id === selectedId ? { ...j, status } : j));
  const submitProof = () => setJobs((prev) => prev.map((j) => j.id === selectedId ? { ...j, proofSubmitted: true, status: 'Aguardando pagamento' } : j));
  const withdrawPix = () => setJobs((prev) => prev.map((j) => j.proofSubmitted && !j.withdrawn ? { ...j, withdrawn: true, status: 'Pago' } : j));

  const acceptProposal = () => {
    const exists = jobs.some((j) => j.sourceProposalId === INITIAL_PROPOSAL.id);
    if (!exists) {
      const expenses = INITIAL_PROPOSAL.expenses.map((e) => ({ ...e, id: id() }));
      const reimbursable = expenses.filter((e) => e.reimbursable).reduce((s, e) => s + e.value, 0);
      const modelPaid = expenses.filter((e) => e.payer === 'Modelo').reduce((s, e) => s + e.value, 0);
      const agencyPaid = expenses.filter((e) => e.payer === 'Agência').reduce((s, e) => s + e.value, 0);
      const clientPaid = expenses.filter((e) => e.payer === 'Cliente').reduce((s, e) => s + e.value, 0);
      const job = {
        id: id(), sourceProposalId: INITIAL_PROPOSAL.id, client: INITIAL_PROPOSAL.client, type: INITIAL_PROPOSAL.type,
        place: 'Locação externa', address: INITIAL_PROPOSAL.city, date: 'A combinar', time: 'A combinar', fee: INITIAL_PROPOSAL.fee,
        expenses, reimbursable, total: INITIAL_PROPOSAL.fee + reimbursable, modelPaid, agencyPaid, clientPaid,
        ownCost: 0, profit: INITIAL_PROPOSAL.fee, status: 'Confirmado', createdAt: Date.now(), proofSubmitted: false, withdrawn: false,
      };
      setJobs((prev) => [job, ...prev]);
      setClients((prev) => prev.some((c) => c.name.toLowerCase() === INITIAL_PROPOSAL.client.toLowerCase()) ? prev : [...prev, { id: id(), name: INITIAL_PROPOSAL.client, phone: '', notes: 'Contato originado por proposta recebida no app.', favorite: false, rating: 5 }]);
      setSelectedId(job.id);
    }
    setProposalHandled(true); setProposalVisible(false); setTab('home');
  };

  if (phase === 'splash' || !storageReady) return <Splash onDone={() => setPhase('app')} />;
  if (!logged) return <Login onLogin={() => { setLogged(true); }} />;
  if (route === 'new') return <NewJob onClose={() => { setRoute(null); setEditingJob(null); }} onSave={saveJob} initialJob={editingJob} />;
  if (route === 'clients') return <Clients clients={clients} setClients={setClients} jobs={jobs} onBack={() => setRoute(null)} />;
  if (route === 'detail') return <JobDetail job={selectedJob} onBack={() => { setRoute(null); setTab('jobs'); }} onEdit={() => { setEditingJob(selectedJob); setRoute('new'); }} onDelete={deleteJob} onDuplicate={duplicate} onStatus={setStatus} onProof={submitProof} onOpenPix={() => setPixVisible(true)} />;

  return (
    <SafeAreaView style={styles.appSafe}>
      <View style={{ flex: 1 }}>
        {tab === 'home' ? <Home jobs={jobs} onNewJob={() => { setEditingJob(null); setRoute('new'); }} onNavigate={(r) => r === 'clients' ? setRoute('clients') : setTab(r)} onOpenJob={openJob} onOpenProposal={() => proposalHandled ? null : setProposalVisible(true)} onOpenPix={() => setPixVisible(true)} proposalAvailable={!proposalHandled} /> : null}
        {tab === 'jobs' ? <Jobs jobs={jobs} onOpenJob={openJob} onNewJob={() => { setEditingJob(null); setRoute('new'); }} /> : null}
        {tab === 'finance' ? <Finance jobs={jobs} /> : null}
        {tab === 'profile' ? <Profile onLogout={() => { setLogged(false); setTab('home'); setRoute(null); setProposalVisible(false); setPixVisible(false); }} /> : null}
      </View>
      <BottomNav active={tab} onChange={(t) => { setTab(t); setRoute(null); }} />
      <ProposalModal visible={proposalVisible} onClose={() => { setProposalVisible(false); setProposalHandled(true); }} onAccept={acceptProposal} />
      <PixModal visible={pixVisible} onClose={() => setPixVisible(false)} available={availablePix} onWithdraw={withdrawPix} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  appSafe: { flex: 1, backgroundColor: C.white },
  screen: { flex: 1, backgroundColor: C.bg },
  splash: { flex: 1, backgroundColor: C.pink, alignItems: 'center', justifyContent: 'center' },
  splashBrand: { color: C.white, fontSize: 34, fontWeight: '900', letterSpacing: -1, marginTop: 14 },
  splashSub: { color: '#FFD6E5', fontSize: 14, marginTop: 7, fontWeight: '600' },
  loginScreen: { flex: 1, backgroundColor: C.white },
  loginHero: { height: 295, backgroundColor: C.pink, borderBottomLeftRadius: 42, borderBottomRightRadius: 42, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  loginBrand: { fontSize: 32, fontWeight: '900', color: C.white, letterSpacing: -1.2, marginTop: 8 },
  loginSlogan: { color: '#FFD7E6', fontSize: 16, marginTop: 7 },
  decorOne: { position: 'absolute', width: 130, height: 130, borderRadius: 65, backgroundColor: C.pinkDark, left: -50, top: -35, opacity: 0.45 },
  decorDots: { position: 'absolute', right: 30, top: 42, flexDirection: 'row', gap: 12 },
  dot: { width: 13, height: 13, borderRadius: 7, backgroundColor: C.white },
  loginBody: { padding: 24, gap: 13 },
  field: { minHeight: 58, borderRadius: 20, backgroundColor: C.pinkUltra, borderWidth: 1, borderColor: C.border, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, marginBottom: 12 },
  fieldInput: { flex: 1, color: C.text, fontSize: 16, paddingVertical: 15 },
  loginOptions: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: -2 },
  remember: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  checkbox: { width: 23, height: 23, borderWidth: 2, borderColor: C.pink, borderRadius: 7, alignItems: 'center', justifyContent: 'center' },
  checkboxOn: { backgroundColor: C.pink },
  rememberText: { color: C.text, fontSize: 14 },
  linkText: { color: C.pink, fontWeight: '800' },
  formMessage: { color: C.danger, fontSize: 13, fontWeight: '700', marginTop: 5 },
  primaryButton: { minHeight: 58, borderRadius: 20, backgroundColor: C.pink, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9, paddingHorizontal: 18 },
  primaryButtonText: { color: C.white, fontSize: 16, fontWeight: '900' },
  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: 8 },
  divider: { height: 1, backgroundColor: C.border, flex: 1 },
  dividerText: { color: C.muted, fontSize: 14 },
  googleButton: { minHeight: 58, borderRadius: 20, borderWidth: 1.5, borderColor: '#F7A0C3', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 11, backgroundColor: C.white },
  googleG: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#F5F7FF', alignItems: 'center', justifyContent: 'center' },
  googleText: { color: C.text, fontWeight: '800', fontSize: 16 },
  signupRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 12 },
  signupText: { color: C.text },
  topArea: { backgroundColor: C.pink, paddingTop: Platform.OS === 'android' ? 18 : 8, paddingHorizontal: 20, paddingBottom: 24, borderBottomLeftRadius: 34, borderBottomRightRadius: 34 },
  topRow: { flexDirection: 'row', alignItems: 'center', minHeight: 45 },
  topTitle: { color: C.white, fontWeight: '900', fontSize: 29, letterSpacing: -0.7, marginTop: 8 },
  topSubtitle: { color: '#FFD6E5', fontSize: 14, lineHeight: 20, marginTop: 5, maxWidth: '90%' },
  headerIcon: { width: 42, height: 42, borderRadius: 21, backgroundColor: 'rgba(255,255,255,0.16)', alignItems: 'center', justifyContent: 'center' },
  homeHero: { backgroundColor: C.pink, paddingHorizontal: 20, paddingTop: Platform.OS === 'android' ? 18 : 10, paddingBottom: 28, borderBottomLeftRadius: 36, borderBottomRightRadius: 36 },
  heroTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: C.white, alignItems: 'center', justifyContent: 'center', shadowColor: C.shadow, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4 },
  hello: { color: C.white, fontSize: 29, fontWeight: '900', marginTop: 24, letterSpacing: -0.6 },
  heroSub: { color: '#FFD7E7', marginTop: 5, fontSize: 14 },
  content: { padding: 18, paddingBottom: 35 },
  financeHeroCard: { backgroundColor: C.white, borderRadius: 26, padding: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: -4, shadowColor: C.shadow, shadowOpacity: 0.09, shadowRadius: 18, elevation: 3 },
  eyebrow: { color: C.muted, fontWeight: '800', fontSize: 11, letterSpacing: 1.1 },
  bigMoney: { color: C.text, fontWeight: '900', fontSize: 27, marginTop: 7, letterSpacing: -0.7 },
  muted: { color: C.muted, fontSize: 12, marginTop: 3 },
  pendingBox: { backgroundColor: C.pinkUltra, borderRadius: 18, padding: 13, minWidth: 108 },
  pendingLabel: { color: C.muted, fontSize: 11, fontWeight: '700' },
  pendingValue: { color: C.pinkDark, fontWeight: '900', fontSize: 15, marginTop: 5 },
  shortcutsRow: { gap: 16, paddingVertical: 22, paddingRight: 16 },
  shortcutItem: { width: 72, alignItems: 'center' },
  shortcutCircle: { width: 66, height: 66, borderRadius: 33, backgroundColor: C.pinkSoft, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#F9D4E3' },
  shortcutLabel: { textAlign: 'center', color: C.text, fontWeight: '700', fontSize: 12, marginTop: 8 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4, marginBottom: 12 },
  sectionTitle: { color: C.text, fontSize: 20, fontWeight: '900', letterSpacing: -0.4 },
  emptyCard: { backgroundColor: C.white, borderRadius: 28, padding: 24, alignItems: 'center', borderWidth: 1, borderColor: C.border },
  emptyIcon: { width: 72, height: 72, borderRadius: 36, backgroundColor: C.pinkUltra, alignItems: 'center', justifyContent: 'center', marginBottom: 15 },
  emptyTitle: { color: C.text, fontSize: 20, fontWeight: '900' },
  emptyText: { color: C.muted, textAlign: 'center', lineHeight: 20, marginTop: 7, maxWidth: 290 },
  bottomNav: { flexDirection: 'row', backgroundColor: C.white, borderTopWidth: 1, borderColor: C.border, paddingTop: 8, paddingBottom: Platform.OS === 'ios' ? 12 : 8, paddingHorizontal: 8 },
  navItem: { flex: 1, alignItems: 'center', gap: 4 },
  navDot: { width: 38, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  navDotActive: { backgroundColor: C.pink },
  navLabel: { fontSize: 10, color: C.muted, fontWeight: '700' },
  navLabelActive: { color: C.pinkDark },
  jobCard: { backgroundColor: C.white, borderRadius: 22, padding: 15, flexDirection: 'row', gap: 12, alignItems: 'center', marginBottom: 11, borderWidth: 1, borderColor: C.border },
  jobIcon: { width: 50, height: 50, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  jobClient: { color: C.text, fontSize: 16, fontWeight: '900' },
  jobMeta: { color: C.muted, fontSize: 12, marginTop: 3 },
  statusLine: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 7 },
  statusDot: { width: 7, height: 7, borderRadius: 4 },
  jobStatus: { fontSize: 11, fontWeight: '800' },
  jobValue: { color: C.text, fontWeight: '900', fontSize: 14 },
  pill: { paddingHorizontal: 13, paddingVertical: 10, borderRadius: 15, borderWidth: 1, borderColor: C.border, backgroundColor: C.white },
  pillSmall: { paddingHorizontal: 11, paddingVertical: 8 },
  pillActive: { backgroundColor: C.pink, borderColor: C.pink },
  pillText: { color: C.text, fontSize: 13, fontWeight: '700' },
  pillTextActive: { color: C.white },
  financeMain: { backgroundColor: C.text, borderRadius: 28, padding: 22, marginBottom: 14 },
  metricValue: { color: C.text, fontWeight: '900', fontSize: 17, marginTop: 5 },
  financeMain: { backgroundColor: C.text, borderRadius: 28, padding: 22, marginBottom: 14 },
  metricGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  metricCard: { width: (width - 46) / 2, minHeight: 130, backgroundColor: C.white, borderRadius: 22, padding: 16, borderWidth: 1, borderColor: C.border },
  metricIcon: { width: 38, height: 38, borderRadius: 14, backgroundColor: C.pinkUltra, alignItems: 'center', justifyContent: 'center', marginBottom: 11 },
  metricLabel: { color: C.muted, fontSize: 12, fontWeight: '700' },
  monthCard: { backgroundColor: C.white, padding: 18, borderRadius: 22, borderWidth: 1, borderColor: C.border },
  monthBarRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  monthName: { fontWeight: '900', fontSize: 16, color: C.text },
  monthValue: { fontWeight: '900', color: C.pinkDark },
  progressTrack: { height: 10, borderRadius: 5, backgroundColor: C.pinkSoft, overflow: 'hidden', marginVertical: 14 },
  progressFill: { height: '100%', backgroundColor: C.pink, borderRadius: 5 },
  profileCard: { alignItems: 'center', backgroundColor: C.white, borderRadius: 28, padding: 24, borderWidth: 1, borderColor: C.border },
  profileAvatar: { width: 86, height: 86, borderRadius: 43, backgroundColor: C.pinkSoft, alignItems: 'center', justifyContent: 'center' },
  profileName: { color: C.text, fontSize: 22, fontWeight: '900', marginTop: 12 },
  profileEmail: { color: C.muted, marginTop: 4 },
  agencyBadge: { flexDirection: 'row', gap: 6, backgroundColor: C.pinkUltra, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 14, marginTop: 12 },
  agencyText: { color: C.pinkDark, fontWeight: '800', fontSize: 12 },
  settingsCard: { backgroundColor: C.white, borderRadius: 24, marginTop: 14, paddingHorizontal: 16, borderWidth: 1, borderColor: C.border },
  settingRow: { minHeight: 60, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderColor: C.border },
  settingLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  settingText: { color: C.text, fontWeight: '700', fontSize: 14 },
  logoutButton: { minHeight: 56, borderRadius: 18, backgroundColor: '#FFF0F3', alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 9, marginTop: 14 },
  logoutText: { color: C.danger, fontWeight: '900' },
  clientCard: { backgroundColor: C.white, borderRadius: 22, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10, borderWidth: 1, borderColor: C.border },
  clientAvatar: { width: 48, height: 48, borderRadius: 16, backgroundColor: C.pinkUltra, alignItems: 'center', justifyContent: 'center' },
  clientName: { color: C.text, fontWeight: '900', fontSize: 16 },
  clientMeta: { color: C.muted, fontSize: 12, marginTop: 3 },
  clientVolume: { color: C.pinkDark, fontSize: 12, fontWeight: '800', marginTop: 6 },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(25,20,22,0.25)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: C.white, padding: 20, borderTopLeftRadius: 30, borderTopRightRadius: 30, paddingBottom: Platform.OS === 'ios' ? 34 : 22 },
  sheetHandle: { width: 46, height: 5, borderRadius: 3, backgroundColor: '#E7DCE0', alignSelf: 'center', marginBottom: 16 },
  sheetTitleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 },
  sheetTitle: { color: C.text, fontSize: 22, fontWeight: '900' },
  steps: { flexDirection: 'row', gap: 7, paddingHorizontal: 20, paddingTop: 14 },
  stepBar: { height: 5, flex: 1, borderRadius: 4, backgroundColor: C.pinkSoft },
  stepBarOn: { backgroundColor: C.pink },
  formTitle: { color: C.text, fontWeight: '900', fontSize: 24, letterSpacing: -0.5, marginBottom: 6 },
  formSub: { color: C.muted, lineHeight: 20, marginBottom: 18 },
  inputLabel: { color: C.text, fontWeight: '900', fontSize: 14, marginBottom: 9, marginTop: 2 },
  pillWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  totalMini: { backgroundColor: C.text, borderRadius: 22, padding: 18, marginBottom: 18 },
  totalMiniLabel: { color: '#D8CED2', fontSize: 12, fontWeight: '700' },
  totalMiniValue: { color: C.white, fontWeight: '900', fontSize: 27, marginTop: 5 },
  noExpense: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: C.pinkUltra, padding: 16, borderRadius: 18 },
  noExpenseText: { color: C.muted, fontWeight: '700' },
  expenseRow: { flexDirection: 'row', gap: 10, alignItems: 'center', backgroundColor: C.white, borderWidth: 1, borderColor: C.border, borderRadius: 18, padding: 12, marginBottom: 9 },
  expenseIcon: { width: 38, height: 38, borderRadius: 13, backgroundColor: C.pinkUltra, alignItems: 'center', justifyContent: 'center' },
  expenseName: { color: C.text, fontWeight: '800', fontSize: 14 },
  expenseMeta: { color: C.muted, fontSize: 11, marginTop: 3 },
  expenseValue: { color: C.text, fontWeight: '900', fontSize: 13 },
  formActions: { flexDirection: 'row', gap: 10, marginTop: 18 },
  secondaryButton: { minHeight: 56, borderRadius: 19, backgroundColor: C.white, borderWidth: 1.5, borderColor: C.border, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingHorizontal: 14 },
  secondaryButtonText: { color: C.text, fontWeight: '900' },
  reviewCard: { backgroundColor: C.white, borderRadius: 24, padding: 18, borderWidth: 1, borderColor: C.border },
  reviewRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 18, paddingVertical: 9 },
  reviewLabel: { color: C.muted, fontSize: 13, flex: 1 },
  reviewValue: { color: C.text, fontSize: 14, fontWeight: '700', textAlign: 'right', flex: 1.2 },
  reviewDivider: { height: 1, backgroundColor: C.border, marginVertical: 5 },
  calcGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 12 },
  smallCalc: { width: (width - 46) / 2, backgroundColor: C.pinkUltra, borderRadius: 18, padding: 14 },
  smallCalcLabel: { color: C.muted, fontSize: 11, fontWeight: '700' },
  smallCalcValue: { color: C.text, fontWeight: '900', marginTop: 5 },
  reimbRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: C.pinkUltra, borderRadius: 18, padding: 15, marginTop: 4 },
  reimbTitle: { color: C.text, fontWeight: '900' },
  reimbSub: { color: C.muted, fontSize: 11, marginTop: 3 },
  statusPicker: { backgroundColor: C.white, borderRadius: 22, padding: 15, marginBottom: 12, borderWidth: 1, borderColor: C.border },
  detailValueCard: { backgroundColor: C.text, borderRadius: 27, padding: 22, marginBottom: 13 },
  detailBig: { color: C.white, fontSize: 30, fontWeight: '900', marginTop: 6 },
  detailStatus: { flexDirection: 'row', alignItems: 'center', gap: 7, marginTop: 12 },
  detailStatusText: { color: '#F8D8E5', fontWeight: '800', fontSize: 12 },
  detailCard: { backgroundColor: C.white, borderRadius: 23, padding: 16, borderWidth: 1, borderColor: C.border, marginBottom: 12 },
  detailLine: { flexDirection: 'row', gap: 11, alignItems: 'center', paddingVertical: 9 },
  detailIcon: { width: 38, height: 38, borderRadius: 13, backgroundColor: C.pinkUltra, alignItems: 'center', justifyContent: 'center' },
  detailLabel: { color: C.muted, fontSize: 11, fontWeight: '700' },
  detailText: { color: C.text, fontWeight: '800', marginTop: 2 },
  dangerButton: { minHeight: 56, borderRadius: 19, backgroundColor: '#FFF0F3', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  dangerButtonText: { color: C.danger, fontWeight: '900' },

  homeHeroFaithful: { backgroundColor: C.pink, paddingHorizontal: 20, paddingTop: 12, paddingBottom: 34 },
  heroAvatar: { width: 52, height: 52, borderRadius: 26, backgroundColor: C.pinkDark, alignItems: 'center', justifyContent: 'center', shadowColor: C.pinkDark, shadowOpacity: 0.28, shadowRadius: 8, shadowOffset: { width: 0, height: 5 }, elevation: 5 },
  avatarPing: { position: 'absolute', width: 12, height: 12, borderRadius: 6, backgroundColor: C.white, right: 1, top: 0, borderWidth: 2, borderColor: C.pink },
  helloFaithful: { color: C.white, fontSize: 28, fontWeight: '900', letterSpacing: -0.8, marginTop: 26 },
  homeFaithfulContent: { paddingHorizontal: 18, paddingBottom: 30, backgroundColor: C.bg },
  accountPanel: { backgroundColor: C.white, borderRadius: 0, paddingHorizontal: 4, paddingTop: 24, paddingBottom: 12 },
  accountTopLine: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  accountTitle: { color: C.text, fontSize: 20, fontWeight: '900' },
  accountAmount: { color: C.text, fontSize: 20, fontWeight: '900', marginTop: 8, letterSpacing: 1 },
  accountHint: { color: C.muted, fontSize: 12, marginTop: 8, lineHeight: 17 },
  accountArrow: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  shortcutsRowFaithful: { gap: 18, paddingVertical: 22, paddingRight: 18 },
  shortcutItemFaithful: { width: 82, alignItems: 'center' },
  shortcutCircleFaithful: { width: 70, height: 70, borderRadius: 35, backgroundColor: C.pinkSoft, alignItems: 'center', justifyContent: 'center' },
  shortcutLabelFaithful: { color: C.text, fontSize: 12, fontWeight: '800', textAlign: 'center', marginTop: 8 },
  shortcutMiniBadge: { position: 'absolute', bottom: -3, right: -2, minWidth: 28, height: 20, borderRadius: 10, backgroundColor: C.pink, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 5, borderWidth: 2, borderColor: C.white },
  shortcutMiniBadgeText: { color: C.white, fontSize: 9, fontWeight: '900' },
  notificationBadge: { position: 'absolute', right: -2, top: -3, width: 17, height: 17, borderRadius: 9, backgroundColor: C.white, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: C.pink },
  notificationBadgeText: { color: C.pink, fontSize: 9, fontWeight: '900' },
  proposalHomeCard: { backgroundColor: C.pinkUltra, borderRadius: 24, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderColor: '#F8D7E5', marginBottom: 12 },
  proposalHomeIcon: { width: 48, height: 48, borderRadius: 17, backgroundColor: C.white, alignItems: 'center', justifyContent: 'center' },
  proposalHomeEyebrow: { color: C.pink, fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  proposalHomeTitle: { color: C.text, fontSize: 15, fontWeight: '900', marginTop: 4 },
  proposalHomeMeta: { color: C.muted, fontSize: 11, marginTop: 4 },
  pixInfoCard: { backgroundColor: C.white, borderRadius: 23, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderColor: C.border, marginBottom: 18 },
  pixInfoIcon: { width: 48, height: 48, borderRadius: 16, backgroundColor: C.pinkSoft, alignItems: 'center', justifyContent: 'center' },
  pixInfoTitle: { color: C.text, fontWeight: '900', fontSize: 15 },
  pixInfoText: { color: C.muted, fontSize: 11, lineHeight: 16, marginTop: 3 },
  centerModalBackdrop: { flex: 1, backgroundColor: 'rgba(25,20,22,.38)', padding: 20, alignItems: 'center', justifyContent: 'center' },
  proposalModalCard: { width: '100%', maxWidth: 430, backgroundColor: C.white, borderRadius: 30, padding: 22, shadowColor: '#000', shadowOpacity: .18, shadowRadius: 22, shadowOffset: { width: 0, height: 12 }, elevation: 12 },
  proposalModalTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  proposalModalIcon: { width: 50, height: 50, borderRadius: 18, backgroundColor: C.pink, alignItems: 'center', justifyContent: 'center' },
  modalClose: { width: 38, height: 38, borderRadius: 19, backgroundColor: C.pinkUltra, alignItems: 'center', justifyContent: 'center' },
  proposalKicker: { color: C.pink, fontSize: 10, letterSpacing: 1.2, fontWeight: '900', marginTop: 18 },
  proposalModalTitle: { color: C.text, fontSize: 24, lineHeight: 29, fontWeight: '900', letterSpacing: -.5, marginTop: 6 },
  proposalModalText: { color: C.muted, fontSize: 13, marginTop: 7 },
  proposalMoneyBox: { backgroundColor: C.pinkUltra, borderRadius: 20, padding: 16, marginTop: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  proposalMoneyLabel: { color: C.muted, fontSize: 10, fontWeight: '800' },
  proposalMoneyValue: { color: C.text, fontSize: 23, fontWeight: '900', marginTop: 4 },
  proposalMoneySmall: { color: C.text, fontSize: 16, fontWeight: '900', marginTop: 4 },
  proposalPlus: { width: 30, height: 30, borderRadius: 15, backgroundColor: C.white, alignItems: 'center', justifyContent: 'center' },
  proposalDetailLine: { flexDirection: 'row', alignItems: 'center', gap: 9, marginTop: 13 },
  proposalDetailText: { color: C.text, fontWeight: '700', fontSize: 13 },
  proposalNote: { color: C.muted, fontSize: 12, lineHeight: 18, marginTop: 14 },
  proposalDecline: { alignItems: 'center', justifyContent: 'center', paddingVertical: 13 },
  proposalDeclineText: { color: C.muted, fontWeight: '800' },
  sheetSub: { color: C.muted, fontSize: 12, marginTop: 3 },
  pixBalanceCard: { backgroundColor: C.text, borderRadius: 24, padding: 18, marginBottom: 18 },
  pixBalanceLabel: { color: '#D7CDD1', fontSize: 12, fontWeight: '700' },
  pixBalanceValue: { color: C.white, fontSize: 30, fontWeight: '900', marginTop: 5 },
  pixSecurityRow: { flexDirection: 'row', alignItems: 'center', gap: 7, marginTop: 11 },
  pixSecurityText: { color: '#C5BBBF', fontSize: 11, fontWeight: '700' },
  pixWarning: { backgroundColor: C.pinkUltra, borderRadius: 16, padding: 13, flexDirection: 'row', gap: 10, marginBottom: 14, alignItems: 'center' },
  pixWarningText: { color: C.muted, fontSize: 11, lineHeight: 16, flex: 1 },
  proofHero: { alignItems: 'center', paddingHorizontal: 8, paddingBottom: 18 },
  proofIcon: { width: 68, height: 68, borderRadius: 24, backgroundColor: C.pinkUltra, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  proofTitle: { color: C.text, fontSize: 20, fontWeight: '900' },
  proofText: { color: C.muted, fontSize: 12, textAlign: 'center', lineHeight: 18, marginTop: 7 },
  proofFootnote: { color: C.muted, fontSize: 10, textAlign: 'center', marginTop: 10, lineHeight: 15 },
  instagramButton: { minHeight: 58, borderRadius: 20, backgroundColor: C.pinkDark, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9 },
  unlockedCard: { backgroundColor: '#EDF8F3', borderRadius: 20, padding: 15, flexDirection: 'row', alignItems: 'center', gap: 11, borderWidth: 1, borderColor: '#CDE8DB', marginBottom: 12 },
  unlockedIcon: { width: 43, height: 43, borderRadius: 15, backgroundColor: C.white, alignItems: 'center', justifyContent: 'center' },
  unlockedTitle: { color: C.success, fontSize: 14, fontWeight: '900' },
  unlockedText: { color: '#5E7267', fontSize: 11, marginTop: 3, lineHeight: 16 },
  lockedInfo: { backgroundColor: C.white, borderRadius: 18, borderWidth: 1, borderColor: C.border, padding: 14, flexDirection: 'row', gap: 9, alignItems: 'center', marginBottom: 10 },
  lockedInfoText: { color: C.muted, fontSize: 12, flex: 1 },
});
