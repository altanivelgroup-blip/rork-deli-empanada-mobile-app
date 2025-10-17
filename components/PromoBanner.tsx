import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  Animated,
  Easing
} from 'react-native';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { PromoBanner as PromoBannerType } from '@/types/banner';

export default function PromoBanner() {
  const [banner, setBanner] = useState<PromoBannerType | null>(null);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(-100));

  useEffect(() => {
    if (!db) {
      console.warn('Firebase not initialized, banner will not be displayed');
      return;
    }

    const bannerRef = doc(db, 'banners', 'current');
    
    const unsubscribe = onSnapshot(
      bannerRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data() as PromoBannerType;
          
          if (data.isLive) {
            setBanner(data);
            
            Animated.parallel([
              Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 500,
                useNativeDriver: true,
                easing: Easing.out(Easing.ease)
              }),
              Animated.spring(slideAnim, {
                toValue: 0,
                tension: 50,
                friction: 8,
                useNativeDriver: true
              })
            ]).start();
          } else {
            Animated.parallel([
              Animated.timing(fadeAnim, {
                toValue: 0,
                duration: 300,
                useNativeDriver: true
              }),
              Animated.timing(slideAnim, {
                toValue: -100,
                duration: 300,
                useNativeDriver: true
              })
            ]).start(() => {
              setBanner(null);
            });
          }
        } else {
          setBanner(null);
        }
      },
      (error) => {
        console.error('Error loading banner:', error);
      }
    );

    return () => unsubscribe();
  }, [fadeAnim, slideAnim]);

  if (!banner) {
    return null;
  }

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }]
        }
      ]}
    >
      <View style={styles.banner}>
        <View style={styles.iconContainer}>
          {banner.imageUrl ? (
            <Image
              source={{ uri: banner.imageUrl }}
              style={styles.customImage}
              resizeMode="cover"
            />
          ) : (
            <Image
              source={{
                uri: 'https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/ymk4xvks1kuz0it56htjb'
              }}
              style={styles.logoImage}
              resizeMode="contain"
            />
          )}
        </View>
        
        <View style={styles.content}>
          <Text style={styles.title} numberOfLines={1}>
            {banner.title}
          </Text>
          <Text style={styles.message} numberOfLines={2}>
            {banner.message}
          </Text>
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 8
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#CC0000',
    borderRadius: 16,
    padding: 14,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6
  },
  iconContainer: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden'
  },
  logoImage: {
    width: 54,
    height: 54
  },
  customImage: {
    width: 54,
    height: 54,
    borderRadius: 27
  },
  content: {
    flex: 1
  },
  title: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4
  },
  message: {
    fontSize: 14,
    color: '#FFD700',
    lineHeight: 18
  }
});
