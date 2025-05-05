import React, { useState, useEffect, useCallback } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Image } from 'expo-image';
import { Save } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';

import {
  getUserDataApi,
  updateUserApi,
  updateProfileImageApi,
} from '../../hooks/user/userHooks';
import { useAuth } from '../../hooks/user/AuthContext';
import { profileStyles, Colors } from '../../styles/styles';
import { ApiError, UserData } from '../../utils/apiUtils';

const DefaultProfileImage = require('../../assets/images/default-profile.png');

export default function Profile() {
  const router = useRouter();
  const { isAuthenticated, logout: contextLogout } = useAuth();

  const [userData, setUserData] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedImageUri, setSelectedImageUri] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<'info' | 'activities'>('info');
  const subTabs = ['Preferences', 'Favorites', 'Statistics', 'Notifications'];
  const [activeSubTab, setActiveSubTab] = useState(subTabs[0]);

  // ─── Fetch user data ─────────────────────────────────────────
  const fetchUserData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getUserDataApi();
      setUserData(data);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erreur chargement.';
      setError(msg);
      if ((err as ApiError).status === 401 || (err as ApiError).status === 403) {
        await contextLogout();
        router.replace('/login');
      }
    } finally {
      setIsLoading(false);
    }
  }, [contextLogout, router]);

  useEffect(() => {
    if (isAuthenticated) fetchUserData();
    else setIsLoading(false);
  }, [isAuthenticated, fetchUserData]);

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
      fetchUserData();
    }
  };

  // ─── Save changes (Personal Info) ────────────────────────────
  const handleSaveChanges = async () => {
    if (!userData) return;
    setIsSaving(true);
    setError(null);
    try {
      const updated = await updateUserApi({});
      setUserData(updated);
      Alert.alert('Profil mis à jour !');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur update.');
    } finally {
      setIsSaving(false);
    }
  };

  // ─── Loading Spinner ─────────────────────────────────────────
  if (isLoading) {
    return (
      <SafeAreaView style={[profileStyles.container, profileStyles.center]} edges={['top', 'bottom']}>
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

  return (
    <SafeAreaView style={profileStyles.container} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={profileStyles.scrollContent} keyboardShouldPersistTaps="handled">
        {error && <Text style={profileStyles.errorText}>{error}</Text>}

        {/* HEADER */}
        <View style={profileStyles.header}>
          <TouchableOpacity onPress={pickImageAsync}>
            <View style={profileStyles.avatarWrapper}>
              <Image source={imageSource} style={profileStyles.avatar} />
            </View>
          </TouchableOpacity>
          <Text style={profileStyles.userName}>{userData?.username ?? '–'}</Text>
          <Text style={profileStyles.userRole}>Mon Compte</Text>
        </View>

        {/* MAIN TABS (juste en-dessous, chevauchant le header) */}
        <View style={profileStyles.tabsWrapper}>
          <TouchableOpacity
            style={[
              profileStyles.tabButton,
              activeTab === 'info' && profileStyles.tabButtonActive,
            ]}
            onPress={() => setActiveTab('info')}
          >
            <Text
              style={[
                profileStyles.tabText,
                activeTab === 'info' && profileStyles.tabTextActive,
              ]}
            >
              Personal Info
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              profileStyles.tabButton,
              activeTab === 'activities' && profileStyles.tabButtonActive,
            ]}
            onPress={() => setActiveTab('activities')}
          >
            <Text
              style={[
                profileStyles.tabText,
                activeTab === 'activities' && profileStyles.tabTextActive,
              ]}
            >
              Activities
            </Text>
          </TouchableOpacity>
        </View>

        {/* CONTENT: Personal Info */}
        {activeTab === 'info' && (
          <View>
            {[
              { label: 'Username', value: userData?.username ?? '–' },
              { label: 'Email', value: userData?.email ?? '–' },
              {
                label: 'Mode de transport',
                value:
                  userData?.navigationPreferences
                    ?.preferredTransportMode ?? '–',
              },
              {
                label: 'Éviter péages',
                value: userData?.navigationPreferences?.avoidTolls
                  ? 'Oui'
                  : 'Non',
              },
              {
                label: 'Éviter autoroutes',
                value: userData?.navigationPreferences?.avoidHighways
                  ? 'Oui'
                  : 'Non',
              },
              {
                label: 'Distance alerte',
                value: `${
                  userData?.navigationPreferences
                    ?.proximityAlertDistance ?? '-'
                } m`,
              },
            ].map((it, i) => (
              <View key={i} style={profileStyles.itemCard}>
                <Text style={profileStyles.itemLabel}>{it.label}</Text>
                <Text style={profileStyles.itemValue}>{it.value}</Text>
              </View>
            ))}

            <View style={profileStyles.actionRow}>
              <TouchableOpacity
                style={[
                  profileStyles.actionButton,
                  profileStyles.saveButton,
                  isSaving && { opacity: 0.6 },
                ]}
                onPress={handleSaveChanges}
                disabled={isSaving}
              >
                <Save size={18} color="#fff" />
                <Text style={profileStyles.actionText}>Save Changes</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* CONTENT: Activities */}
        {activeTab === 'activities' && (
          <>
            {/* Sous-tabs scrollables */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={profileStyles.subTabContainer}
            >
              {subTabs.map((t) => (
                <TouchableOpacity
                  key={t}
                  style={[
                    profileStyles.subTabButton,
                    activeSubTab === t && profileStyles.subTabButtonActive,
                  ]}
                  onPress={() => setActiveSubTab(t)}
                >
                  <Text
                    style={[
                      profileStyles.subTabText,
                      activeSubTab === t && profileStyles.subTabTextActive,
                    ]}
                  >
                    {t}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Contenu selon sous-tab (Statistics / Favorites / …) */}
            {activeSubTab === 'Statistics' && (
              <View style={profileStyles.section}>
                <Text style={profileStyles.sectionTitle}>Your Stats</Text>
                {[
                  {
                    label: 'Routes complétées',
                    value:
                      userData?.stats?.totalRoutesCompleted ?? '–',
                  },
                  {
                    label: 'Distance totale (km)',
                    value:
                      userData?.stats?.totalDistanceTraveled ?? '–',
                  },
                  {
                    label: 'Temps économisé (min)',
                    value: userData?.stats?.totalTimeSaved ?? '–',
                  },
                  {
                    label: 'Signalements envoyés',
                    value:
                      userData?.stats?.totalReportsSubmitted ?? '–',
                  },
                ].map((it, i) => (
                  <View
                    key={i}
                    style={{
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      paddingVertical: 8,
                    }}
                  >
                    <Text>{it.label}</Text>
                    <Text>{it.value}</Text>
                  </View>
                ))}
              </View>
            )}
            
            {/* Sub‐tab content */}
            {activeSubTab === 'Statistics' && (
              <View style={profileStyles.section}>
                <Text style={profileStyles.sectionTitle}>
                  Your Stats
                </Text>
                {[
                  {
                    label: 'Routes complétées',
                    value:
                      userData?.stats
                        ?.totalRoutesCompleted ?? '–',
                  },
                  {
                    label: 'Distance totale (km)',
                    value:
                      userData?.stats
                        ?.totalDistanceTraveled ?? '–',
                  },
                  {
                    label: 'Temps économisé (min)',
                    value:
                      userData?.stats
                        ?.totalTimeSaved ?? '–',
                  },
                  {
                    label: 'Signalements envoyés',
                    value:
                      userData?.stats
                        ?.totalReportsSubmitted ?? '–',
                  },
                ].map((it, i) => (
                  <View
                    key={i}
                    style={{
                      flexDirection:  'row',
                      justifyContent: 'space-between',
                      paddingVertical: 8,
                    }}
                  >
                    <Text>{it.label}</Text>
                    <Text>{it.value}</Text>
                  </View>
                ))}
              </View>
            )}

            {activeSubTab === 'Favorites' && (
              <View style={profileStyles.section}>
                <Text style={profileStyles.sectionTitle}>
                  Favorite Locations
                </Text>
                {(userData?.favoriteLocations || []).map(
                  (loc, i) => (
                    <View
                      key={i}
                      style={profileStyles.itemCard}
                    >
                      <Text
                        style={profileStyles.itemLabel}
                      >
                        {loc.name}
                      </Text>
                      <Text
                        style={profileStyles.itemValue}
                      >
                        {loc.formattedAddress}
                      </Text>
                    </View>
                  )
                )}
              </View>
            )}

            {activeSubTab === 'Notifications' && (
              <View style={profileStyles.section}>
                <Text style={profileStyles.sectionTitle}>
                  Notification Settings
                </Text>
                <View
                  style={{
                    flexDirection:  'row',
                    justifyContent: 'space-between',
                    paddingVertical: 8,
                  }}
                >
                  <Text>Email Enabled</Text>
                  <Text>
                    {userData?.notificationSettings
                      ?.emailEnabled
                      ? 'Yes'
                      : 'No'}
                  </Text>
                </View>
              </View>
            )}

            {activeSubTab === 'Preferences' && (
              <View style={profileStyles.section}>
                <Text style={profileStyles.sectionTitle}>
                  Nav Preferences
                </Text>
                <View
                  style={{
                    flexDirection:  'row',
                    justifyContent: 'space-between',
                    paddingVertical: 8,
                  }}
                >
                  <Text>Avoid Highways</Text>
                  <Text>
                    {userData?.navigationPreferences
                      ?.avoidHighways
                      ? 'Yes'
                      : 'No'}
                  </Text>
                </View>
                <View
                  style={{
                    flexDirection:  'row',
                    justifyContent: 'space-between',
                    paddingVertical: 8,
                  }}
                >
                  <Text>Avoid Tolls</Text>
                  <Text>
                    {userData?.navigationPreferences
                      ?.avoidTolls
                      ? 'Yes'
                      : 'No'}
                  </Text>
                </View>
              </View>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
