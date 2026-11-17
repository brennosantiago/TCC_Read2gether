import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { Link } from 'expo-router';
import { useAppTheme, useThemedStyles } from '../hooks/useAppTheme';
import { createStyles } from '../styles/auth';

export default function ForgotPasswordScreen() {
  const { colors } = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const [email, setEmail] = useState('');
  const [showExplanation, setShowExplanation] = useState(false);

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
            <Link href="/login" asChild>
              <Pressable style={styles.backLink} accessibilityRole="link">
                <Text style={styles.backLinkText}>‹  Voltar ao login</Text>
              </Pressable>
            </Link>
            <View style={styles.card}>
              <Text style={styles.eyebrow}>RECUPERAÇÃO DE ACESSO</Text>
              <Text style={styles.title}>Esqueceu sua senha?</Text>
              <Text style={styles.subtitle}>
                Informe o e-mail da sua conta para receber as instruções de redefinição.
              </Text>

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
                accessibilityLabel="E-mail para recuperação"
              />

              <Pressable
                onPress={() => setShowExplanation(true)}
                style={styles.submitButton}
                accessibilityRole="button"
              >
                <Text style={styles.submitButtonText}>Enviar instruções</Text>
              </Pressable>

              {showExplanation && (
                <View style={styles.infoBox}>
                  <Text style={styles.infoText}>
                Este backend local ainda não envia e-mails nem redefine senhas. A recuperação será possível depois que configurarmos um serviço de e-mail e um fluxo seguro de redefinição.
                  </Text>
                </View>
              )}
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
