import { useState } from 'react';
import { ActivityIndicator, Alert, Image, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../hooks/useAuth';
import { useAppTheme, useThemedStyles } from '../hooks/useAppTheme';
import { copyProfileImageToAppStorage } from '../services/profileImage';
import { createStyles } from '../styles/profile';

function createBadges({ booksAddedByUser, sessions }) {
  const pagesRead = sessions.reduce((total, session) => total + session.pages, 0);
  return [
    { id: 'first-reading', image: require('../../assets/achievement-primeiros-passos.svg'), title: 'Primeiros Passos', description: 'Faça sua primeira leitura.', progress: sessions.length, target: 1, unit: 'leitura' },
    { id: 'first-book', image: require('../../assets/achievement-montando-a-estante.svg'), title: 'Montando a estante', description: 'Adicione seu primeiro livro.', progress: booksAddedByUser, target: 1, unit: 'livro' },
    { id: 'twenty-books', image: require('../../assets/achievement-bibliotecario.svg'), title: 'Bibliotecário', description: 'Adicione 20 livros à sua estante.', progress: booksAddedByUser, target: 20, unit: 'livros' },
    { id: 'four-hundred-pages', image: require('../../assets/achievement-leitor-avido.svg'), title: 'Leitor Ávido', description: 'Leia 400 páginas.', progress: pagesRead, target: 400, unit: 'páginas' },
    { id: 'twenty-readings', image: require('../../assets/achievement-habito-em-construcao.svg'), title: 'Hábito em Construção', description: 'Registre 20 leituras.', progress: sessions.length, target: 20, unit: 'leituras' },
  ].map((badge) => ({ ...badge, unlocked: badge.progress >= badge.target }));
}

function ProfilePhoto({ uri, size = 'large', styles }) {
  return (
    <View style={[styles.photo, size === 'small' && styles.photoSmall]}>
      {uri
        ? <Image source={{ uri }} style={styles.photoImage} accessibilityLabel="Foto do perfil" />
        : <Text style={styles.photoPlaceholder}>＋</Text>}
    </View>
  );
}

export default function ProfileScreen({ booksAddedByUser, sessions }) {
  const { user, signOut, profilePhotoUri, profileName, profileBio, updateProfile } = useAuth();
  const { mode, setMode } = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const [isEditing, setIsEditing] = useState(false);
  const [showLockedBadges, setShowLockedBadges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [draftName, setDraftName] = useState('');
  const [draftBio, setDraftBio] = useState('');
  const [draftPhotoUri, setDraftPhotoUri] = useState(null);
  const [draftPhotoMimeType, setDraftPhotoMimeType] = useState(null);
  const badges = createBadges({ booksAddedByUser, sessions });
  const unlockedCount = badges.filter((badge) => badge.unlocked).length;

  function openEditor() {
    setDraftName(profileName);
    setDraftBio(profileBio);
    setDraftPhotoUri(profilePhotoUri);
    setDraftPhotoMimeType(null);
    setIsEditing(true);
  }

  async function choosePhoto() {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.85,
      });
      if (!result.canceled && result.assets?.[0]?.uri) {
        setDraftPhotoUri(result.assets[0].uri);
        setDraftPhotoMimeType(result.assets[0].mimeType || null);
      }
    } catch {
      Alert.alert('Não foi possível abrir suas fotos', 'Tente novamente em alguns instantes.');
    }
  }

  async function saveChanges() {
    if (isSaving) return;
    setIsSaving(true);
    try {
      let photoUri = draftPhotoUri;
      if (photoUri && photoUri !== profilePhotoUri) {
        photoUri = await copyProfileImageToAppStorage(photoUri, user.id, draftPhotoMimeType);
      }
      await updateProfile({ name: draftName, bio: draftBio, photoUri });
      setIsEditing(false);
    } catch (error) {
      Alert.alert('Não foi possível salvar o perfil', error.message || 'Tente novamente.');
    } finally {
      setIsSaving(false);
    }
  }

  function cancelEditing() {
    setIsEditing(false);
    setDraftPhotoUri(null);
    setDraftPhotoMimeType(null);
  }

  async function selectTheme(nextMode) {
    try {
      await setMode(nextMode);
    } catch {
      Alert.alert('Não foi possível salvar o tema', 'Tente novamente em alguns instantes.');
    }
  }

  return (
    <>
      <Text style={styles.eyebrow}>SEU ESPAÇO PESSOAL</Text>
      <Text style={styles.title}>{isEditing ? 'Editar perfil' : 'Perfil'}</Text>
      <Text style={styles.subtitle}>{isEditing ? 'Atualize as informações que aparecem no seu perfil.' : 'Sua jornada de leitura, no seu ritmo.'}</Text>

      {isEditing ? (
        <>
          <View style={styles.card}>
            <View style={styles.photoSection}>
              <ProfilePhoto uri={draftPhotoUri} styles={styles} />
              <Pressable onPress={choosePhoto} style={styles.photoButton} accessibilityRole="button">
                <Text style={styles.photoButtonText}>{draftPhotoUri ? 'Alterar foto' : 'Adicionar foto'}</Text>
              </Pressable>
              {draftPhotoUri && (
                <Pressable onPress={() => { setDraftPhotoUri(null); setDraftPhotoMimeType(null); }} style={styles.removePhotoButton} accessibilityRole="button">
                  <Text style={styles.removePhotoText}>Remover foto</Text>
                </Pressable>
              )}
            </View>

            <Text style={styles.sectionTitle}>Nome</Text>
            <TextInput
              value={draftName}
              onChangeText={setDraftName}
              style={styles.profileInput}
              placeholder="Como devemos chamar você?"
              placeholderTextColor="#AAA2B5"
              maxLength={40}
              autoCapitalize="words"
              accessibilityLabel="Nome do perfil"
            />
            <Text style={styles.characterCount}>{draftName.length}/40</Text>

            <Text style={styles.sectionTitle}>Biografia</Text>
            <TextInput
              value={draftBio}
              onChangeText={setDraftBio}
              style={styles.bioInput}
              placeholder="Ex.: Um capítulo por dia 📚"
              placeholderTextColor="#AAA2B5"
              maxLength={35}
              multiline
              accessibilityLabel="Biografia, até 35 caracteres"
            />
            <Text style={styles.characterCount}>{draftBio.length}/35</Text>
          </View>

          <Pressable onPress={saveChanges} disabled={isSaving} style={[styles.saveButton, isSaving && styles.buttonDisabled]} accessibilityRole="button">
            {isSaving ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.saveButtonText}>Salvar alterações</Text>}
          </Pressable>
          <Pressable onPress={cancelEditing} disabled={isSaving} style={styles.cancelButton} accessibilityRole="button">
            <Text style={styles.cancelButtonText}>Cancelar</Text>
          </Pressable>
          <View style={styles.accountFooter}>
            <Text style={styles.accountEmailLabel}>E-mail da conta · bloqueado durante os testes</Text>
            <Text style={styles.accountEmail}>{user?.email}</Text>
          </View>
        </>
      ) : (
        <>
          <View style={styles.showcase}>
            <ProfilePhoto uri={profilePhotoUri} styles={styles} />
            <Text style={styles.showcaseUsername}>@{user?.username || 'leitor'}</Text>
            <Text style={styles.showcaseName}>{profileName.trim() || 'Leitor(a)'}</Text>
            <Text style={styles.showcaseBio}>{profileBio.trim() || 'Um capítulo de cada vez.'}</Text>
            <Pressable onPress={openEditor} style={styles.editButton} accessibilityRole="button">
              <Text style={styles.editButtonText}>Editar perfil</Text>
            </Pressable>
          </View>

          <View style={styles.achievementPanel}>
            <View style={styles.achievementHeader}>
              <View style={styles.achievementTitleGroup}>
                <Text style={styles.sectionTitle}>Conquistas</Text>
                <Text style={styles.helper}>Suas medalhas de leitura.</Text>
              </View>
              <View style={styles.badgeCountPill}>
                <Text style={styles.badgeCountText}>{unlockedCount}/{badges.length}</Text>
              </View>
            </View>
            {unlockedCount > 0 ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.earnedBadges}>
                {badges.filter((badge) => badge.unlocked).map((badge) => (
                  <View key={badge.id} style={styles.earnedBadge}>
                    <ExpoImage source={badge.image} style={styles.earnedBadgeImage} contentFit="contain" accessibilityLabel={`Conquista ${badge.title}`} />
                    <Text style={styles.earnedBadgeTitle} numberOfLines={2}>{badge.title}</Text>
                  </View>
                ))}
              </ScrollView>
            ) : (
              <Text style={styles.noBadgesText}>Sua primeira medalha está esperando por você.</Text>
            )}
            <Pressable
              onPress={() => setShowLockedBadges((visible) => !visible)}
              style={styles.badgesToggle}
              accessibilityRole="button"
              accessibilityState={{ expanded: showLockedBadges }}
            >
              <Text style={styles.badgesToggleText}>{showLockedBadges ? 'Ocultar próximas conquistas' : 'Ver próximas conquistas'}</Text>
              <Text style={styles.badgesToggleArrow}>{showLockedBadges ? '⌃' : '⌄'}</Text>
            </Pressable>
            {showLockedBadges && (
              <View style={styles.lockedBadgesList}>
                {badges.filter((badge) => !badge.unlocked).map((badge) => (
                  <View key={badge.id} style={styles.lockedBadgeRow}>
                    <ExpoImage source={badge.image} style={styles.lockedBadgeImage} contentFit="contain" accessibilityLabel={`Conquista bloqueada: ${badge.title}`} />
                    <View style={styles.badgeInfo}>
                      <Text style={styles.badgeTitle}>{badge.title}</Text>
                      <Text style={styles.badgeDescription}>{badge.description}</Text>
                      <Text style={styles.badgeProgress}>{Math.min(badge.progress, badge.target)}/{badge.target} {badge.unit}</Text>
                    </View>
                  </View>
                ))}
                {unlockedCount === badges.length && <Text style={styles.allBadgesText}>Você conquistou todas as medalhas. Parabéns! ✨</Text>}
              </View>
            )}
          </View>

          <View style={styles.themePanel}>
            <View>
              <Text style={styles.sectionTitle}>Aparência</Text>
              <Text style={styles.helper}>O modo Ler permanece escuro.</Text>
            </View>
            <View style={styles.themeChoices}>
              {[
                { id: 'light', label: 'Claro' },
                { id: 'dark', label: 'Escuro' },
              ].map((option) => (
                <Pressable
                  key={option.id}
                  onPress={() => selectTheme(option.id)}
                  style={[styles.themeChoice, mode === option.id && styles.themeChoiceSelected]}
                  accessibilityRole="button"
                  accessibilityState={{ selected: mode === option.id }}
                >
                  <Text style={[styles.themeChoiceText, mode === option.id && styles.themeChoiceTextSelected]}>{option.label}</Text>
                </Pressable>
              ))}
            </View>
          </View>

        </>
      )}
      {!isEditing && (
        <View style={styles.signOutSection}>
          <Pressable onPress={signOut} style={styles.signOutButton} accessibilityRole="button">
            <Text style={styles.signOutText}>Sair da conta</Text>
          </Pressable>
        </View>
      )}
    </>
  );
}
