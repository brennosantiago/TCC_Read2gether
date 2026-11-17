import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Link } from 'expo-router';
import { useAuth } from '../hooks/useAuth';
import { useAppTheme, useThemedStyles } from '../hooks/useAppTheme';
import { createStyles } from '../styles/auth';

export default function LoginScreen() {
  const { signIn, signUp } = useAuth();
  const { colors } = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [creatingAccount, setCreatingAccount] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  async function submit() {
    if (submitting) return;
    setSubmitting(true);
    setError('');
    try {
      if (creatingAccount) await signUp(email, password, username);
      else await signIn(email, password);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <View style={styles.screen}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1, justifyContent: 'center' }}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.content}>
            <Text style={styles.brand}>read<Text style={styles.brandAccent}>2</Text>gether</Text>
            <View style={styles.card}>
              <Text style={styles.eyebrow}>SUA PRÓXIMA LEITURA COMEÇA AQUI</Text>
              <Text style={styles.title}>{creatingAccount ? 'Crie sua conta' : 'Bem-vindo de volta'}</Text>
              <Text style={styles.subtitle}>{creatingAccount
                ? 'Escolha um nome de usuário, informe seu e-mail e crie uma senha com pelo menos 8 caracteres.'
                : 'Entre para acompanhar suas leituras, metas e conquistas.'}</Text>

              {creatingAccount && <>
                <Text style={styles.label}>Nome de usuário</Text>
                <TextInput
                  value={username}
                  onChangeText={setUsername}
                  placeholder="ex.: leitorapaula"
                  placeholderTextColor={colors.muted}
                  style={styles.input}
                  autoCapitalize="none"
                  autoCorrect={false}
                  maxLength={20}
                  textContentType="username"
                  returnKeyType="next"
                  accessibilityLabel="Nome de usuário"
                />
                <Text style={styles.inputHint}>De 3 a 20 caracteres: letras, números, ponto ou sublinhado. A disponibilidade será conferida ao criar.</Text>
              </>}

              <Text style={styles.label}>E-mail</Text>
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="voce@email.com"
                placeholderTextColor={colors.muted}
                style={styles.input}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                textContentType="emailAddress"
                returnKeyType="next"
                accessibilityLabel="E-mail"
              />

              <Text style={styles.label}>Senha</Text>
              <View style={styles.passwordRow}>
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Digite sua senha"
                  placeholderTextColor={colors.muted}
                  style={styles.passwordInput}
                  secureTextEntry={!passwordVisible}
                  textContentType="password"
                  returnKeyType="go"
                  onSubmitEditing={submit}
                  accessibilityLabel="Senha"
                />
                <Pressable
                  onPress={() => setPasswordVisible((visible) => !visible)}
                  style={styles.togglePassword}
                  accessibilityRole="button"
                  accessibilityLabel={passwordVisible ? 'Ocultar senha' : 'Mostrar senha'}
                >
                  <Text style={styles.togglePasswordText}>{passwordVisible ? 'Ocultar' : 'Mostrar'}</Text>
                </Pressable>
              </View>

              {!creatingAccount && (
                <Link href="/forgot-password" asChild>
                  <Pressable style={styles.forgotLink} accessibilityRole="link">
                    <Text style={styles.forgotText}>Esqueci minha senha</Text>
                  </Pressable>
                </Link>
              )}

              {error ? <Text style={styles.errorText}>{error}</Text> : null}

              <Pressable
                onPress={submit}
                style={[styles.submitButton, submitting && styles.disabledButton]}
                disabled={submitting}
                accessibilityRole="button"
                accessibilityLabel={creatingAccount ? 'Criar conta' : 'Entrar no aplicativo'}
              >
                {submitting
                  ? <ActivityIndicator color="#FFFFFF" />
                  : <Text style={styles.submitButtonText}>{creatingAccount ? 'Criar conta' : 'Entrar'}</Text>}
              </Pressable>

              <Pressable
                onPress={() => { setCreatingAccount((value) => !value); setError(''); }}
                style={styles.accountSwitch}
                accessibilityRole="button"
              >
                <Text style={styles.accountSwitchText}>
                  {creatingAccount ? 'Já tem uma conta? Entrar' : 'Ainda não tem conta? Criar conta'}
                </Text>
              </Pressable>

              <Text style={styles.demoNote}>Conta local para este protótipo. A senha é validada pelo backend e salva somente como hash.</Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
