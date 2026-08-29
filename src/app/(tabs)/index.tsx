import { StyleSheet, Text, View } from 'react-native';

export default function TodayScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Today</Text>
      <Text>Apollo Fitness Dashboard</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
  },
});