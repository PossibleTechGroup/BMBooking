import React, { useState } from "react";
import {
  View,
  Image,
  Text,
  StyleProp,
  TextStyle,
  ViewStyle,
  ImageStyle,
} from "react-native";

interface DoctorAvatarProps {
  uri?: string | null;
  initials: string;
  theme: any;
  style?: StyleProp<ViewStyle>;
  imageStyle?: StyleProp<ImageStyle>;
  initialsStyle?: StyleProp<TextStyle>;
}

export const DoctorAvatar: React.FC<DoctorAvatarProps> = ({
  uri,
  initials,
  theme,
  style,
  imageStyle,
  initialsStyle,
}) => {
  const [failed, setFailed] = useState(false);
  return (
    <View style={style}>
      {uri && !failed ? (
        <Image
          source={{ uri }}
          style={imageStyle}
          resizeMode="cover"
          onError={() => setFailed(true)}
        />
      ) : (
        <Text style={[{ color: theme.textSecondary }, initialsStyle]}>{initials}</Text>
      )}
    </View>
  );
};