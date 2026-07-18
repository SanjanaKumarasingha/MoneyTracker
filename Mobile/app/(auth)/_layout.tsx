import { Stack } from 'expo-router';

// Login is the anchor/initial route for this group.
export const unstable_settings = {
  initialRouteName: 'login',
};

export default function AuthGroupLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />
    </Stack>
  );
}
