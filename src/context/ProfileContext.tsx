import {
  PropsWithChildren,
  createContext,
  useContext,
  useEffect,
  useState,
} from 'react';

import { supabase } from '../lib/supabase';

export type UserProfile = {
  id: string;
  displayName: string | null;
  dailyCalorieTarget: number;
  proteinTarget: number;
  carbTarget: number;
  fatTarget: number;
  currentWeight: number | null;
  goalWeight: number | null;
  heightInches: number | null;
  activityLevel: string | null;
  fitnessGoal: string | null;
  onboardingCompleted: boolean;
};

type NutritionTargets = {
  dailyCalorieTarget: number;
  proteinTarget: number;
  carbTarget: number;
  fatTarget: number;
};

type PersonalInfo = {
  displayName: string | null;
  currentWeight: number | null;
  heightInches: number | null;
};

type FitnessGoals = {
  goalWeight: number | null;
  activityLevel: string | null;
  fitnessGoal: string | null;
};

type ProfileContextType = {
  profile: UserProfile | null;
  loading: boolean;

  refreshProfile:
    () => Promise<void>;

  updateNutritionTargets: (
    targets: NutritionTargets
  ) => Promise<boolean>;

  updatePersonalInfo: (
    personalInfo: PersonalInfo
  ) => Promise<boolean>;

  updateFitnessGoals: (
    goals: FitnessGoals
  ) => Promise<boolean>;

  completeOnboarding:
    () => Promise<boolean>;
};

const ProfileContext =
  createContext<
    ProfileContextType | undefined
  >(undefined);

export function ProfileProvider({
  children,
}: PropsWithChildren) {
  const [profile, setProfile] =
    useState<UserProfile | null>(
      null
    );

  const [loading, setLoading] =
    useState(true);

  useEffect(() => {
    let mounted = true;

    async function initializeProfile() {
      setLoading(true);

      const {
        data: { session },
        error,
      } =
        await supabase.auth.getSession();

      if (!mounted) {
        return;
      }

      if (error) {
        console.error(
          'Error getting session:',
          error
        );

        setProfile(null);
        setLoading(false);

        return;
      }

      if (!session?.user?.id) {
        setProfile(null);
        setLoading(false);

        return;
      }

      await loadProfileForUser(
        session.user.id
      );
    }

    initializeProfile();

    const {
      data: { subscription },
    } =
      supabase.auth.onAuthStateChange(
        (_event, session) => {
          if (!mounted) {
            return;
          }

          if (!session?.user?.id) {
            setProfile(null);
            setLoading(false);

            return;
          }

          setProfile(null);
          setLoading(true);

          const userId =
            session.user.id;

          setTimeout(() => {
            if (!mounted) {
              return;
            }

            loadProfileForUser(
              userId
            );
          }, 0);
        }
      );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  async function loadProfileForUser(
    userId: string
  ) {
    setLoading(true);

    const {
      data: profileData,
      error,
    } = await supabase
      .from('profiles')
      .select('*')
      .eq(
        'id',
        userId
      )
      .maybeSingle();

    if (error) {
      console.error(
        'Error loading profile:',
        error
      );

      setProfile(null);
      setLoading(false);

      return;
    }

    if (!profileData) {
      const {
        error: insertError,
      } = await supabase
        .from('profiles')
        .insert({
          id: userId,
        });

      if (insertError) {
        console.error(
          'Error creating profile:',
          insertError
        );

        setProfile(null);
        setLoading(false);

        return;
      }

      await loadProfileForUser(
        userId
      );

      return;
    }

    const formattedProfile: UserProfile =
      {
        id: profileData.id,

        displayName:
          profileData.display_name ??
          null,

        dailyCalorieTarget:
          Number(
            profileData.daily_calorie_target
          ),

        proteinTarget:
          Number(
            profileData.protein_target
          ),

        carbTarget:
          Number(
            profileData.carb_target
          ),

        fatTarget:
          Number(
            profileData.fat_target
          ),

        currentWeight:
          profileData.current_weight ===
          null
            ? null
            : Number(
                profileData.current_weight
              ),

        goalWeight:
          profileData.goal_weight ===
          null
            ? null
            : Number(
                profileData.goal_weight
              ),

        heightInches:
          profileData.height_inches ===
          null
            ? null
            : Number(
                profileData.height_inches
              ),

        activityLevel:
          profileData.activity_level ??
          null,

        fitnessGoal:
          profileData.fitness_goal ??
          null,

        onboardingCompleted:
          Boolean(
            profileData.onboarding_completed
          ),
      };

    setProfile(
      formattedProfile
    );

    setLoading(false);
  }

  async function refreshProfile() {
    const {
      data: { session },
      error,
    } =
      await supabase.auth.getSession();

    if (
      error ||
      !session?.user?.id
    ) {
      if (error) {
        console.error(
          'Unable to refresh profile:',
          error
        );
      }

      setProfile(null);
      setLoading(false);

      return;
    }

    await loadProfileForUser(
      session.user.id
    );
  }

  async function updateNutritionTargets(
    targets: NutritionTargets
  ): Promise<boolean> {
    const {
      data: { session },
      error: sessionError,
    } =
      await supabase.auth.getSession();

    if (
      sessionError ||
      !session?.user?.id
    ) {
      console.error(
        'Unable to update nutrition targets:',
        sessionError
      );

      return false;
    }

    const { error } =
      await supabase
        .from('profiles')
        .update({
          daily_calorie_target:
            targets.dailyCalorieTarget,

          protein_target:
            targets.proteinTarget,

          carb_target:
            targets.carbTarget,

          fat_target:
            targets.fatTarget,

          updated_at:
            new Date().toISOString(),
        })
        .eq(
          'id',
          session.user.id
        );

    if (error) {
      console.error(
        'Error updating nutrition targets:',
        error
      );

      return false;
    }

    await loadProfileForUser(
      session.user.id
    );

    return true;
  }

  async function updatePersonalInfo(
    personalInfo: PersonalInfo
  ): Promise<boolean> {
    const {
      data: { session },
      error: sessionError,
    } =
      await supabase.auth.getSession();

    if (
      sessionError ||
      !session?.user?.id
    ) {
      console.error(
        'Unable to update personal information:',
        sessionError
      );

      return false;
    }

    const { error } =
      await supabase
        .from('profiles')
        .update({
          display_name:
            personalInfo.displayName,

          current_weight:
            personalInfo.currentWeight,

          height_inches:
            personalInfo.heightInches,

          updated_at:
            new Date().toISOString(),
        })
        .eq(
          'id',
          session.user.id
        );

    if (error) {
      console.error(
        'Error updating personal information:',
        error
      );

      return false;
    }

    await loadProfileForUser(
      session.user.id
    );

    return true;
  }

  async function updateFitnessGoals(
    goals: FitnessGoals
  ): Promise<boolean> {
    const {
      data: { session },
      error: sessionError,
    } =
      await supabase.auth.getSession();

    if (
      sessionError ||
      !session?.user?.id
    ) {
      console.error(
        'Unable to update fitness goals:',
        sessionError
      );

      return false;
    }

    const { error } =
      await supabase
        .from('profiles')
        .update({
          goal_weight:
            goals.goalWeight,

          activity_level:
            goals.activityLevel,

          fitness_goal:
            goals.fitnessGoal,

          updated_at:
            new Date().toISOString(),
        })
        .eq(
          'id',
          session.user.id
        );

    if (error) {
      console.error(
        'Error updating fitness goals:',
        error
      );

      return false;
    }

    await loadProfileForUser(
      session.user.id
    );

    return true;
  }

  async function completeOnboarding(): Promise<boolean> {
    const {
      data: { session },
      error: sessionError,
    } =
      await supabase.auth.getSession();

    if (
      sessionError ||
      !session?.user?.id
    ) {
      console.error(
        'Unable to complete onboarding:',
        sessionError
      );

      return false;
    }

    const { error } =
      await supabase
        .from('profiles')
        .update({
          onboarding_completed:
            true,

          updated_at:
            new Date().toISOString(),
        })
        .eq(
          'id',
          session.user.id
        );

    if (error) {
      console.error(
        'Error completing onboarding:',
        error
      );

      return false;
    }

    await loadProfileForUser(
      session.user.id
    );

    return true;
  }

  return (
    <ProfileContext.Provider
      value={{
        profile,
        loading,
        refreshProfile,
        updateNutritionTargets,
        updatePersonalInfo,
        updateFitnessGoals,
        completeOnboarding,
      }}
    >
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfile() {
  const context =
    useContext(ProfileContext);

  if (!context) {
    throw new Error(
      'useProfile must be used inside ProfileProvider'
    );
  }

  return context;
}