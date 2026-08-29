import { ScrollView, StyleSheet, Text, View } from 'react-native';

export default function ProfileScreen() {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.screenTitle}>Profile</Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Personal Information</Text>

        <Text style={styles.label}>Name</Text>
        <Text style={styles.value}>Not set</Text>

        <Text style={styles.label}>Height</Text>
        <Text style={styles.value}>Not set</Text>

        <Text style={styles.label}>Current Weight</Text>
        <Text style={styles.value}>Not set</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Fitness Goals</Text>

        <Text style={styles.label}>Goal</Text>
        <Text style={styles.value}>Not set</Text>

        <Text style={styles.label}>Goal Weight</Text>
        <Text style={styles.value}>Not set</Text>

        <Text style={styles.label}>Activity Level</Text>
        <Text style={styles.value}>Not set</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Nutrition Targets</Text>

        <Text style={styles.label}>Daily Calories</Text>
        <Text style={styles.value}>2,200 kcal</Text>

        <View style={styles.macroRow}>
          <View style={styles.macroItem}>
            <Text style={styles.label}>Protein</Text>
            <Text style={styles.value}>180g</Text>
          </View>

          <View style={styles.macroItem}>
            <Text style={styles.label}>Carbs</Text>
            <Text style={styles.value}>190g</Text>
          </View>

          <View style={styles.macroItem}>
            <Text style={styles.label}>Fat</Text>
            <Text style={styles.value}>80g</Text>
          </View>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Settings</Text>

        <Text style={styles.settingItem}>Edit Profile</Text>
        <Text style={styles.settingItem}>Update Goals</Text>
        <Text style={styles.settingItem}>Nutrition Settings</Text>
        <Text style={styles.settingItem}>Account Settings</Text>
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
    gap: 10,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  label: {
    fontSize: 14,
  },
  value: {
    fontSize: 18,
    fontWeight: '600',
  },
  macroRow: {
    flexDirection: 'row',
    gap: 12,
  },
  macroItem: {
    flex: 1,
  },
  settingItem: {
    fontSize: 16,
    fontWeight: '600',
    paddingVertical: 6,
  },
});