import { useMemo, useRef, useState } from 'react';
import { PanResponder, StyleSheet, View } from 'react-native';

import { Colors } from '../theme/colors';
import { useStyles } from '../theme/useTheme';

const THUMB = 18;

type Props = {
  value: number; // 0..1
  onChange: (value: number) => void;
};

export function Slider({ value, onChange }: Props) {
  const styles = useStyles(makeStyles);
  const [width, setWidth] = useState(0);
  const state = useRef({ width: 0, startX: 0, onChange });
  state.current.width = width;
  state.current.onChange = onChange;

  const responder = useMemo(() => {
    const update = (x: number) => {
      const { width, onChange } = state.current;
      if (width > 0) onChange(Math.min(Math.max(x / width, 0), 1));
    };
    return PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: (event) => {
        state.current.startX = event.nativeEvent.locationX - THUMB / 2;
        update(state.current.startX);
      },
      onPanResponderMove: (_, gesture) => update(state.current.startX + gesture.dx),
    });
  }, []);

  return (
    <View style={styles.hitArea} {...responder.panHandlers}>
      <View style={styles.inner} pointerEvents="none" onLayout={(e) => setWidth(e.nativeEvent.layout.width - THUMB)}>
        <View style={styles.track} />
        <View style={[styles.thumb, { left: value * width }]} />
      </View>
    </View>
  );
}

const makeStyles = (colors: Colors) =>
  StyleSheet.create({
    hitArea: { height: 36, justifyContent: 'center' },
    inner: { height: THUMB, justifyContent: 'center' },
    track: {
      height: 6,
      marginHorizontal: THUMB / 2,
      borderRadius: 3,
      backgroundColor: colors.divider,
    },
    thumb: {
      position: 'absolute',
      width: THUMB,
      height: THUMB,
      borderRadius: THUMB / 2,
      backgroundColor: colors.primaryStrong,
      borderWidth: 3,
      borderColor: colors.surface,
      shadowColor: '#000',
      shadowOpacity: 0.2,
      shadowRadius: 3,
      shadowOffset: { width: 0, height: 1 },
      elevation: 3,
    },
  });
