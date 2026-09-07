export type ExerciseLibraryItem = {
  name: string;
  category: string;
};

export const exerciseLibrary: ExerciseLibraryItem[] = [
  // Chest
  {
    name: 'Barbell Bench Press',
    category: 'Chest',
  },
  {
    name: 'Dumbbell Bench Press',
    category: 'Chest',
  },
  {
    name: 'Incline Barbell Bench Press',
    category: 'Chest',
  },
  {
    name: 'Incline Dumbbell Bench Press',
    category: 'Chest',
  },
  {
    name: 'Decline Bench Press',
    category: 'Chest',
  },
  {
    name: 'Chest Press Machine',
    category: 'Chest',
  },
  {
    name: 'Dumbbell Fly',
    category: 'Chest',
  },
  {
    name: 'Cable Fly',
    category: 'Chest',
  },
  {
    name: 'Pec Deck',
    category: 'Chest',
  },
  {
    name: 'Push-Up',
    category: 'Chest',
  },
  {
    name: 'Dips',
    category: 'Chest',
  },

  // Back
  {
    name: 'Lat Pulldown',
    category: 'Back',
  },
  {
    name: 'Pull-Up',
    category: 'Back',
  },
  {
    name: 'Chin-Up',
    category: 'Back',
  },
  {
    name: 'Barbell Row',
    category: 'Back',
  },
  {
    name: 'Dumbbell Row',
    category: 'Back',
  },
  {
    name: 'Seated Cable Row',
    category: 'Back',
  },
  {
    name: 'T-Bar Row',
    category: 'Back',
  },
  {
    name: 'Chest Supported Row',
    category: 'Back',
  },
  {
    name: 'Machine Row',
    category: 'Back',
  },
  {
    name: 'Straight Arm Pulldown',
    category: 'Back',
  },
  {
    name: 'Face Pull',
    category: 'Back',
  },
  {
    name: 'Deadlift',
    category: 'Back',
  },

  // Shoulders
  {
    name: 'Barbell Overhead Press',
    category: 'Shoulders',
  },
  {
    name: 'Dumbbell Shoulder Press',
    category: 'Shoulders',
  },
  {
    name: 'Machine Shoulder Press',
    category: 'Shoulders',
  },
  {
    name: 'Arnold Press',
    category: 'Shoulders',
  },
  {
    name: 'Dumbbell Lateral Raise',
    category: 'Shoulders',
  },
  {
    name: 'Cable Lateral Raise',
    category: 'Shoulders',
  },
  {
    name: 'Front Raise',
    category: 'Shoulders',
  },
  {
    name: 'Rear Delt Fly',
    category: 'Shoulders',
  },
  {
    name: 'Reverse Pec Deck',
    category: 'Shoulders',
  },
  {
    name: 'Upright Row',
    category: 'Shoulders',
  },

  // Biceps
  {
    name: 'Barbell Curl',
    category: 'Biceps',
  },
  {
    name: 'Dumbbell Curl',
    category: 'Biceps',
  },
  {
    name: 'Hammer Curl',
    category: 'Biceps',
  },
  {
    name: 'Preacher Curl',
    category: 'Biceps',
  },
  {
    name: 'Cable Curl',
    category: 'Biceps',
  },
  {
    name: 'Incline Dumbbell Curl',
    category: 'Biceps',
  },
  {
    name: 'Concentration Curl',
    category: 'Biceps',
  },

  // Triceps
  {
    name: 'Triceps Pushdown',
    category: 'Triceps',
  },
  {
    name: 'Rope Triceps Pushdown',
    category: 'Triceps',
  },
  {
    name: 'Overhead Triceps Extension',
    category: 'Triceps',
  },
  {
    name: 'Skull Crusher',
    category: 'Triceps',
  },
  {
    name: 'Close Grip Bench Press',
    category: 'Triceps',
  },
  {
    name: 'Triceps Dip',
    category: 'Triceps',
  },
  {
    name: 'Dumbbell Kickback',
    category: 'Triceps',
  },

  // Quads
  {
    name: 'Barbell Back Squat',
    category: 'Quads',
  },
  {
    name: 'Front Squat',
    category: 'Quads',
  },
  {
    name: 'Hack Squat',
    category: 'Quads',
  },
  {
    name: 'Leg Press',
    category: 'Quads',
  },
  {
    name: 'Leg Extension',
    category: 'Quads',
  },
  {
    name: 'Bulgarian Split Squat',
    category: 'Quads',
  },
  {
    name: 'Walking Lunge',
    category: 'Quads',
  },
  {
    name: 'Reverse Lunge',
    category: 'Quads',
  },
  {
    name: 'Goblet Squat',
    category: 'Quads',
  },

  // Hamstrings / Glutes
  {
    name: 'Romanian Deadlift',
    category: 'Hamstrings',
  },
  {
    name: 'Stiff Leg Deadlift',
    category: 'Hamstrings',
  },
  {
    name: 'Seated Leg Curl',
    category: 'Hamstrings',
  },
  {
    name: 'Lying Leg Curl',
    category: 'Hamstrings',
  },
  {
    name: 'Hip Thrust',
    category: 'Glutes',
  },
  {
    name: 'Glute Bridge',
    category: 'Glutes',
  },
  {
    name: 'Cable Kickback',
    category: 'Glutes',
  },
  {
    name: 'Hip Abduction Machine',
    category: 'Glutes',
  },
  {
    name: 'Hip Adduction Machine',
    category: 'Glutes',
  },

  // Calves
  {
    name: 'Standing Calf Raise',
    category: 'Calves',
  },
  {
    name: 'Seated Calf Raise',
    category: 'Calves',
  },
  {
    name: 'Leg Press Calf Raise',
    category: 'Calves',
  },

  // Core
  {
    name: 'Cable Crunch',
    category: 'Core',
  },
  {
    name: 'Machine Crunch',
    category: 'Core',
  },
  {
    name: 'Hanging Leg Raise',
    category: 'Core',
  },
  {
    name: 'Hanging Knee Raise',
    category: 'Core',
  },
  {
    name: 'Ab Wheel Rollout',
    category: 'Core',
  },
  {
    name: 'Plank',
    category: 'Core',
  },
  {
    name: 'Side Plank',
    category: 'Core',
  },
  {
    name: 'Russian Twist',
    category: 'Core',
  },

  // Traps / Forearms
  {
    name: 'Barbell Shrug',
    category: 'Traps',
  },
  {
    name: 'Dumbbell Shrug',
    category: 'Traps',
  },
  {
    name: 'Wrist Curl',
    category: 'Forearms',
  },
  {
    name: 'Reverse Wrist Curl',
    category: 'Forearms',
  },
  {
    name: 'Farmer Carry',
    category: 'Forearms',
  },

  // Cardio
  {
    name: 'Treadmill',
    category: 'Cardio',
  },
  {
    name: 'Stationary Bike',
    category: 'Cardio',
  },
  {
    name: 'Elliptical',
    category: 'Cardio',
  },
  {
    name: 'Stair Climber',
    category: 'Cardio',
  },
  {
    name: 'Rowing Machine',
    category: 'Cardio',
  },
];