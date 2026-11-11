import React, { useImperativeHandle, forwardRef, useRef } from 'react';
import { View, Dimensions, Animated, Easing } from 'react-native';
import LottieView from 'lottie-react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export interface LiquidCurtainRef {
  startTransition: (onMidpoint?: () => void) => void;
}

const LiquidTransitionCurtain = forwardRef<LiquidCurtainRef>((_, ref) => {
  // Comienza abajo de la pantalla
  const liquidY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;

  useImperativeHandle(ref, () => ({
    startTransition: (onMidpoint?: () => void) => {
      // 1. Sube el telón cubriendo toda la pantalla
      Animated.timing(liquidY, {
        toValue: 0,
        duration: 600,
        easing: Easing.bezier(0.4, 0, 0.2, 1),
        useNativeDriver: true,
      }).start(() => {
        // 2. Pantalla completamente cubierta: cambiamos de ruta o estado
        if (onMidpoint) onMidpoint();

        // 3. El líquido baja revelando la nueva pantalla
        Animated.timing(liquidY, {
          toValue: SCREEN_HEIGHT,
          duration: 550,
          delay: 80,
          easing: Easing.bezier(0.4, 0, 0.2, 1),
          useNativeDriver: true,
        }).start();
      });
    },
  }));

  return (
    <Animated.View
      className="absolute left-0 right-0 top-0 z-[9999]"
      style={{
        height: SCREEN_HEIGHT + 250,
        transform: [{ translateY: liquidY }],
      }}
      pointerEvents="none"
    >
      {/* Cresta con ondas Lottie */}
      <View className="overflow-hidden" style={{ width: SCREEN_WIDTH, height: 140 }}>
        <LottieView
          source={require('../../../assets/animations/dripping.json')}
          autoPlay
          loop
          speed={0.7}
          style={{ width: SCREEN_WIDTH, height: 140 }}
          resizeMode="cover"
        />
      </View>
      {/* Bloque sólido negro que sella la pantalla */}
      <View className="bg-[#131312]" style={{ width: SCREEN_WIDTH, height: SCREEN_HEIGHT + 120 }} />
    </Animated.View>
  );
});

LiquidTransitionCurtain.displayName = 'LiquidTransitionCurtain';

export default LiquidTransitionCurtain;