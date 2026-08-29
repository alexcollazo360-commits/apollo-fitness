import { ScrollView, StyleSheet, Text, View } from 'react-native';

export default function FoodScreen() {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.screenTitle}>Food</Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Today's Nutrition</Text>

        <Text style={styles.label}>Calories</Text>
        <Text style={styles.value}>0 / 2,200 kcal</Text>

        <View style={styles.macroRow}>
          <View style={styles.macroItem}>
            <Text style={styles.label}>Protein</Text>
            <Text style={styles.value}>0 / 180g</Text>
          </View>

          <View style={styles.macroItem}>
            <Text style={styles.label}>Carbs</Text>
            <Text style={styles.value}>0 / 190g</Text>
          </View>

          <View style={styles.macroItem}>
            <Text style={styles.label}>Fat</Text>
            <Text style={styles.value}>0 / 80g</Text>
          </View>
        </View>
      </View>

      <View style={styles.mealCard}>
        <Text style={styles.cardTitle}>Breakfast</Text>
        <Text style={styles.emptyText}>No foods logged</Text>
        <Text style={styles.addFood}>+ Add Food</Text>
      </View>

      <View style={styles.mealCard}>
        <Text style={styles.cardTitle}>Lunch</Text>
        <Text style={styles.emptyText}>No foods logged</Text>
        <Text style={styles.addFood}>+ Add Food</Text>
      </View>

      <View style={styles.mealCard}>
        <Text style={styles.cardTitle}>Dinner</Text>
        <Text style={styles.emptyText}>No foods logged</Text>
        <Text style={styles.addFood}>+ Add Food</Text>
      </View>

      <View style={styles.mealCard}>
        <Text style={styles.cardTitle}>Snacks</Text>
        <Text style={styles.emptyText}>No foods logged</Text>
        <Text style={styles.addFood}>+ Add Food</Text>
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
  mealCard: {
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
    justifyContent: 'space-between',
    gap: 12,
  },
  macroItem: {
    flex: 1,
  },
  emptyText: {
    fontSize: 16,
  },
  addFood: {
    fontSize: 16,
    fontWeight: '600',
  },
});