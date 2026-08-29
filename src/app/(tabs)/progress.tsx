import { ScrollView, StyleSheet, Text, View } from 'react-native';

export default function ProgressScreen() {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.screenTitle}>Progress</Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Weight Progress</Text>

        <Text style={styles.label}>Current Weight</Text>
        <Text style={styles.largeValue}>No weight logged</Text>

        <Text style={styles.label}>Goal Weight</Text>
        <Text style={styles.value}>Not set</Text>

        <View style={styles.button}>
          <Text style={styles.buttonText}>Log Weight</Text>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Weight History</Text>
        <Text style={styles.emptyText}>
          Your weight history will appear here.
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Fitness Summary</Text>

        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Text style={styles.statValue}>0</Text>
            <Text style={styles.label}>Workouts</Text>
          </View>

          <View style={styles.stat}>
            <Text style={styles.statValue}>0</Text>
            <Text style={styles.label}>Days Tracked</Text>
          </View>

          <View style={styles.stat}>
            <Text style={styles.statValue}>--</Text>
            <Text style={styles.label}>Weight Change</Text>
          </View>
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
  label: {
    fontSize: 14,
  },
  largeValue: {
    fontSize: 24,
    fontWeight: '700',
  },
  value: {
    fontSize: 18,
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
  statsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  stat: {
    flex: 1,
  },
  statValue: {
    fontSize: 22,
    fontWeight: '700',
  },
});