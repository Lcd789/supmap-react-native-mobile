import React, { useState, useEffect, useCallback, useRef } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  StyleSheet,
  Dimensions,
  TextInput,
  AppState
} from 'react-native';
import { Image } from 'expo-image';
import {
  Save,
  Camera,
  ChevronRight,
  MapPin,
  Clock,
  Star,
  Bell,
  AlertTriangle as AlertIcon,
  Home as HomeIcon,
  Briefcase as BriefcaseIcon,
  Map as MapIcon,
  Edit2 as EditIcon,
  LogOut as LogOutIcon,
  Trash2 as TrashIcon
} from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { useRouter, useFocusEffect } from 'expo-router';

import {
  getUserDataApi,
  updateUserApi,
  updateProfileImageApi,
  deleteProfileApi
} from '@/hooks/user/userHooks';
import { useAuth } from '@/hooks/user/AuthContext';
import { Colors } from '@/styles/styles';
import { ApiError, UserData } from '@/utils/apiUtils';

const DefaultProfileImage = require('@/assets/images/default-profile.png');
const screenWidth = Dimensions.get('window').width;

// Fonction pour traduire les modes de transport en français
const translateTransportMode = (mode: string | undefined | null): string => {
  if (!mode) return '–';

  const translations: Record<string, string> = {
    'CAR': 'Voiture',
    'WALKING': 'À pied',
    'BICYCLE': 'Vélo',
    'PUBLIC_TRANSPORT': 'Transport public',
    'MOTORCYCLE': 'Moto',
    'TRUCK': 'Camion',
  };

  return translations[mode] || mode;
};

export default function Profile() {
  const router = useRouter();
  const { isAuthenticated, logout: contextLogout } = useAuth();
  const appState = useRef(AppState.currentState);
  const lastFetchTime = useRef(0);
  const isMounted = useRef(true);
  const initialLoadComplete = useRef(false);

  const [userData, setUserData] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isBackgroundLoading, setIsBackgroundLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedImageUri, setSelectedImageUri] = useState<string | null>(null);

  // États pour les champs modifiables
  const [editMode, setEditMode] = useState(false);
  const [editedUsername, setEditedUsername] = useState('');
  const [editedEmail, setEditedEmail] = useState('');
  const [usernameError, setUsernameError] = useState('');
  const [emailError, setEmailError] = useState('');

  const [activeTab, setActiveTab] = useState<'info' | 'activities'>('info');
  const subTabs = ['Preferences', 'Favorites', 'Statistics', 'Notifications'];
  const [activeSubTab, setActiveSubTab] = useState(subTabs[0]);

  // Définir une référence au composant monté/démonté
  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  // ─── Fetch user data ─────────────────────────────────────────
  const fetchUserData = useCallback(async (showLoading = true) => {
    // Limiter les appels API - ne pas recharger si moins de 10 secondes se sont écoulées
    const now = Date.now();
    const THROTTLE_TIME = 10000; // 10 secondes

    if (now - lastFetchTime.current < THROTTLE_TIME && initialLoadComplete.current) {
      console.log('Ignoring fetch request - throttled');
      return;
    }

    if (!isMounted.current) return;

    if (showLoading) {
      setIsLoading(true);
    } else if (!initialLoadComplete.current) {
      setIsLoading(true);
    } else {
      setIsBackgroundLoading(true);
    }

    setError(null);

    try {
      lastFetchTime.current = now;
      const data = await getUserDataApi();

      if (!isMounted.current) return;

      // Mise à jour des données
      setUserData(prevData => {
        if (!prevData) return data;

        // Créer une nouvelle référence d'objet uniquement si les données ont changé
        const hasChanged = JSON.stringify(prevData) !== JSON.stringify(data);

        if (hasChanged) {
          return {
            ...prevData,
            ...data,
            navigationPreferences: {
              ...prevData.navigationPreferences,
              ...data.navigationPreferences
            },
            notificationSettings: {
              ...prevData.notificationSettings,
              ...data.notificationSettings
            },
            stats: {
              ...prevData.stats,
              ...data.stats
            },
            favoriteLocations: data.favoriteLocations || prevData.favoriteLocations
          };
        }

        return prevData;
      });

      // Mise à jour des champs d'édition seulement si nécessaire
      if (!editMode) {
        setEditedUsername(data?.username || '');
        setEditedEmail(data?.email || '');
      }

      initialLoadComplete.current = true;
    } catch (err) {
      if (!isMounted.current) return;

      const msg = err instanceof Error ? err.message : 'Erreur chargement.';
      setError(msg);
      if ((err as ApiError).status === 401 || (err as ApiError).status === 403) {
        await contextLogout();
        router.replace('/login');
      }
    } finally {
      if (!isMounted.current) return;

      if (showLoading) {
        setIsLoading(false);
      } else {
        setIsBackgroundLoading(false);
      }
    }
  }, [contextLogout, router, editMode]);

  // Chargement initial des données
  useEffect(() => {
    if (isAuthenticated && !initialLoadComplete.current) {
      fetchUserData(true);
    } else if (!isAuthenticated) {
      setIsLoading(false);
    }
  }, [isAuthenticated, fetchUserData]);

  // Rafraîchir les données quand l'utilisateur revient sur l'écran
  useFocusEffect(
      useCallback(() => {
        let isMountedInEffect = true;

        // Si l'utilisateur est authentifié et que les données initiales ont été chargées
        if (isAuthenticated && initialLoadComplete.current && isMountedInEffect) {
          // Rafraîchir silencieusement
          fetchUserData(false);
        }

        return () => {
          isMountedInEffect = false;
        };
      }, [isAuthenticated, fetchUserData])
  );

  // ─── Pick & upload profile image ─────────────────────────────
  const pickImageAsync = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      return Alert.alert('Permission refusée', 'Accès galerie nécessaire.');
    }
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!res.canceled && res.assets.length) {
      const uri = res.assets[0].uri;
      setSelectedImageUri(uri);
      await handleProfileImageUpload(uri);
    }
  };

  const handleProfileImageUpload = async (uri: string) => {
    setIsSaving(true);
    setError(null);
    try {
      const name = uri.split('/').pop() || `profile-${Date.now()}.jpg`;
      const ext = name.split('.').pop() || 'jpg';
      const payload = { uri, name, type: `image/${ext}` };
      const resp = await updateProfileImageApi(payload);
      if (resp.imageUrl && userData) {
        setUserData({ ...userData, profileImage: resp.imageUrl });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur upload.');
    } finally {
      setIsSaving(false);
      fetchUserData(false); // Rafraîchir en arrière-plan après l'upload
    }
  };

  // ─── Validation de l'email ─────────────────────────────────
  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // ─── Toggle mode d'édition ────────────────────────────────
  const toggleEditMode = () => {
    if (editMode) {
      // Si on quitte le mode édition, on réinitialise les valeurs
      setEditedUsername(userData?.username || '');
      setEditedEmail(userData?.email || '');
      setUsernameError('');
      setEmailError('');
    }
    setEditMode(!editMode);
  };

  // ─── Save changes (Personal Info) ────────────────────────────
  const handleSaveChanges = async () => {
    if (!userData) return;

    // Validation
    let isValid = true;

    if (!editedUsername.trim()) {
      setUsernameError('Le nom d\'utilisateur est obligatoire');
      isValid = false;
    } else {
      setUsernameError('');
    }

    if (!editedEmail.trim()) {
      setEmailError('L\'email est obligatoire');
      isValid = false;
    } else if (!validateEmail(editedEmail)) {
      setEmailError('L\'email n\'est pas valide');
      isValid = false;
    } else {
      setEmailError('');
    }

    if (!isValid) return;

    setIsSaving(true);
    setError(null);
    try {
      // Créer un objet avec uniquement les champs modifiés
      const updatedData: any = {};

      if (editedUsername !== userData.username) {
        updatedData.username = editedUsername;
      }

      if (editedEmail !== userData.email) {
        updatedData.email = editedEmail;
      }

      // Si aucune modification, simplement quitter le mode édition
      if (Object.keys(updatedData).length === 0) {
        setEditMode(false);
        return;
      }

      // Sinon, envoyer uniquement les champs modifiés
      console.log('Saving changes:', updatedData);
      const updated = await updateUserApi(updatedData);
      setUserData(prevData => {
        if (!prevData) return updated;
        return { ...prevData, ...updated };
      });
      setEditMode(false);
      Alert.alert('Profil mis à jour !');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur update.');
    } finally {
      setIsSaving(false);
    }
  };

  // ─── Handle logout ────────────────────────────────────────────
  const handleLogout = async () => {
    Alert.alert(
        "Déconnexion",
        "Êtes-vous sûr de vouloir vous déconnecter ?",
        [
          { text: "Annuler", style: "cancel" },
          {
            text: "Déconnexion",
            style: "destructive",
            onPress: async () => {
              try {
                await contextLogout();
                router.replace('/login');
              } catch (error) {
                setError("Erreur lors de la déconnexion.");
              }
            }
          }
        ]
    );
  };

  // ─── Handle delete account ───────────────────────────────────
  const handleDeleteAccount = async () => {
    Alert.alert(
        "Supprimer le compte",
        "Êtes-vous sûr de vouloir supprimer définitivement votre compte ? Cette action est irréversible.",
        [
          { text: "Annuler", style: "cancel" },
          {
            text: "Supprimer",
            style: "destructive",
            onPress: async () => {
              try {
                setIsDeleting(true);
                await deleteProfileApi();
                await contextLogout();
                Alert.alert(
                    "Compte supprimé",
                    "Votre compte a été supprimé avec succès.",
                    [
                      {
                        text: "OK",
                        onPress: () => router.replace('/login')
                      }
                    ]
                );
              } catch (error) {
                setError("Erreur lors de la suppression du compte.");
                setIsDeleting(false);
              }
            }
          }
        ]
    );
  };

  // ─── Loading Spinner ─────────────────────────────────────────
  if (isLoading) {
    return (
        <SafeAreaView style={[styles.container, styles.center]} edges={['top', 'bottom']}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </SafeAreaView>
    );
  }

  // ─── Determine profile image source ─────────────────────────
  const imageSource = selectedImageUri
      ? { uri: selectedImageUri }
      : userData?.profileImage
          ? { uri: userData.profileImage }
          : DefaultProfileImage;

  const getIconForSubTab = (tab: string) => {
    switch (tab) {
      case 'Preferences':
        return <MapPin size={18} color={activeSubTab === tab ? Colors.primary : "#999"} />;
      case 'Favorites':
        return <Star size={18} color={activeSubTab === tab ? Colors.primary : "#999"} />;
      case 'Statistics':
        return <Clock size={18} color={activeSubTab === tab ? Colors.primary : "#999"} />;
      case 'Notifications':
        return <Bell size={18} color={activeSubTab === tab ? Colors.primary : "#999"} />;
      default:
        return null;
    }
  };

  // Traduire les modes de transport
  const translatedTransportMode = translateTransportMode(userData?.navigationPreferences?.preferredTransportMode);

  return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          {error && (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
          )}

          {/* Indicateur de chargement en arrière-plan */}
          {isBackgroundLoading && (
              <View style={styles.backgroundLoadingIndicator}>
                <ActivityIndicator size="small" color={Colors.primary} />
              </View>
          )}

          {/* HEADER */}
          <View style={styles.header}>
            <View style={styles.profileSection}>
              <TouchableOpacity style={styles.avatarContainer} onPress={pickImageAsync}>
                <Image source={imageSource} style={styles.avatar} />
                <View style={styles.cameraIconContainer}>
                  <Camera size={16} color="#fff" />
                </View>
              </TouchableOpacity>
              <View style={styles.profileInfo}>
                <Text style={styles.userName}>{userData?.username ?? '–'}</Text>
                <Text style={styles.userEmail}>{userData?.email ?? '–'}</Text>
              </View>
            </View>
          </View>

          {/* MAIN TABS */}
          <View style={styles.tabsContainer}>
            <TouchableOpacity
                style={[
                  styles.tabButton,
                  activeTab === 'info' && styles.tabButtonActive,
                ]}
                onPress={() => setActiveTab('info')}
            >
              <Text
                  style={[
                    styles.tabText,
                    activeTab === 'info' && styles.tabTextActive,
                  ]}
              >
                Informations
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
                style={[
                  styles.tabButton,
                  activeTab === 'activities' && styles.tabButtonActive,
                ]}
                onPress={() => setActiveTab('activities')}
            >
              <Text
                  style={[
                    styles.tabText,
                    activeTab === 'activities' && styles.tabTextActive,
                  ]}
              >
                Activités
              </Text>
            </TouchableOpacity>
          </View>

          {/* CONTENT: Personal Info */}
          {activeTab === 'info' && (
              <View style={styles.contentContainer}>
                <View style={styles.infoCard}>
                  <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Compte</Text>
                    <TouchableOpacity
                        style={styles.editButton}
                        onPress={toggleEditMode}
                    >
                      <EditIcon size={16} color={Colors.primary} />
                      <Text style={styles.editButtonText}>
                        {editMode ? 'Annuler' : 'Modifier'}
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {/* Nom d'utilisateur */}
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Nom d'utilisateur</Text>
                    {editMode ? (
                        <View style={styles.inputContainer}>
                          <TextInput
                              style={styles.input}
                              value={editedUsername}
                              onChangeText={setEditedUsername}
                              placeholder="Nom d'utilisateur"
                              autoCapitalize="none"
                          />
                          {usernameError ? (
                              <Text style={styles.inputError}>{usernameError}</Text>
                          ) : null}
                        </View>
                    ) : (
                        <Text style={styles.infoValue}>{userData?.username ?? '–'}</Text>
                    )}
                  </View>

                  <View style={styles.divider} />

                  {/* Email */}
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Email</Text>
                    {editMode ? (
                        <View style={styles.inputContainer}>
                          <TextInput
                              style={styles.input}
                              value={editedEmail}
                              onChangeText={setEditedEmail}
                              placeholder="Adresse email"
                              keyboardType="email-address"
                              autoCapitalize="none"
                          />
                          {emailError ? (
                              <Text style={styles.inputError}>{emailError}</Text>
                          ) : null}
                        </View>
                    ) : (
                        <Text style={styles.infoValue}>{userData?.email ?? '–'}</Text>
                    )}
                  </View>
                </View>
                {editMode && (
                    <TouchableOpacity
                        style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
                        onPress={handleSaveChanges}
                        disabled={isSaving}
                    >
                      {isSaving ? (
                          <ActivityIndicator color="#fff" size="small" />
                      ) : (
                          <>
                            <Save size={18} color="#fff" />
                            <Text style={styles.saveButtonText}>Enregistrer</Text>
                          </>
                      )}
                    </TouchableOpacity>
                )}

                <View style={styles.infoCard}>
                  <Text style={styles.sectionTitle}>Navigation</Text>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Mode de transport</Text>
                    <View style={styles.transportBadge}>
                      <Text style={styles.transportBadgeText}>
                        {translatedTransportMode}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.divider} />
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Éviter péages</Text>
                    <Text style={[
                      styles.booleanValue,
                      userData?.navigationPreferences?.avoidTolls ? styles.booleanTrue : styles.booleanFalse
                    ]}>
                      {userData?.navigationPreferences?.avoidTolls ? 'Oui' : 'Non'}
                    </Text>
                  </View>
                  <View style={styles.divider} />
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Éviter autoroutes</Text>
                    <Text style={[
                      styles.booleanValue,
                      userData?.navigationPreferences?.avoidHighways ? styles.booleanTrue : styles.booleanFalse
                    ]}>
                      {userData?.navigationPreferences?.avoidHighways ? 'Oui' : 'Non'}
                    </Text>
                  </View>
                  <View style={styles.divider} />
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Distance alerte</Text>
                    <Text style={styles.infoValue}>{userData?.navigationPreferences?.proximityAlertDistance ?? '–'} m</Text>
                  </View>
                </View>

                {/* Boutons déconnexion et suppression de compte */}
                <View style={styles.actionButtonsContainer}>
                  <TouchableOpacity
                      style={styles.logoutButton}
                      onPress={handleLogout}
                  >
                    <LogOutIcon size={18} color="#fff" />
                    <Text style={styles.actionButtonText}>Déconnexion</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                      style={styles.deleteAccountButton}
                      onPress={handleDeleteAccount}
                      disabled={isDeleting}
                  >
                    {isDeleting ? (
                        <ActivityIndicator color="#fff" size="small" />
                    ) : (
                        <>
                          <TrashIcon size={18} color="#fff" />
                          <Text style={styles.actionButtonText}>Supprimer mon compte</Text>
                        </>
                    )}
                  </TouchableOpacity>
                </View>


              </View>
          )}

          {/* CONTENT: Activities */}
          {activeTab === 'activities' && (
              <View style={styles.contentContainer}>
                {/* Sous-tabs */}
                <View style={styles.subTabsContainer}>
                  {subTabs.map((t) => (
                      <TouchableOpacity
                          key={t}
                          style={[
                            styles.subTabButton,
                            activeSubTab === t && styles.subTabButtonActive,
                          ]}
                          onPress={() => setActiveSubTab(t)}
                      >
                        {getIconForSubTab(t)}
                        <Text
                            style={[
                              styles.subTabText,
                              activeSubTab === t && styles.subTabTextActive,
                            ]}
                        >
                          {t}
                        </Text>
                      </TouchableOpacity>
                  ))}
                </View>

                {/* Contenu sous-tab */}
                {activeSubTab === 'Statistics' && (
                    <View style={styles.infoCard}>
                      <Text style={styles.sectionTitle}>Vos statistiques</Text>

                      <View style={styles.statItem}>
                        <View style={styles.statIconContainer}>
                          <MapPin size={18} color={Colors.primary} />
                        </View>
                        <View style={styles.statContent}>
                          <Text style={styles.statLabel}>Routes complétées</Text>
                          <Text style={styles.statValue}>{userData?.stats?.totalRoutesCompleted ?? '0'}</Text>
                        </View>
                      </View>

                      <View style={styles.divider} />

                      <View style={styles.statItem}>
                        <View style={styles.statIconContainer}>
                          <MapIcon size={18} color={Colors.primary} />
                        </View>
                        <View style={styles.statContent}>
                          <Text style={styles.statLabel}>Distance totale</Text>
                          <Text style={styles.statValue}>{userData?.stats?.totalDistanceTraveled ?? '0'} km</Text>
                        </View>
                      </View>

                      <View style={styles.divider} />

                      <View style={styles.statItem}>
                        <View style={styles.statIconContainer}>
                          <Clock size={18} color={Colors.primary} />
                        </View>
                        <View style={styles.statContent}>
                          <Text style={styles.statLabel}>Temps économisé</Text>
                          <Text style={styles.statValue}>{userData?.stats?.totalTimeSaved ?? '0'} min</Text>
                        </View>
                      </View>

                      <View style={styles.divider} />

                      <View style={styles.statItem}>
                        <View style={styles.statIconContainer}>
                          <AlertIcon size={18} color={Colors.primary} />
                        </View>
                        <View style={styles.statContent}>
                          <Text style={styles.statLabel}>Signalements envoyés</Text>
                          <Text style={styles.statValue}>{userData?.stats?.totalReportsSubmitted ?? '0'}</Text>
                        </View>
                      </View>
                    </View>
                )}

                {activeSubTab === 'Favorites' && (
                    <View style={styles.infoCard}>
                      <Text style={styles.sectionTitle}>Lieux favoris</Text>

                      {(!userData?.favoriteLocations || userData.favoriteLocations.length === 0) ? (
                          <View style={styles.emptyState}>
                            <Star size={32} color="#ccc" />
                            <Text style={styles.emptyStateText}>Aucun lieu favori enregistré</Text>
                          </View>
                      ) : (
                          userData.favoriteLocations.map((loc, i) => (
                              <React.Fragment key={i}>
                                {i > 0 && <View style={styles.divider} />}
                                <View style={styles.favoriteItem}>
                                  <View style={styles.favoriteIconContainer}>
                                    {loc.locationType === 'HOME' ? (
                                        <HomeIcon size={18} color={Colors.primary} />
                                    ) : loc.locationType === 'WORK' ? (
                                        <BriefcaseIcon size={18} color={Colors.primary} />
                                    ) : (
                                        <Star size={18} color={Colors.primary} />
                                    )}
                                  </View>
                                  <View style={styles.favoriteContent}>
                                    <Text style={styles.favoriteName}>{loc.name}</Text>
                                    <Text style={styles.favoriteAddress} numberOfLines={1}>{loc.formattedAddress}</Text>
                                  </View>
                                  <ChevronRight size={18} color="#ccc" />
                                </View>
                              </React.Fragment>
                          ))
                      )}
                    </View>
                )}

                {activeSubTab === 'Notifications' && (
                    <View style={styles.infoCard}>
                      <Text style={styles.sectionTitle}>Notifications</Text>

                      <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Notifications par email</Text>
                        <Text style={[
                          styles.booleanValue,
                          userData?.notificationSettings?.emailEnabled ? styles.booleanTrue : styles.booleanFalse
                        ]}>
                          {userData?.notificationSettings?.emailEnabled ? 'Activé' : 'Désactivé'}
                        </Text>
                      </View>

                      {userData?.notificationSettings && 'pushEnabled' in userData.notificationSettings && (
                          <>
                            <View style={styles.divider} />
                            <View style={styles.infoRow}>
                              <Text style={styles.infoLabel}>Notifications push</Text>
                              <Text style={[
                                styles.booleanValue,
                                (userData.notificationSettings as any).pushEnabled ? styles.booleanTrue : styles.booleanFalse
                              ]}>
                                {(userData.notificationSettings as any).pushEnabled ? 'Activé' : 'Désactivé'}
                              </Text>
                            </View>
                          </>
                      )}
                    </View>
                )}

                {activeSubTab === 'Preferences' && (
                    <View style={styles.infoCard}>
                      <Text style={styles.sectionTitle}>Préférences</Text>

                      <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Mode de navigation</Text>
                        <View style={styles.transportBadge}>
                          <Text style={styles.transportBadgeText}>
                            {translatedTransportMode}
                          </Text>
                        </View>
                      </View>

                      <View style={styles.divider} />

                      <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Éviter autoroutes</Text>
                        <Text style={[
                          styles.booleanValue,
                          userData?.navigationPreferences?.avoidHighways ? styles.booleanTrue : styles.booleanFalse
                        ]}>
                          {userData?.navigationPreferences?.avoidHighways ? 'Oui' : 'Non'}
                        </Text>
                      </View>

                      <View style={styles.divider} />

                      <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Éviter péages</Text>
                        <Text style={[
                          styles.booleanValue,
                          userData?.navigationPreferences?.avoidTolls ? styles.booleanTrue : styles.booleanFalse
                        ]}>
                          {userData?.navigationPreferences?.avoidTolls ? 'Oui' : 'Non'}
                        </Text>
                      </View>
                    </View>
                )}
              </View>
          )}
        </ScrollView>
      </SafeAreaView>
  );
}

// ─── Style sheet ─────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f6f8fa'
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center'
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 24
  },
  backgroundLoadingIndicator: {
    position: 'absolute',
    top: 0,
    right: 0,
    padding: 8,
    zIndex: 1000
  },
  errorContainer: {
    margin: 16,
    padding: 12,
    backgroundColor: '#ffe5e5',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#ff3b30'
  },
  errorText: {
    color: '#cc0000',
    fontSize: 14
  },
  header: {
    backgroundColor: Colors.primary,
    paddingTop: 20,
    paddingBottom: 32,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: "#000",
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20
  },
  avatarContainer: {
    position: 'relative',
    borderRadius: 40,
    overflow: 'visible',
    marginRight: 16
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: '#fff'
  },
  cameraIconContainer: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: Colors.primary,
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff'
  },
  profileInfo: {
    flex: 1
  },
  userName: {
    fontSize: 22,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4
  },
  userEmail: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)'
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    marginHorizontal: 16,
    marginTop: -16,
    shadowColor: "#000",
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2
  },
  tabButton: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center'
  },
  tabButtonActive: {
    borderBottomWidth: 2,
    borderBottomColor: Colors.primary
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#777'
  },
  tabTextActive: {
    color: Colors.primary,
    fontWeight: '700'
  },
  contentContainer: {
    padding: 16
  },
  infoCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
    marginBottom: 16
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    backgroundColor: 'rgba(33, 150, 243, 0.1)',
  },
  editButtonText: {
    color: Colors.primary,
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10
  },
  infoLabel: {
    fontSize: 15,
    color: '#555'
  },
  infoValue: {
    fontSize: 15,
    fontWeight: '500',
    color: '#333'
  },
  inputContainer: {
    flex: 1,
    marginLeft: 12,
    maxWidth: '60%'
  },
  input: {
    backgroundColor: '#f5f5f5',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#e0e0e0'
  },
  inputError: {
    color: '#e74c3c',
    fontSize: 12,
    marginTop: 4
  },
  transportBadge: {
    backgroundColor: '#e6f7ff',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 6
  },
  transportBadgeText: {
    color: '#0080ff',
    fontWeight: '600',
    fontSize: 13
  },
  booleanValue: {
    fontSize: 14,
    fontWeight: '600',
    paddingVertical: 2,
    paddingHorizontal: 10,
    borderRadius: 4
  },
  booleanTrue: {
    backgroundColor: '#e6f7ee',
    color: '#00b248'
  },
  booleanFalse: {
    backgroundColor: '#fff0f0',
    color: '#ff3b30'
  },
  divider: {
    height: 1,
    backgroundColor: '#f0f0f0'
  },
  saveButton: {
    backgroundColor: Colors.primary,
    borderRadius: 10,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8
  },
  saveButtonDisabled: {
    opacity: 0.7
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
    marginLeft: 8
  },
  // Nouveaux styles pour les boutons d'action
  actionButtonsContainer: {
    marginBottom: 16,
    flexDirection: 'column',
    gap: 12
  },
  logoutButton: {
    backgroundColor: '#3498db',
    borderRadius: 10,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteAccountButton: {
    backgroundColor: '#e74c3c',
    borderRadius: 10,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
    marginLeft: 8
  },
  subTabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 16,
    paddingVertical: 4,
    shadowColor: "#000",
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1
  },
  subTabButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center'
  },
  subTabButtonActive: {
    backgroundColor: 'rgba(33, 150, 243, 0.1)',
    borderRadius: 8
  },
  subTabText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#777',
    marginLeft: 5
  },
  subTabTextActive: {
    color: Colors.primary,
    fontWeight: '600'
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12
  },
  statIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(33, 150, 243, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12
  },
  statContent: {
    flex: 1
  },
  statLabel: {
    fontSize: 14,
    color: '#555'
  },
  statValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginTop: 2
  },
  favoriteItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12
  },
  favoriteIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(33, 150, 243, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12
  },
  favoriteContent: {
    flex: 1
  },
  favoriteName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333'
  },
  favoriteAddress: {
    fontSize: 13,
    color: '#777',
    marginTop: 2
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 30
  },
  emptyStateText: {
    marginTop: 12,
    color: '#999',
    fontSize: 14
  }
});