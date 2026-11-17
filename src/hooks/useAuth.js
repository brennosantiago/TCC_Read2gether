import { createContext, useContext, useEffect, useState } from 'react';
import * as SecureStore from 'expo-secure-store';
import { apiRequest } from '../services/api';
import { loadLocalProfile, saveLocalProfile } from '../services/database';
import { copyProfileImageToAppStorage, isProfileImagePersistent } from '../services/profileImage';

const AuthContext = createContext(null);
const TOKEN_KEY = 'read2gether.auth.token';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [profilePhotoUri, setProfilePhotoUri] = useState(null);
  const [profileName, setProfileName] = useState('');
  const [profileBio, setProfileBio] = useState('');

  useEffect(() => {
    let isMounted = true;
    async function restoreSession() {
      try {
        const savedToken = await SecureStore.getItemAsync(TOKEN_KEY);
        if (!savedToken) return;
        const result = await apiRequest('/auth/me', { token: savedToken });
        if (isMounted) {
          setToken(savedToken);
          setUser(result.user);
        }
      } catch {
        await SecureStore.deleteItemAsync(TOKEN_KEY);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }
    restoreSession();
    return () => { isMounted = false; };
  }, []);

  useEffect(() => {
    let isMounted = true;
    if (!user?.id) return () => { isMounted = false; };
    loadLocalProfile(user.id).then(async (profile) => {
      if (!isMounted) return;
      let photoUri = profile?.photo_uri || null;
      if (photoUri && !isProfileImagePersistent(photoUri)) {
        try {
          photoUri = await copyProfileImageToAppStorage(photoUri, user.id);
          await saveLocalProfile(user.id, { name: profile?.name || '', bio: profile?.bio || '', photoUri });
        } catch (error) {
          console.warn('Não foi possível mover a foto antiga para o armazenamento persistente:', error);
        }
      }
      if (!isMounted) return;
      setProfilePhotoUri(photoUri);
      setProfileName(profile?.name || '');
      setProfileBio(profile?.bio || '');
    }).catch((error) => console.error('Não foi possível carregar o perfil local:', error));
    return () => { isMounted = false; };
  }, [user?.id]);

  async function authenticate(path, credentials) {
    const result = await apiRequest(path, { method: 'POST', body: credentials });
    await SecureStore.setItemAsync(TOKEN_KEY, result.token);
    setToken(result.token);
    setUser(result.user);
    return result.user;
  }

  function signIn(email, password) {
    return authenticate('/auth/login', { email, password });
  }

  function signUp(email, password, username) {
    return authenticate('/auth/register', { email, password, username });
  }

  async function updateProfile({ name, bio, photoUri }) {
    if (!user?.id) throw new Error('Entre na sua conta para editar o perfil.');
    const profile = {
      name: name.trim().slice(0, 40),
      bio: bio.trim().slice(0, 35),
      photoUri: photoUri || null,
    };
    await saveLocalProfile(user.id, profile);
    setProfileName(profile.name);
    setProfileBio(profile.bio);
    setProfilePhotoUri(profile.photoUri);
  }

  async function signOut() {
    const activeToken = token;
    setToken(null);
    setUser(null);
    setProfilePhotoUri(null);
    setProfileName('');
    setProfileBio('');
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    if (activeToken) {
      try { await apiRequest('/auth/logout', { method: 'POST', token: activeToken }); } catch { /* logout local remains complete */ }
    }
  }

  const value = {
    isAuthenticated: Boolean(user),
    isLoading,
    user,
    token,
    signIn,
    signUp,
    signOut,
    profilePhotoUri,
    profileName,
    profileBio,
    updateProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth precisa ser usado dentro de AuthProvider.');
  return context;
}
