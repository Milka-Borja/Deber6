import React, { forwardRef, useImperativeHandle, useState } from 'react';
import { Modal, Text, TouchableOpacity, View } from 'react-native';
import LottieView from 'lottie-react-native';

export type FeedbackType = 'success' | 'error';

export interface AnimatedFeedbackOptions {
  type: FeedbackType;
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}

export interface AnimatedFeedbackRef {
  show: (options: AnimatedFeedbackOptions) => void;
}

const AnimatedFeedback = forwardRef<AnimatedFeedbackRef>(function AnimatedFeedback(_props, ref) {
  const [feedback, setFeedback] = useState<AnimatedFeedbackOptions | null>(null);

  useImperativeHandle(ref, () => ({
    show: setFeedback,
  }), []);

  const close = () => {
    const onAction = feedback?.onAction;
    setFeedback(null);
    onAction?.();
  };

  return (
    <Modal
      visible={feedback !== null}
      transparent
      animationType="fade"
      onRequestClose={() => setFeedback(null)}
    >
      <View className="flex-1 items-center justify-center bg-black/60 px-6">
        {feedback && (
          <View
            className="w-full items-center rounded-[32px] border-2 border-dark bg-white px-6 pb-6"
            style={{ maxWidth: 360 }}
          >
            <LottieView
              key={feedback.type}
              source={
                feedback.type === 'success'
                  ? require('../../../assets/animations/success.json')
                  : require('../../../assets/animations/error.json')
              }
              autoPlay
              loop={false}
              style={{ width: 176, height: 176 }}
              resizeMode="contain"
            />
            <Text className="text-center text-xl font-black text-dark">{feedback.title}</Text>
            <Text className="mt-2 text-center text-sm leading-5 text-gray-600">
              {feedback.message}
            </Text>
            <TouchableOpacity
              onPress={close}
              activeOpacity={0.85}
              accessibilityRole="button"
              className="mt-6 h-12 w-full items-center justify-center rounded-full bg-dark"
            >
              <Text className="text-sm font-bold text-white">
                {feedback.actionLabel ?? 'Entendido'}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </Modal>
  );
});

export default AnimatedFeedback;
