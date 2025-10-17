import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Switch,
  Alert,
  ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ArrowLeft, Save, Bell } from 'lucide-react-native';
import { doc, setDoc, onSnapshot } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { PromoBanner } from '@/types/banner';

export default function AdminOffersScreen() {
  const [title, setTitle] = useState<string>('');
  const [message, setMessage] = useState<string>('');
  const [isLive, setIsLive] = useState<boolean>(false);
  const [imageUrl, setImageUrl] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  useEffect(() => {
    if (!db) {
      console.warn('Firebase not initialized');
      setIsLoading(false);
      return;
    }

    const bannerRef = doc(db, 'banners', 'current');
    
    const unsubscribe = onSnapshot(
      bannerRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data() as PromoBanner;
          setTitle(data.title || '');
          setMessage(data.message || '');
          setIsLive(data.isLive || false);
          setImageUrl(data.imageUrl || '');
        }
        setIsLoading(false);
      },
      (error) => {
        console.error('Error loading banner:', error);
        setIsLoading(false);
        Alert.alert('Error', 'No se pudo cargar el banner promocional');
      }
    );

    return () => unsubscribe();
  }, []);

  const handleSave = async () => {
    if (!db) {
      Alert.alert('Error', 'Firebase no está disponible');
      return;
    }

    if (!title.trim()) {
      Alert.alert('Error', 'El título es requerido');
      return;
    }

    if (!message.trim()) {
      Alert.alert('Error', 'El mensaje es requerido');
      return;
    }

    setIsSaving(true);

    try {
      const bannerRef = doc(db, 'banners', 'current');
      const bannerData: PromoBanner = {
        title: title.trim(),
        message: message.trim(),
        isLive,
        imageUrl: imageUrl.trim() || undefined,
        updatedAt: new Date()
      };

      await setDoc(bannerRef, bannerData, { merge: true });

      Alert.alert(
        'Éxito',
        isLive 
          ? '¡Banner publicado! Los usuarios verán esta promoción.'
          : 'Banner guardado. Actívalo cuando estés listo para publicarlo.',
        [{ text: 'OK' }]
      );

      console.log('Banner saved successfully:', bannerData);
    } catch (error) {
      console.error('Error saving banner:', error);
      Alert.alert('Error', 'No se pudo guardar el banner. Intenta nuevamente.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestNotification = () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Agrega un título primero para probar la notificación');
      return;
    }

    Alert.alert(
      'Notificación de Prueba',
      `Los usuarios recibirán: "¡Nueva oferta: ${title}!"`,
      [{ text: 'OK' }]
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#CC0000" />
          <Text style={styles.loadingText}>Cargando...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ArrowLeft size={24} color="#CC0000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Gestionar Ofertas</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📢 Banner Promocional</Text>
          <Text style={styles.sectionDescription}>
            Crea y gestiona banners promocionales que aparecerán en la pantalla principal de la app.
          </Text>
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Título *</Text>
          <TextInput
            style={styles.input}
            placeholder="Ej: ¡Oferta Especial!"
            value={title}
            onChangeText={setTitle}
            maxLength={50}
            testID="banner-title-input"
          />
          <Text style={styles.charCount}>{title.length}/50</Text>
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Mensaje *</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Ej: 2x1 en empanadas de pollo todos los días"
            value={message}
            onChangeText={setMessage}
            maxLength={150}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
            testID="banner-message-input"
          />
          <Text style={styles.charCount}>{message.length}/150</Text>
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>URL de Imagen (Opcional)</Text>
          <TextInput
            style={styles.input}
            placeholder="https://ejemplo.com/imagen.jpg"
            value={imageUrl}
            onChangeText={setImageUrl}
            autoCapitalize="none"
            keyboardType="url"
            testID="banner-image-input"
          />
          <Text style={styles.hint}>
            Puedes agregar una URL de imagen para personalizar el banner
          </Text>
        </View>

        <View style={styles.switchContainer}>
          <View style={styles.switchInfo}>
            <Text style={styles.switchLabel}>Estado del Banner</Text>
            <Text style={styles.switchDescription}>
              {isLive 
                ? '✅ Banner visible para los usuarios'
                : '❌ Banner oculto (no visible)'}
            </Text>
          </View>
          <Switch
            value={isLive}
            onValueChange={setIsLive}
            trackColor={{ false: '#DDD', true: '#4CAF50' }}
            thumbColor={isLive ? '#FFFFFF' : '#F4F3F4'}
            testID="banner-live-switch"
          />
        </View>

        <View style={styles.previewContainer}>
          <Text style={styles.previewTitle}>Vista Previa:</Text>
          <View style={styles.previewBanner}>
            <View style={styles.previewIcon}>
              <Text style={styles.previewIconText}>🎉</Text>
            </View>
            <View style={styles.previewContent}>
              <Text style={styles.previewBannerTitle}>
                {title || 'Título del banner'}
              </Text>
              <Text style={styles.previewBannerMessage}>
                {message || 'Mensaje del banner aparecerá aquí'}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={[styles.button, styles.testButton]}
            onPress={handleTestNotification}
            disabled={!title.trim()}
          >
            <Bell size={20} color="#2196F3" />
            <Text style={styles.testButtonText}>Probar Notificación</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.saveButton, isSaving && styles.buttonDisabled]}
            onPress={handleSave}
            disabled={isSaving || !title.trim() || !message.trim()}
          >
            {isSaving ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Save size={20} color="#FFFFFF" />
                <Text style={styles.saveButtonText}>Guardar Banner</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.infoBox}>
          <Text style={styles.infoTitle}>💡 Consejos:</Text>
          <Text style={styles.infoText}>
            • Usa títulos cortos y llamativos{'\n'}
            • Sé específico sobre la oferta{'\n'}
            • Activa el banner solo cuando esté listo{'\n'}
            • Las notificaciones se envían automáticamente al activar
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5'
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0'
  },
  backButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#F8F9FA'
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#CC0000'
  },
  placeholder: {
    width: 40
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666'
  },
  content: {
    flex: 1,
    padding: 20
  },
  section: {
    marginBottom: 24
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8
  },
  sectionDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20
  },
  formGroup: {
    marginBottom: 20
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333'
  },
  textArea: {
    minHeight: 80,
    paddingTop: 12
  },
  charCount: {
    fontSize: 12,
    color: '#999',
    textAlign: 'right',
    marginTop: 4
  },
  hint: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
    fontStyle: 'italic'
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#DDD'
  },
  switchInfo: {
    flex: 1,
    marginRight: 16
  },
  switchLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4
  },
  switchDescription: {
    fontSize: 14,
    color: '#666'
  },
  previewContainer: {
    marginBottom: 24
  },
  previewTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12
  },
  previewBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#CC0000',
    padding: 16,
    borderRadius: 12,
    gap: 12
  },
  previewIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center'
  },
  previewIconText: {
    fontSize: 24
  },
  previewContent: {
    flex: 1
  },
  previewBannerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4
  },
  previewBannerMessage: {
    fontSize: 14,
    color: '#FFD700'
  },
  actionsContainer: {
    gap: 12,
    marginBottom: 24
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 10,
    gap: 8
  },
  testButton: {
    backgroundColor: '#E3F2FD',
    borderWidth: 1,
    borderColor: '#2196F3'
  },
  testButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2196F3'
  },
  saveButton: {
    backgroundColor: '#4CAF50'
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF'
  },
  buttonDisabled: {
    opacity: 0.5
  },
  infoBox: {
    backgroundColor: '#FFF9E6',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FFE082',
    marginBottom: 20
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F57C00',
    marginBottom: 8
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 22
  }
});
