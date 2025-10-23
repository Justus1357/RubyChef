import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity, Platform } from 'react-native';
import { Undo2 } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

interface UndoSnackbarProps {
  visible: boolean;
  message: string;
  onUndo: () => void;
  onDismiss: () => void;
  duration?: number;
}

export default function UndoSnackbar({
  visible,
  message,
  onUndo,
  onDismiss,
  duration = 4000,
}: UndoSnackbarProps) {
  const translateY = useRef(new Animated.Value(100)).current;
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const handleDismiss = () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      Animated.timing(translateY, {
        toValue: 100,
        duration: 200,
        useNativeDriver: true,
      }).start(() => {
        onDismiss();
      });
    };

    if (visible) {
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        tension: 65,
        friction: 11,
      }).start();

      timerRef.current = setTimeout(() => {
        handleDismiss();
      }, duration);

      return () => {
        if (timerRef.current) {
          clearTimeout(timerRef.current);
        }
      };
    } else {
      Animated.timing(translateY, {
        toValue: 100,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, duration, translateY, onDismiss]);

  const handleUndo = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    onUndo();
  };



  if (!visible) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateY }],
        },
      ]}
    >
      <View style={styles.content}>
        <Text style={styles.message}>{message}</Text>
        <TouchableOpacity style={styles.undoButton} onPress={handleUndo}>
          <Undo2 size={18} color="#6D1F3C" />
          <Text style={styles.undoText}>UNDO</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 100,
    left: 16,
    right: 16,
    zIndex: 1000,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#333',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  message: {
    flex: 1,
    fontSize: 15,
    color: '#fff',
    marginRight: 16,
  },
  undoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    gap: 6,
  },
  undoText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#6D1F3C',
  },
});
