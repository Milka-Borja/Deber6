import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  KeyboardAvoidingView,
  Modal,
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

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function ProfileScreen() {
  const [email, setEmail] = useState('');
  const [loadingEmail, setLoadingEmail] = useState(true);
  const [passwordModalVisible, setPasswordModalVisible] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [updatingPassword, setUpdatingPassword] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const feedbackRef = useRef<AnimatedFeedbackRef>(null);

  useEffect(() => {
    supabase.auth.getUser()
      .then(({ data: { user }, error }) => {
        if (error) throw error;
        if (user) setEmail(user.email ?? '');
      })
      .catch((error: unknown) => {
        feedbackRef.current?.show({
          type: 'error',
          title: 'No se pudo cargar tu perfil',
          message: error instanceof Error ? error.message : 'Inténtalo de nuevo más tarde.',
        });
      })
      .finally(() => setLoadingEmail(false));
  }, []);

  const changePassword = async () => {
    if (newPassword.length < 6) {
      feedbackRef.current?.show({
        type: 'error',
        title: 'Contraseña muy corta',
        message: 'La nueva contraseña debe tener al menos 6 caracteres.',
      });
      return;
    }
    if (newPassword !== confirmPassword) {
      feedbackRef.current?.show({
        type: 'error',
        title: 'Las contraseñas no coinciden',
        message: 'Confirma la nueva contraseña para continuar.',
      });
      return;
    }

    setUpdatingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      setPasswordModalVisible(false);
      setNewPassword('');
      setConfirmPassword('');
      feedbackRef.current?.show({
        type: 'success',
        title: 'Contraseña actualizada',
        message: 'Tu cuenta ya está protegida con la nueva contraseña.',
      });
    } catch (error: any) {
      feedbackRef.current?.show({
        type: 'error',
        title: 'No se pudo actualizar',
        message: error.message,
      });
    } finally {
      setUpdatingPassword(false);
    }
  };

  const signOut = async () => {
    setSigningOut(true);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (error: any) {
      setSigningOut(false);
      feedbackRef.current?.show({
        type: 'error',
        title: 'No se pudo cerrar sesión',
        message: error.message,
      });
    }
  };

  const confirmSignOut = () => {
    Alert.alert('Cerrar sesión', '¿Quieres salir de tu cuenta?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Salir', style: 'destructive', onPress: signOut },
    ]);
  };

  return (
    <View className="flex-1 bg-white">
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          bottom: -10,
          left: 0,
          right: 0,
          height: SCREEN_HEIGHT * 0.72,
          zIndex: 0,
          alignItems: 'center',
          justifyContent: 'flex-start',
          overflow: 'hidden',
        }}
      >
        <LottieView
          source={require('../../../assets/animations/dripping.json')}
          autoPlay
          loop
          speed={0.65}
          resizeMode="contain"
          style={{
            width: SCREEN_WIDTH * 1.85,
            height: SCREEN_WIDTH * 1.85,
            position: 'absolute',
            top: -SCREEN_WIDTH * 0.18,
          }}
        />
      </View>

      <View className="flex-1 px-5 pt-14" style={{ zIndex: 1 }}>
        {/* Encabezado con fondo negro */}
        <View className="mb-6 rounded-2xl bg-black px-4 py-4">
          <Text className="text-xs font-bold uppercase tracking-widest text-gray-400">Cuenta</Text>
          <Text className="text-2xl font-black tracking-tight text-white">Mi Perfil </Text>
        </View>

        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Tarjeta con los datos de la persona y la animación al lado */}
          <View className="mb-6 flex-row items-center justify-between rounded-3xl border-[1.5px] border-dark bg-[#fff7ed] px-5 py-6">
            <View className="flex-1 pr-3">
              <Text className="mb-1 text-xs font-bold uppercase tracking-widest text-gray-500">
                Sesión iniciada como
              </Text>
              {loadingEmail ? (
                <ActivityIndicator className="mt-2" color="#111827" />
              ) : (
                <Text className="text-sm font-black text-dark" numberOfLines={1}>
                  {email || 'Usuario autenticado'}
                </Text>
              )}
            </View>
            {/* Animación del gatito justo al lado de los datos de la persona */}
            <View className="h-16 w-16 items-center justify-center rounded-full bg-white border border-dark overflow-hidden shadow-sm">
              <LottieView
                source={require('../../../assets/animations/cat-footer.json')}
                autoPlay
                loop
                style={{ width: 60, height: 60 }}
              />
            </View>
          </View>

          <TouchableOpacity
            onPress={() => setPasswordModalVisible(true)}
            className="mb-4 h-16 flex-row items-center justify-between rounded-2xl border-[1.5px] border-dark bg-white px-4"
          >
            <View className="flex-row items-center">
              <View className="mr-3 h-10 w-10 items-center justify-center rounded-full border border-dark bg-[#fef3c7]">
                <Ionicons name="key-outline" size={19} color="#111827" />
              </View>
              <Text className="text-sm font-bold text-dark">Cambiar contraseña</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#111827" />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={confirmSignOut}
            disabled={signingOut}
            className="h-16 flex-row items-center justify-between rounded-2xl border-[1.5px] border-dark bg-rose-50 px-4"
          >
            <View className="flex-row items-center">
              <View className="mr-3 h-10 w-10 items-center justify-center rounded-full border border-rose-200 bg-rose-100">
                <Ionicons name="log-out-outline" size={19} color="#be123c" />
              </View>
              <Text className="text-sm font-bold text-rose-700">Cerrar sesión</Text>
            </View>
            {signingOut && <ActivityIndicator color="#be123c" />}
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Modal cambio de contraseña */}
      <Modal visible={passwordModalVisible} animationType="fade" transparent>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1 justify-center bg-black/60 px-6">
          <View className="rounded-3xl border-[2px] border-dark bg-white p-6">
            <Text className="mb-2 text-xl font-black text-dark">Seguridad</Text>
            <Text className="mb-5 text-xs text-gray-600">Ingresa y confirma tu nueva contraseña (mínimo 6 caracteres).</Text>
            <TextInput
              value={newPassword}
              onChangeText={setNewPassword}
              placeholder="Nueva contraseña"
              placeholderTextColor="#9ca3af"
              secureTextEntry
              autoCapitalize="none"
              autoComplete="new-password"
              textContentType="newPassword"
              editable={!updatingPassword}
              className="mb-3 h-12 rounded-full border border-dark px-5 text-sm font-medium text-dark"
            />
            <TextInput
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="Confirma la nueva contraseña"
              placeholderTextColor="#9ca3af"
              secureTextEntry
              autoCapitalize="none"
              autoComplete="new-password"
              textContentType="newPassword"
              editable={!updatingPassword}
              onSubmitEditing={changePassword}
              returnKeyType="done"
              className="mb-5 h-12 rounded-full border border-dark px-5 text-sm font-medium text-dark"
            />
            <View className="flex-row gap-x-3">
              <TouchableOpacity
                onPress={() => {
                  setPasswordModalVisible(false);
                  setNewPassword('');
                  setConfirmPassword('');
                }}
                disabled={updatingPassword}
                className="h-12 flex-1 items-center justify-center rounded-full border border-dark bg-white"
              >
                <Text className="font-bold text-dark">Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={changePassword} disabled={updatingPassword} className="h-12 flex-1 items-center justify-center rounded-full bg-dark">
                {updatingPassword ? <ActivityIndicator color="#fff" /> : <Text className="font-bold text-white">Actualizar</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
      <AnimatedFeedback ref={feedbackRef} />
    </View>
  );
}