import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from 'react';

import { supabase } from '../lib/supabase';

export type RecipeIngredient = {
  id: string;
  recipeId: string;
  ingredientName: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  serving: string;
  quantity: number;
  ingredientOrder: number;
};

export type Recipe = {
  id: string;
  name: string;
  description: string;
  instructions: string;
  servings: number;
  sourceCuratedRecipeId: string | null;
  createdAt: string;
  updatedAt: string;
  ingredients: RecipeIngredient[];
};

export type CuratedRecipeIngredient = {
  id: string;
  recipeId: string;
  ingredientName: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  serving: string;
  quantity: number;
  ingredientOrder: number;
};

export type CuratedRecipe = {
  id: string;
  name: string;
  description: string;
  instructions: string;
  servings: number;
  category: string;
  imageUrl: string;
  isFeatured: boolean;
  createdAt: string;
  updatedAt: string;
  ingredients: CuratedRecipeIngredient[];
};

export type NewRecipeIngredient = {
  ingredientName: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  serving: string;
  quantity: number;
};

export type NewRecipe = {
  name: string;
  description: string;
  instructions: string;
  servings: number;
  ingredients: NewRecipeIngredient[];
  sourceCuratedRecipeId?: string | null;
};

export type NutritionTotals = {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
};

type CalculatableIngredient = {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  quantity: number;
};

type CalculatableRecipe = {
  servings: number;
  ingredients: CalculatableIngredient[];
};

type RecipeContextType = {
  recipes: Recipe[];
  curatedRecipes: CuratedRecipe[];

  loading: boolean;
  curatedLoading: boolean;

  refreshRecipes: () => Promise<void>;
  refreshCuratedRecipes: () => Promise<void>;
  refreshAllRecipes: () => Promise<void>;

  createRecipe: (
    recipe: NewRecipe
  ) => Promise<string | null>;

  updateRecipe: (
    recipeId: string,
    recipe: NewRecipe
  ) => Promise<boolean>;

  deleteRecipe: (
    recipeId: string
  ) => Promise<boolean>;

  saveCuratedRecipeToMyRecipes: (
    curatedRecipeId: string
  ) => Promise<string | null>;

  isCuratedRecipeSaved: (
    curatedRecipeId: string
  ) => boolean;

  getRecipeById: (
    recipeId: string
  ) => Recipe | undefined;

  getCuratedRecipeById: (
    recipeId: string
  ) => CuratedRecipe | undefined;

  calculateRecipeTotals: (
    recipe:
      | Recipe
      | NewRecipe
      | CuratedRecipe
  ) => NutritionTotals;

  calculatePerServing: (
    recipe:
      | Recipe
      | NewRecipe
      | CuratedRecipe
  ) => NutritionTotals;
};

const RecipeContext =
  createContext<
    RecipeContextType | undefined
  >(undefined);

function roundNutrition(
  value: number
) {
  return (
    Math.round(value * 10) /
    10
  );
}

async function getUserId() {
  const {
    data: {
      session,
    },
  } =
    await supabase.auth.getSession();

  return (
    session?.user.id ??
    null
  );
}

export function RecipeProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [
    recipes,
    setRecipes,
  ] = useState<Recipe[]>(
    []
  );

  const [
    curatedRecipes,
    setCuratedRecipes,
  ] = useState<
    CuratedRecipe[]
  >([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    curatedLoading,
    setCuratedLoading,
  ] = useState(true);

  async function loadRecipesForUser() {
    const userId =
      await getUserId();

    if (!userId) {
      setRecipes([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    const {
      data: recipeRows,
      error: recipeError,
    } = await supabase
      .from('recipes')
      .select(
        `
        id,
        name,
        description,
        instructions,
        servings,
        source_curated_recipe_id,
        created_at,
        updated_at
        `
      )
      .eq(
        'user_id',
        userId
      )
      .order(
        'created_at',
        {
          ascending: false,
        }
      );

    if (recipeError) {
      console.error(
        'Error loading recipes:',
        recipeError
      );

      setLoading(false);
      return;
    }

    const recipeIds =
      (recipeRows ?? []).map(
        (recipe) =>
          recipe.id
      );

    let ingredientRows:
      | any[]
      | null = [];

    if (
      recipeIds.length > 0
    ) {
      const {
        data,
        error,
      } = await supabase
        .from(
          'recipe_ingredients'
        )
        .select(
          `
          id,
          recipe_id,
          ingredient_name,
          calories,
          protein,
          carbs,
          fat,
          serving,
          quantity,
          ingredient_order
          `
        )
        .eq(
          'user_id',
          userId
        )
        .in(
          'recipe_id',
          recipeIds
        )
        .order(
          'ingredient_order',
          {
            ascending: true,
          }
        );

      if (error) {
        console.error(
          'Error loading recipe ingredients:',
          error
        );

        setLoading(false);
        return;
      }

      ingredientRows =
        data ?? [];
    }

    const mappedRecipes: Recipe[] =
      (recipeRows ?? []).map(
        (recipeRow) => ({
          id:
            recipeRow.id,

          name:
            recipeRow.name,

          description:
            recipeRow.description ??
            '',

          instructions:
            recipeRow.instructions ??
            '',

          servings:
            Number(
              recipeRow.servings ??
                1
            ),

          sourceCuratedRecipeId:
            recipeRow.source_curated_recipe_id
              ? String(
                  recipeRow.source_curated_recipe_id
                )
              : null,

          createdAt:
            recipeRow.created_at,

          updatedAt:
            recipeRow.updated_at,

          ingredients:
            (
              ingredientRows ??
              []
            )
              .filter(
                (
                  ingredientRow
                ) =>
                  ingredientRow.recipe_id ===
                  recipeRow.id
              )
              .map(
                (
                  ingredientRow
                ) => ({
                  id:
                    ingredientRow.id,

                  recipeId:
                    ingredientRow.recipe_id,

                  ingredientName:
                    ingredientRow.ingredient_name,

                  calories:
                    Number(
                      ingredientRow.calories ??
                        0
                    ),

                  protein:
                    Number(
                      ingredientRow.protein ??
                        0
                    ),

                  carbs:
                    Number(
                      ingredientRow.carbs ??
                        0
                    ),

                  fat:
                    Number(
                      ingredientRow.fat ??
                        0
                    ),

                  serving:
                    ingredientRow.serving ??
                    '',

                  quantity:
                    Number(
                      ingredientRow.quantity ??
                        1
                    ),

                  ingredientOrder:
                    Number(
                      ingredientRow.ingredient_order ??
                        0
                    ),
                })
              ),
        })
      );

    setRecipes(
      mappedRecipes
    );

    setLoading(false);
  }

  async function loadCuratedRecipes() {
    setCuratedLoading(
      true
    );

    const {
      data: recipeRows,
      error: recipeError,
    } = await supabase
      .from(
        'curated_recipes'
      )
      .select(
        `
        id,
        name,
        description,
        instructions,
        servings,
        category,
        image_url,
        is_featured,
        created_at,
        updated_at
        `
      )
      .order(
        'is_featured',
        {
          ascending: false,
        }
      )
      .order(
        'created_at',
        {
          ascending: false,
        }
      );

    if (recipeError) {
      console.error(
        'Error loading curated recipes:',
        recipeError
      );

      setCuratedLoading(
        false
      );

      return;
    }

    const curatedIds =
      (recipeRows ?? []).map(
        (recipe) =>
          recipe.id
      );

    let ingredientRows:
      | any[]
      | null = [];

    if (
      curatedIds.length > 0
    ) {
      const {
        data,
        error,
      } = await supabase
        .from(
          'curated_recipe_ingredients'
        )
        .select(
          `
          id,
          recipe_id,
          ingredient_name,
          calories,
          protein,
          carbs,
          fat,
          serving,
          quantity,
          ingredient_order
          `
        )
        .in(
          'recipe_id',
          curatedIds
        )
        .order(
          'ingredient_order',
          {
            ascending: true,
          }
        );

      if (error) {
        console.error(
          'Error loading curated recipe ingredients:',
          error
        );

        setCuratedLoading(
          false
        );

        return;
      }

      ingredientRows =
        data ?? [];
    }

    const mappedRecipes:
      CuratedRecipe[] =
      (recipeRows ?? []).map(
        (recipeRow) => ({
          id:
            recipeRow.id,

          name:
            recipeRow.name,

          description:
            recipeRow.description ??
            '',

          instructions:
            recipeRow.instructions ??
            '',

          servings:
            Number(
              recipeRow.servings ??
                1
            ),

          category:
            recipeRow.category ??
            '',

          imageUrl:
            recipeRow.image_url ??
            '',

          isFeatured:
            Boolean(
              recipeRow.is_featured
            ),

          createdAt:
            recipeRow.created_at,

          updatedAt:
            recipeRow.updated_at,

          ingredients:
            (
              ingredientRows ??
              []
            )
              .filter(
                (
                  ingredientRow
                ) =>
                  ingredientRow.recipe_id ===
                  recipeRow.id
              )
              .map(
                (
                  ingredientRow
                ) => ({
                  id:
                    ingredientRow.id,

                  recipeId:
                    ingredientRow.recipe_id,

                  ingredientName:
                    ingredientRow.ingredient_name,

                  calories:
                    Number(
                      ingredientRow.calories ??
                        0
                    ),

                  protein:
                    Number(
                      ingredientRow.protein ??
                        0
                    ),

                  carbs:
                    Number(
                      ingredientRow.carbs ??
                        0
                    ),

                  fat:
                    Number(
                      ingredientRow.fat ??
                        0
                    ),

                  serving:
                    ingredientRow.serving ??
                    '',

                  quantity:
                    Number(
                      ingredientRow.quantity ??
                        1
                    ),

                  ingredientOrder:
                    Number(
                      ingredientRow.ingredient_order ??
                        0
                    ),
                })
              ),
        })
      );

    setCuratedRecipes(
      mappedRecipes
    );

    setCuratedLoading(
      false
    );
  }

  async function refreshRecipes() {
    await loadRecipesForUser();
  }

  async function refreshCuratedRecipes() {
    await loadCuratedRecipes();
  }

  async function refreshAllRecipes() {
    await Promise.all([
      loadRecipesForUser(),
      loadCuratedRecipes(),
    ]);
  }

  async function createRecipe(
    recipe: NewRecipe
  ) {
    const userId =
      await getUserId();

    if (!userId) {
      return null;
    }

    if (
      !recipe.name.trim() ||
      recipe.servings <= 0
    ) {
      return null;
    }

    const {
      data: recipeRow,
      error: recipeError,
    } = await supabase
      .from('recipes')
      .insert({
        user_id:
          userId,

        name:
          recipe.name.trim(),

        description:
          recipe.description.trim(),

        instructions:
          recipe.instructions.trim(),

        servings:
          recipe.servings,

        source_curated_recipe_id:
          recipe.sourceCuratedRecipeId ??
          null,

        updated_at:
          new Date().toISOString(),
      })
      .select('id')
      .single();

    if (recipeError) {
      console.error(
        'Error creating recipe:',
        recipeError
      );

      return null;
    }

    if (!recipeRow) {
      return null;
    }

    if (
      recipe.ingredients.length >
      0
    ) {
      const ingredientRows =
        recipe.ingredients.map(
          (
            ingredient,
            index
          ) => ({
            recipe_id:
              recipeRow.id,

            user_id:
              userId,

            ingredient_name:
              ingredient.ingredientName.trim(),

            calories:
              ingredient.calories,

            protein:
              ingredient.protein,

            carbs:
              ingredient.carbs,

            fat:
              ingredient.fat,

            serving:
              ingredient.serving.trim(),

            quantity:
              ingredient.quantity,

            ingredient_order:
              index,
          })
        );

      const {
        error:
          ingredientError,
      } = await supabase
        .from(
          'recipe_ingredients'
        )
        .insert(
          ingredientRows
        );

      if (ingredientError) {
        console.error(
          'Error creating recipe ingredients:',
          ingredientError
        );

        await supabase
          .from('recipes')
          .delete()
          .eq(
            'id',
            recipeRow.id
          )
          .eq(
            'user_id',
            userId
          );

        return null;
      }
    }

    await loadRecipesForUser();

    return recipeRow.id;
  }

  async function updateRecipe(
    recipeId: string,
    recipe: NewRecipe
  ) {
    const userId =
      await getUserId();

    if (!userId) {
      return false;
    }

    if (
      !recipe.name.trim() ||
      recipe.servings <= 0
    ) {
      return false;
    }

    /*
      Do NOT update
      source_curated_recipe_id here.

      A saved Apollo recipe should
      retain its origin even after
      the user edits their personal
      copy.
    */

    const {
      error: recipeError,
    } = await supabase
      .from('recipes')
      .update({
        name:
          recipe.name.trim(),

        description:
          recipe.description.trim(),

        instructions:
          recipe.instructions.trim(),

        servings:
          recipe.servings,

        updated_at:
          new Date().toISOString(),
      })
      .eq(
        'id',
        recipeId
      )
      .eq(
        'user_id',
        userId
      );

    if (recipeError) {
      console.error(
        'Error updating recipe:',
        recipeError
      );

      return false;
    }

    const {
      error: deleteError,
    } = await supabase
      .from(
        'recipe_ingredients'
      )
      .delete()
      .eq(
        'recipe_id',
        recipeId
      )
      .eq(
        'user_id',
        userId
      );

    if (deleteError) {
      console.error(
        'Error replacing recipe ingredients:',
        deleteError
      );

      return false;
    }

    if (
      recipe.ingredients.length >
      0
    ) {
      const ingredientRows =
        recipe.ingredients.map(
          (
            ingredient,
            index
          ) => ({
            recipe_id:
              recipeId,

            user_id:
              userId,

            ingredient_name:
              ingredient.ingredientName.trim(),

            calories:
              ingredient.calories,

            protein:
              ingredient.protein,

            carbs:
              ingredient.carbs,

            fat:
              ingredient.fat,

            serving:
              ingredient.serving.trim(),

            quantity:
              ingredient.quantity,

            ingredient_order:
              index,
          })
        );

      const {
        error:
          ingredientError,
      } = await supabase
        .from(
          'recipe_ingredients'
        )
        .insert(
          ingredientRows
        );

      if (ingredientError) {
        console.error(
          'Error adding updated recipe ingredients:',
          ingredientError
        );

        return false;
      }
    }

    await loadRecipesForUser();

    return true;
  }

  async function deleteRecipe(
    recipeId: string
  ) {
    const userId =
      await getUserId();

    if (!userId) {
      return false;
    }

    const {
      error,
    } = await supabase
      .from('recipes')
      .delete()
      .eq(
        'id',
        recipeId
      )
      .eq(
        'user_id',
        userId
      );

    if (error) {
      console.error(
        'Error deleting recipe:',
        error
      );

      return false;
    }

    setRecipes(
      (currentRecipes) =>
        currentRecipes.filter(
          (recipe) =>
            recipe.id !==
            recipeId
        )
    );

    return true;
  }

  function isCuratedRecipeSaved(
    curatedRecipeId: string
  ) {
    return recipes.some(
      (recipe) =>
        recipe.sourceCuratedRecipeId ===
        curatedRecipeId
    );
  }

  async function findSavedCuratedRecipe(
    userId: string,
    curatedRecipeId: string
  ) {
    const {
      data,
      error,
    } = await supabase
      .from('recipes')
      .select('id')
      .eq(
        'user_id',
        userId
      )
      .eq(
        'source_curated_recipe_id',
        curatedRecipeId
      )
      .maybeSingle();

    if (error) {
      console.error(
        'Error checking saved Apollo recipe:',
        error
      );

      return null;
    }

    return data?.id ?? null;
  }

  async function saveCuratedRecipeToMyRecipes(
    curatedRecipeId: string
  ) {
    const userId =
      await getUserId();

    if (!userId) {
      return null;
    }

    /*
      Fast local check.
    */

    const localExisting =
      recipes.find(
        (recipe) =>
          recipe.sourceCuratedRecipeId ===
          curatedRecipeId
      );

    if (localExisting) {
      return localExisting.id;
    }

    /*
      Persistent database check.

      This protects against stale
      local state and app restarts.
    */

    const databaseExisting =
      await findSavedCuratedRecipe(
        userId,
        curatedRecipeId
      );

    if (databaseExisting) {
      await loadRecipesForUser();

      return databaseExisting;
    }

    const curatedRecipe =
      curatedRecipes.find(
        (recipe) =>
          recipe.id ===
          curatedRecipeId
      );

    if (!curatedRecipe) {
      console.error(
        'Curated recipe not found:',
        curatedRecipeId
      );

      return null;
    }

    const {
      data: recipeRow,
      error: recipeError,
    } = await supabase
      .from('recipes')
      .insert({
        user_id:
          userId,

        name:
          curatedRecipe.name.trim(),

        description:
          curatedRecipe.description.trim(),

        instructions:
          curatedRecipe.instructions.trim(),

        servings:
          curatedRecipe.servings,

        source_curated_recipe_id:
          curatedRecipe.id,

        updated_at:
          new Date().toISOString(),
      })
      .select('id')
      .single();

    if (recipeError) {
      /*
        PostgreSQL 23505 =
        unique violation.

        If two save attempts happen
        at nearly the same time, the
        unique database index blocks
        the duplicate. We simply find
        and return the existing copy.
      */

      if (
        recipeError.code ===
        '23505'
      ) {
        const existingId =
          await findSavedCuratedRecipe(
            userId,
            curatedRecipeId
          );

        await loadRecipesForUser();

        return existingId;
      }

      console.error(
        'Error saving Apollo recipe:',
        recipeError
      );

      return null;
    }

    if (!recipeRow) {
      return null;
    }

    if (
      curatedRecipe.ingredients.length >
      0
    ) {
      const ingredientRows =
        curatedRecipe.ingredients.map(
          (
            ingredient,
            index
          ) => ({
            recipe_id:
              recipeRow.id,

            user_id:
              userId,

            ingredient_name:
              ingredient.ingredientName.trim(),

            calories:
              ingredient.calories,

            protein:
              ingredient.protein,

            carbs:
              ingredient.carbs,

            fat:
              ingredient.fat,

            serving:
              ingredient.serving.trim(),

            quantity:
              ingredient.quantity,

            ingredient_order:
              index,
          })
        );

      const {
        error:
          ingredientError,
      } = await supabase
        .from(
          'recipe_ingredients'
        )
        .insert(
          ingredientRows
        );

      if (ingredientError) {
        console.error(
          'Error saving Apollo recipe ingredients:',
          ingredientError
        );

        await supabase
          .from('recipes')
          .delete()
          .eq(
            'id',
            recipeRow.id
          )
          .eq(
            'user_id',
            userId
          );

        return null;
      }
    }

    await loadRecipesForUser();

    return recipeRow.id;
  }

  function getRecipeById(
    recipeId: string
  ) {
    return recipes.find(
      (recipe) =>
        recipe.id ===
        recipeId
    );
  }

  function getCuratedRecipeById(
    recipeId: string
  ) {
    return curatedRecipes.find(
      (recipe) =>
        recipe.id ===
        recipeId
    );
  }

  function calculateRecipeTotals(
    recipe: CalculatableRecipe
  ): NutritionTotals {
    const totals =
      recipe.ingredients.reduce(
        (
          currentTotals,
          ingredient
        ) => ({
          calories:
            currentTotals.calories +
            ingredient.calories *
              ingredient.quantity,

          protein:
            currentTotals.protein +
            ingredient.protein *
              ingredient.quantity,

          carbs:
            currentTotals.carbs +
            ingredient.carbs *
              ingredient.quantity,

          fat:
            currentTotals.fat +
            ingredient.fat *
              ingredient.quantity,
        }),
        {
          calories: 0,
          protein: 0,
          carbs: 0,
          fat: 0,
        }
      );

    return {
      calories:
        roundNutrition(
          totals.calories
        ),

      protein:
        roundNutrition(
          totals.protein
        ),

      carbs:
        roundNutrition(
          totals.carbs
        ),

      fat:
        roundNutrition(
          totals.fat
        ),
    };
  }

  function calculatePerServing(
    recipe: CalculatableRecipe
  ): NutritionTotals {
    const totals =
      calculateRecipeTotals(
        recipe
      );

    const servings =
      recipe.servings > 0
        ? recipe.servings
        : 1;

    return {
      calories:
        roundNutrition(
          totals.calories /
            servings
        ),

      protein:
        roundNutrition(
          totals.protein /
            servings
        ),

      carbs:
        roundNutrition(
          totals.carbs /
            servings
        ),

      fat:
        roundNutrition(
          totals.fat /
            servings
        ),
    };
  }

  useEffect(() => {
    refreshAllRecipes();

    const {
      data: {
        subscription,
      },
    } =
      supabase.auth.onAuthStateChange(
        (_event, session) => {
          if (
            !session?.user
          ) {
            setRecipes([]);
            setCuratedRecipes(
              []
            );
            setLoading(false);
            setCuratedLoading(
              false
            );
            return;
          }

          setTimeout(() => {
            refreshAllRecipes();
          }, 0);
        }
      );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return (
    <RecipeContext.Provider
      value={{
        recipes,
        curatedRecipes,

        loading,
        curatedLoading,

        refreshRecipes,
        refreshCuratedRecipes,
        refreshAllRecipes,

        createRecipe,
        updateRecipe,
        deleteRecipe,

        saveCuratedRecipeToMyRecipes,
        isCuratedRecipeSaved,

        getRecipeById,
        getCuratedRecipeById,

        calculateRecipeTotals,
        calculatePerServing,
      }}
    >
      {children}
    </RecipeContext.Provider>
  );
}

export function useRecipes() {
  const context =
    useContext(
      RecipeContext
    );

  if (!context) {
    throw new Error(
      'useRecipes must be used inside RecipeProvider'
    );
  }

  return context;
}