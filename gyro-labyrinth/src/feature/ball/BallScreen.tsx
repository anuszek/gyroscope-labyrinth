import { StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';

import { colors } from '../../ui/theme/colors';
import { RADIUS, useBall } from './useBall';

export function BallScreen() {
  const { x, y } = useBall();

  const ballStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: x.value - RADIUS }, { translateY: y.value - RADIUS }],
  }));

  return (
    <View style={styles.floor}>
      <Animated.View style={[styles.ball, ballStyle]} />
    </View>
  );
}

const styles = StyleSheet.create({
  floor: {
    flex: 1,
    backgroundColor: colors.floor,
  },
  ball: {
    position: 'absolute',
    width: RADIUS * 2,
    height: RADIUS * 2,
    borderRadius: RADIUS,
    backgroundColor: colors.ball,
  },
});
