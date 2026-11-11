import React, { useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import LottieView from 'lottie-react-native';
import { supabase } from '../../config/supabase';
import AnimatedFeedback, { AnimatedFeedbackRef } from '../../components/common/AnimatedFeedback';

interface ResetPasswordScreenProps {
  recoveryError: string | null;
  onCancel: () => void;
  onComplete: () => void;
}

export default function ResetPasswordScreen({
  recoveryError,
  onCancel,
  onComplete,
}: ResetPasswordScreenProps) {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [updating, setUpdating] = useState(false);
  const feedbackRef = useRef<AnimatedFeedbackRef>(null);

  const updatePassword = async () => {
    if (password.length < 6) {
      feedbackRef.current?.show({
        type: 'error',
        title: 'Contraseña muy corta',
        message: 'Tu nueva contraseña debe tener al menos 6 caracteres.',
      });
      return;
    }

    if (password !== confirmPassword) {
      feedbackRef.current?.show({
        type: 'error',
        title: 'Las contraseñas no coinciden',
        message: 'Confirma la nueva contraseña para continuar.',
      });
      return;
    }

    setUpdating(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;

      setPassword('');
      setConfirmPassword('');
      feedbackRef.current?.show({
        type: 'success',
        title: '¡Contraseña actualizada!',
        message: 'Ya puedes entrar a tu cuenta con tu nueva contraseña.',
        actionLabel: 'Continuar',
        onAction: onComplete,
      });
    } catch (error: unknown) {
      feedbackRef.current?.show({
        type: 'error',
        title: 'No se pudo cambiar la contraseña',
        message: error instanceof Error ? error.message : 'Inténtalo de nuevo en unos momentos.',
      });
    } finally {
      setUpdating(false);
    }
  };

  if (recoveryError) {
    return (
      <View className="flex-1 items-center justify-center bg-[#fff7ed] px-6">
        <View className="w-full items-center rounded-[32px] border-2 border-dark bg-white px-6 py-8">
          <LottieView
            source={require('../../../assets/animations/error.json')}
            autoPlay
            loop={false}
            style={{ width: 176, height: 176 }}
            resizeMode="contain"
          />
          <Text className="text-center text-xl font-black text-dark">Enlace no válido</Text>
          <Text className="mt-2 text-center text-sm leading-5 text-gray-600">{recoveryError}</Text>
          <TouchableOpacity
            onPress={onCancel}
            activeOpacity={0.85}
            className="mt-6 h-12 w-full items-center justify-center rounded-full bg-dark"
          >
            <Text className="text-sm font-bold text-white">Volver al inicio</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      className="flex-1 bg-[#fff7ed]"
    >
      <ScrollView
        contentContainerClassName="flex-grow justify-center px-6 py-10"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View className="w-full self-center rounded-[32px] border-2 border-dark bg-white p-6" style={{ maxWidth: 420 }}>
          <View className="mb-5 h-14 w-14 items-center justify-center rounded-full border border-dark bg-[#fef3c7]">
            <Ionicons name="lock-closed-outline" size={25} color="#111827" />
          </View>
          <Text className="text-2xl font-black text-dark">Crea una nueva contraseña</Text>
          <Text className="mb-6 mt-2 text-sm leading-5 text-gray-500">
            Elige una contraseña segura de al menos 6 caracteres para recuperar tu cuenta.
          </Text>

          <TextInput
            value={password}
            onChangeText={setPassword}
            placeholder="Nueva contraseña"
            placeholderTextColor="#9ca3af"
            secureTextEntry
            autoCapitalize="none"
            autoComplete="new-password"
            textContentType="newPassword"
            editable={!updating}
            className="mb-3 h-12 rounded-full border-[1.5px] border-dark px-5 text-sm font-medium text-dark"
          />
          <TextInput
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            placeholder="Confirma tu contraseña"
            placeholderTextColor="#9ca3af"
            secureTextEntry
            autoCapitalize="none"
            autoComplete="new-password"
            textContentType="newPassword"
            editable={!updating}
            onSubmitEditing={updatePassword}
            returnKeyType="done"
            className="mb-5 h-12 rounded-full border-[1.5px] border-dark px-5 text-sm font-medium text-dark"
          />

          <TouchableOpacity
            onPress={updatePassword}
            disabled={updating}
            activeOpacity={0.85}
            className="h-12 items-center justify-center rounded-full bg-dark"
          >
            {updating ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text className="text-sm font-bold text-white">Guardar nueva contraseña</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
      <AnimatedFeedback ref={feedbackRef} />
    </KeyboardAvoidingView>
  );
}
