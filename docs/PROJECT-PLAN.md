# Apollo Fitness

## Project Overview

Apollo Fitness is a calorie, nutrition, workout, and fitness progress tracking application.

The goal of the MVP is to allow a user to:

- Create an account
- Set personal fitness goals
- Establish daily calorie and macro targets
- Log food and meals
- Track daily calories and macronutrients
- Create and log workouts
- Record exercises, sets, reps, and weight
- Track body weight
- Review fitness progress

---

## MVP Navigation

### Authentication

- Welcome
- Sign Up
- Login

### Onboarding

- Personal Information
- Activity Level
- Fitness Goal
- Calorie & Macro Targets

### Main Application

#### Today
Daily dashboard showing:
- Calories consumed
- Calories remaining
- Protein
- Carbohydrates
- Fat
- Today's workout
- Current body weight

#### Food
- Daily Food Log
- Breakfast
- Lunch
- Dinner
- Snacks
- Add Food

#### Workout
- Workout Home
- Start Workout
- Add Exercise
- Log Sets
- Log Weight
- Log Reps
- Finish Workout

#### Progress
- Current Weight
- Weight History
- Weight Progress

#### Profile
- Personal Information
- Fitness Goals
- Calorie Target
- Macro Targets
- Settings

---

## Main Navigation

The main application will use five bottom navigation tabs:

1. Today
2. Food
3. Workout
4. Progress
5. Profile

---

## Technology Stack

### Frontend
- React Native
- Expo
- TypeScript
- Expo Router

### Backend
- Supabase

### Database
- PostgreSQL through Supabase

### Version Control
- Git
- GitHub

---

## Planned Database Structure

### Users / Profiles
Stores user profile and fitness information.

### Goals
Stores calorie, macro, weight, and fitness goals.

### Food Entries
Stores foods consumed by the user.

### Workouts
Stores individual workout sessions.

### Workout Exercises
Stores exercises belonging to a workout.

### Workout Sets
Stores weight, repetitions, and individual sets.

### Weight Entries
Stores body-weight history.

---

## Development Roadmap

### Phase 1 - Project Foundation
- [x] Install and verify development tools
- [x] Create Expo project
- [x] Configure TypeScript
- [x] Configure Expo Router
- [x] Verify application runs
- [x] Reset Expo starter project
- [x] Configure Git
- [x] Create GitHub repository
- [x] Push clean project to GitHub

### Phase 2 - Application Architecture
- [ ] Define screen structure
- [ ] Create Expo Router structure
- [ ] Create bottom-tab navigation
- [ ] Create placeholder screens
- [ ] Verify navigation

### Phase 3 - Dashboard
- [ ] Build Today screen
- [ ] Add calorie summary
- [ ] Add macro summary
- [ ] Add workout summary
- [ ] Add weight summary

### Phase 4 - Food Tracking
- [ ] Build daily food log
- [ ] Create Add Food screen
- [ ] Support meals
- [ ] Calculate daily nutrition totals

### Phase 5 - Workout Tracking
- [ ] Create workouts
- [ ] Add exercises
- [ ] Add sets
- [ ] Record weight and reps
- [ ] Complete workout
- [ ] View workout history

### Phase 6 - Progress Tracking
- [ ] Log body weight
- [ ] View weight history
- [ ] Display weight progress

### Phase 7 - Authentication & Backend
- [ ] Configure Supabase
- [ ] Create database
- [ ] Implement authentication
- [ ] Connect application data to users
- [ ] Implement database security

### Phase 8 - Testing & MVP Release
- [ ] Functional testing
- [ ] Mobile device testing
- [ ] Fix defects
- [ ] UI cleanup
- [ ] Prepare MVP build

---

## Future Features

These features are intentionally excluded from the initial MVP:

- Barcode scanning
- AI food recognition
- Food photo analysis
- Apple Health integration
- Health Connect integration
- Smartwatch integration
- AI workout generation
- Social features
- Friend challenges
- Restaurant nutrition integration
- GPS workout tracking
- Meal planning
- Grocery lists
- Subscription features