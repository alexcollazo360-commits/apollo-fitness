import { ScrollView, StyleSheet, Text, View } from 'react-native';

export default function WorkoutScreen() {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.screenTitle}>Workout</Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Today's Workout</Text>
        <Text style={styles.emptyText}>No workout started</Text>

        <View style={styles.button}>
          <Text style={styles.buttonText}>Start Workout</Text>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Recent Workouts</Text>
        <Text style={styles.emptyText}>No workout history yet</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Workout Templates</Text>
        <Text style={styles.emptyText}>No templates created</Text>

        <View style={styles.secondaryButton}>
          <Text style={styles.secondaryButtonText}>+ Create Template</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    paddingBottom: 40,
    gap: 16,
  },
  screenTitle: {
    fontSize: 32,
    fontWeight: '700',
  },
  card: {
    padding: 20,
    borderWidth: 1,
    borderRadius: 12,
    gap: 12,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  emptyText: {
    fontSize: 16,
  },
  button: {
    padding: 14,
    borderWidth: 1,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    paddingVertical: 10,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});