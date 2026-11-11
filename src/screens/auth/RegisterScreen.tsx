import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Dimensions,
} from 'react-native';
import LottieView from 'lottie-react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { supabase } from '../../config/supabase';
import LiquidTransitionCurtain, { LiquidCurtainRef } from '../../components/common/LiquidTransitionCurtain';
import AnimatedFeedback, { AnimatedFeedbackRef } from '../../components/common/AnimatedFeedback';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function RegisterScreen() {
  const navigation = useNavigation<any>();
  const curtainRef = useRef<LiquidCurtainRef>(null);
  const feedbackRef = useRef<AnimatedFeedbackRef>(null);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);

  const catRef = useRef<LottieView>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      catRef.current?.play(0, 55);
    }, 150);
    return () => clearTimeout(timer);
  }, []);

  const handleEmailChange = (text: string) => {
    setEmail(text);
    const progress = Math.min(text.length / 12, 1);
    const targetFrame = Math.floor(65 + progress * 20);
    catRef.current?.play(targetFrame, targetFrame);
  };

  const handleEmailFocus = () => {
    setIsPasswordFocused(false);
    catRef.current?.play(21, 65);
  };

  const handlePasswordFocus = () => {
    setIsPasswordFocused(true);
    if (!showPassword && !showConfirmPassword) {
      catRef.current?.play(110, 131);
    } else {
      catRef.current?.play(21, 45);
    }
  };

  const handlePasswordBlur = () => {
    setIsPasswordFocused(false);
    catRef.current?.play(21, 45);
  };

  const toggleShowPassword = () => {
    const willShow = !showPassword;
    setShowPassword(willShow);
    if (isPasswordFocused || password.length > 0) {
      catRef.current?.play(willShow ? 21 : 110, willShow ? 45 : 131);
    }
  };

  const toggleShowConfirmPassword = () => {
    const willShow = !showConfirmPassword;
    setShowConfirmPassword(willShow);
    if (isPasswordFocused || confirmPassword.length > 0) {
      catRef.current?.play(willShow ? 21 : 110, willShow ? 45 : 131);
    }
  };

  const handleNavigateToLogin = () => {
    curtainRef.current?.startTransition(() => {
      navigation.navigate('Login' as never);
    });
  };

  const handleRegister = async () => {
    const cleanEmail = email.trim();
    const cleanPass = password.trim();
    const cleanConfirm = confirmPassword.trim();

    if (!cleanEmail || !cleanPass || !cleanConfirm) {
      feedbackRef.current?.show({
        type: 'error',
        title: 'Campos incompletos',
        message: 'Completa todos los campos para crear tu cuenta.',
      });
      return;
    }

    if (cleanPass.length < 6) {
      feedbackRef.current?.show({
        type: 'error',
        title: 'Contraseña muy corta',
        message: 'Tu contraseña debe tener al menos 6 caracteres.',
      });
      return;
    }

    if (cleanPass !== cleanConfirm) {
      feedbackRef.current?.show({
        type: 'error',
        title: 'Las contraseñas no coinciden',
        message: 'Verifica que ambas contraseñas sean iguales.',
      });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email: cleanEmail,
        password: cleanPass,
      });

      if (error) throw error;

      if (data?.user && !data.session) {
        feedbackRef.current?.show({
          type: 'success',
          title: '¡Cuenta creada!',
          message: 'Revisa tu correo para verificar tu cuenta antes de ingresar.',
          actionLabel: 'Ir a iniciar sesión',
          onAction: handleNavigateToLogin,
        });
      } else {
        feedbackRef.current?.show({
          type: 'success',
          title: '¡Bienvenido!',
          message: 'Tu registro fue completado exitosamente.',
        });
      }
    } catch (err: any) {
      feedbackRef.current?.show({
        type: 'error',
        title: 'No se pudo crear la cuenta',
        message: err.message || 'Inténtalo de nuevo en unos momentos.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      className="flex-1 bg-salmon-light"
    >
      {/* Ondas negras en el fondo inferior */}
      <View
        className="absolute -bottom-[10px] left-0 right-0 z-0 items-center justify-start overflow-hidden"
        style={{ height: SCREEN_HEIGHT * 0.72 }}
        pointerEvents="none"
      >
        <LottieView
          source={require('../../../assets/animations/dripping.json')}
          autoPlay={true}
          loop={true}
          speed={0.65}
          style={{
            width: SCREEN_WIDTH * 1.85,
            height: SCREEN_WIDTH * 1.85,
            position: 'absolute',
            top: -SCREEN_WIDTH * 0.18,
          }}
          resizeMode="contain"
        />
      </View>

      <ScrollView
        className="flex-1"
        contentContainerClassName="z-[2] flex-grow justify-center px-6 pt-[35px] pb-10"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Mascota Superior */}
        <View className="z-[3] h-[135px] items-center justify-end -mb-[14px]">
          <LottieView
            ref={catRef}
            source={require('../../../assets/animations/cat-movement.json')}
            style={{ width: 220, height: 170 }}
            autoPlay={false}
            loop={false}
          />
        </View>

        {/* Tarjeta del Formulario */}
        <View
          className="z-[4] rounded-[32px] border-[1.5px] border-dark bg-white px-6 pt-8 pb-[26px]"
          style={{
            shadowColor: '#000000',
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: 0.08,
            shadowRadius: 16,
            elevation: 4,
          }}
        >
          <Text className="text-center text-2xl font-extrabold tracking-[-0.5px] text-dark">
            Crear cuenta
          </Text>
          <Text className="mt-1.5 mb-6 text-center text-[13px] leading-[18px] text-gray-500">
            Regístrate para comenzar a registrar y cuidar a tus mascotas
          </Text>

          {/* Input Email */}
          <View className="mb-3.5 h-[52px] flex-row items-center rounded-full border-[1.5px] border-dark bg-white px-5">
            <TextInput
              value={email}
              onChangeText={handleEmailChange}
              onFocus={handleEmailFocus}
              placeholder="Email"
              placeholderTextColor="#9ca3af"
              keyboardType="email-address"
              autoCapitalize="none"
              className="flex-1 text-sm font-medium text-dark"
            />
          </View>

          {/* Input Password */}
          <View className="mb-3.5 h-[52px] flex-row items-center rounded-full border-[1.5px] border-dark bg-white px-5">
            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder="Contraseña (mínimo 6 caracteres)"
              placeholderTextColor="#9ca3af"
              secureTextEntry={!showPassword}
              className="flex-1 text-sm font-medium text-dark"
              onFocus={handlePasswordFocus}
              onBlur={handlePasswordBlur}
            />
            <TouchableOpacity onPress={toggleShowPassword} className="p-1.5">
              <Ionicons
                name={showPassword ? 'eye-outline' : 'eye-off-outline'}
                size={20}
                color="#6b7280"
              />
            </TouchableOpacity>
          </View>

          {/* Input Confirm Password */}
          <View className="mb-3.5 h-[52px] flex-row items-center rounded-full border-[1.5px] border-dark bg-white px-5">
            <TextInput
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="Confirmar contraseña"
              placeholderTextColor="#9ca3af"
              secureTextEntry={!showConfirmPassword}
              className="flex-1 text-sm font-medium text-dark"
              onFocus={handlePasswordFocus}
              onBlur={handlePasswordBlur}
            />
            <TouchableOpacity onPress={toggleShowConfirmPassword} className="p-1.5">
              <Ionicons
                name={showConfirmPassword ? 'eye-outline' : 'eye-off-outline'}
                size={20}
                color="#6b7280"
              />
            </TouchableOpacity>
          </View>

          {/* Botón Principal (Negro en Register para contrastar con el fondo salmón) */}
          <TouchableOpacity
            onPress={handleRegister}
            disabled={loading}
            activeOpacity={0.85}
            className="h-[52px] items-center justify-center rounded-full bg-dark"
          >
            {loading ? (
              <LottieView
                source={require('../../../assets/animations/pet-loading.json')}
                autoPlay
                loop
                style={{ width: 28, height: 28 }}
              />
            ) : (
              <Text className="text-[15px] font-bold text-white">Registrarme</Text>
            )}
          </TouchableOpacity>

          <View className="my-[18px] flex-row items-center">
            <View className="h-px flex-1 bg-gray-200" />
            <Text className="mx-3 text-xs font-semibold text-gray-400">o</Text>
            <View className="h-px flex-1 bg-gray-200" />
          </View>

          {/* Botón Volver al Login */}
          <TouchableOpacity
            onPress={handleNavigateToLogin}
            activeOpacity={0.85}
            className="h-[50px] items-center justify-center rounded-full border-[1.5px] border-dark bg-white"
          >
            <Text className="text-sm font-semibold text-dark">Ya tengo una cuenta</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Cortina líquida de transición */}
      <LiquidTransitionCurtain ref={curtainRef} />
      <AnimatedFeedback ref={feedbackRef} />
    </KeyboardAvoidingView>
  );
}