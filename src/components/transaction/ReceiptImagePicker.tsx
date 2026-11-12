import React from 'react';
import { Alert, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { persistImageFile } from '../../services/backupService';
import { radius, spacing, typography, useTheme } from '../../theme';

interface ReceiptImagePickerProps {
  uri?: string;
  onChange: (uri?: string) => void;
}

export function ReceiptImagePicker({ uri, onChange }: ReceiptImagePickerProps) {
  const { colors } = useTheme();

  const pickFromLibrary = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Quyền truy cập', 'Vui lòng cấp quyền truy cập thư viện ảnh.');
      return;
    }
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.75,
    });
    if (!res.canceled && res.assets?.[0]?.uri) {
      onChange(persistImageFile(res.assets[0].uri, 'receipts'));
    }
  };

  const takePhoto = async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Quyền truy cập', 'Vui lòng cấp quyền sử dụng Camera.');
      return;
    }
    const res = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      quality: 0.75,
    });
    if (!res.canceled && res.assets?.[0]?.uri) {
      onChange(persistImageFile(res.assets[0].uri, 'receipts'));
    }
  };

  return (
    <View style={styles.section}>
      <Text style={[typography.label, { color: colors.text, fontWeight: '700' }]}>
        Ảnh hóa đơn đính kèm
      </Text>
      {uri ? (
        <View style={[styles.previewWrap, { borderColor: colors.border }]}>
          <Image source={{ uri }} style={styles.preview} resizeMode="cover" />
          <Pressable
            onPress={() => onChange(undefined)}
            style={[styles.removeBtn, { backgroundColor: colors.danger }]}
          >
            <MaterialCommunityIcons name="close" size={16} color="#FFFFFF" />
          </Pressable>
        </View>
      ) : (
        <View style={styles.row}>
          <Pressable
            onPress={takePhoto}
            style={[styles.btn, { backgroundColor: colors.card, borderColor: colors.border }]}
          >
            <MaterialCommunityIcons name="camera-outline" size={20} color={colors.primary} />
            <Text style={[typography.caption, { color: colors.text, fontWeight: '600' }]}>
              Chụp ảnh
            </Text>
          </Pressable>
          <Pressable
            onPress={pickFromLibrary}
            style={[styles.btn, { backgroundColor: colors.card, borderColor: colors.border }]}
          >
            <MaterialCommunityIcons name="image-outline" size={20} color={colors.primary} />
            <Text style={[typography.caption, { color: colors.text, fontWeight: '600' }]}>
              Chọn từ Thư viện
            </Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: spacing.xs },
  row: { flexDirection: 'row', gap: spacing.sm },
  btn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: 11,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  previewWrap: {
    width: 120,
    height: 120,
    borderRadius: radius.md,
    overflow: 'hidden',
    borderWidth: 1,
  },
  preview: { width: '100%', height: '100%' },
  removeBtn: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
