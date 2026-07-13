import React, { ComponentType } from 'react';
import { Platform, View, Text } from 'react-native';

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

let NativeMapView: ComponentType<MapViewProps> | null = null;
let NativeMarker: ComponentType<MarkerProps> | null = null;
let PROVIDER_GOOGLE: any = null;

if (Platform.OS !== 'web') {
  const Maps = require('react-native-maps');
  NativeMapView = Maps.default;
  NativeMarker = Maps.Marker;
  PROVIDER_GOOGLE = Maps.PROVIDER_GOOGLE;
}

export function MapViewComponent(props: MapViewProps) {
  if (Platform.OS === 'web' || !NativeMapView) {
    return (
      <View style={[{ justifyContent: 'center', alignItems: 'center', backgroundColor: '#F3F4F6' }, props.style]}>
        <Text style={{ color: '#9CA3AF', fontSize: 13 }}>Map not available on web</Text>
      </View>
    );
  }
  return <NativeMapView {...props} />;
}

export function MarkerComponent(props: MarkerProps) {
  if (Platform.OS === 'web' || !NativeMarker) return null;
  return <NativeMarker {...props} />;
}

export { PROVIDER_GOOGLE };
