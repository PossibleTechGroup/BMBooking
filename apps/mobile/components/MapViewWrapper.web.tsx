import React from 'react';
import { View, Text } from 'react-native';

type MapViewProps = {
  provider?: any;
  style?: any;
  initialRegion?: any;
  scrollEnabled?: boolean;
  zoomEnabled?: boolean;
  children?: React.ReactNode;
};

type MarkerProps = {
  coordinate: { latitude: number; longitude: number };
  title?: string;
};

export function MapViewComponent(props: MapViewProps) {
  return (
    <View style={[{ justifyContent: 'center', alignItems: 'center', backgroundColor: '#F3F4F6' }, props.style]}>
      <Text style={{ color: '#9CA3AF', fontSize: 13 }}>Map not available on web</Text>
    </View>
  );
}

export function MarkerComponent(props: MarkerProps) {
  return null;
}

export const PROVIDER_GOOGLE = null;
