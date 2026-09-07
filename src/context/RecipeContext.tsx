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
};

type NutritionTotals = {
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
    data: { session },
    error,
  } =
    await supabase.auth.getSession();

  if (error) {
    console.error(
      'Unable to get current user:',
      error
    );

    return null;
  }

  return (
    session?.user?.id ??
    null
  );
}

function calculateIngredientTotals(
  ingredient: CalculatableIngredient
) {
  const quantity =
    Number(
      ingredient.quantity
    ) || 0;

  return {
    calories:
      (Number(
        ingredient.calories
      ) || 0) * quantity,

    protein:
      (Number(
        ingredient.protein
      ) || 0) * quantity,

    carbs:
      (Number(
        ingredient.carbs
      ) || 0) * quantity,

    fat:
      (Number(
        ingredient.fat
      ) || 0) * quantity,
  };
}

export function RecipeProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [
    recipes,
    setRecipes,
  ] = useState<Recipe[]>([]);

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
    setLoading(true);

    const userId =
      await getUserId();

    if (!userId) {
      setRecipes([]);
      setLoading(false);

      return;
    }

    const {
      data: recipeRows,
      error: recipeError,
    } = await supabase
      .from('recipes')
      .select(
        'id, name, description, instructions, servings, created_at, updated_at'
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

      setRecipes([]);
      setLoading(false);

      return;
    }

    if (
      !recipeRows ||
      recipeRows.length === 0
    ) {
      setRecipes([]);
      setLoading(false);

      return;
    }

    const recipeIds =
      recipeRows.map(
        (recipe) =>
          String(recipe.id)
      );

    const {
      data: ingredientRows,
      error: ingredientError,
    } = await supabase
      .from(
        'recipe_ingredients'
      )
      .select(
        'id, recipe_id, ingredient_name, calories, protein, carbs, fat, serving, quantity, ingredient_order'
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

    if (ingredientError) {
      console.error(
        'Error loading recipe ingredients:',
        ingredientError
      );

      setRecipes([]);
      setLoading(false);

      return;
    }

    const loadedRecipes:
      Recipe[] =
        recipeRows.map(
          (recipeRow) => {
            const recipeId =
              String(
                recipeRow.id
              );

            const ingredients:
              RecipeIngredient[] =
                (
                  ingredientRows ??
                  []
                )
                  .filter(
                    (
                      ingredient
                    ) =>
                      String(
                        ingredient.recipe_id
                      ) ===
                      recipeId
                  )
                  .map(
                    (
                      ingredient
                    ) => ({
                      id: String(
                        ingredient.id
                      ),

                      recipeId,

                      ingredientName:
                        String(
                          ingredient.ingredient_name ??
                            ''
                        ).trim(),

                      calories:
                        Number(
                          ingredient.calories
                        ) || 0,

                      protein:
                        Number(
                          ingredient.protein
                        ) || 0,

                      carbs:
                        Number(
                          ingredient.carbs
                        ) || 0,

                      fat:
                        Number(
                          ingredient.fat
                        ) || 0,

                      serving:
                        String(
                          ingredient.serving ??
                            ''
                        ).trim(),

                      quantity:
                        Number(
                          ingredient.quantity
                        ) || 1,

                      ingredientOrder:
                        Number(
                          ingredient.ingredient_order
                        ) || 0,
                    })
                  );

            return {
              id: recipeId,

              name: String(
                recipeRow.name ??
                  ''
              ).trim(),

              description:
                String(
                  recipeRow.description ??
                    ''
                ).trim(),

              instructions:
                String(
                  recipeRow.instructions ??
                    ''
                ).trim(),

              servings:
                Number(
                  recipeRow.servings
                ) || 1,

              createdAt:
                String(
                  recipeRow.created_at ??
                    ''
                ),

              updatedAt:
                String(
                  recipeRow.updated_at ??
                    ''
                ),

              ingredients,
            };
          }
        );

    setRecipes(
      loadedRecipes
    );

    setLoading(false);
  }

  async function loadCuratedRecipes() {
    setCuratedLoading(true);

    const userId =
      await getUserId();

    if (!userId) {
      setCuratedRecipes([]);
      setCuratedLoading(false);

      return;
    }

    const {
      data: recipeRows,
      error: recipeError,
    } = await supabase
      .from(
        'curated_recipes'
      )
      .select(
        'id, name, description, instructions, servings, category, image_url, is_featured, created_at, updated_at'
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

      setCuratedRecipes([]);
      setCuratedLoading(false);

      return;
    }

    if (
      !recipeRows ||
      recipeRows.length === 0
    ) {
      setCuratedRecipes([]);
      setCuratedLoading(false);

      return;
    }

    const recipeIds =
      recipeRows.map(
        (recipe) =>
          String(recipe.id)
      );

    const {
      data: ingredientRows,
      error: ingredientError,
    } = await supabase
      .from(
        'curated_recipe_ingredients'
      )
      .select(
        'id, recipe_id, ingredient_name, calories, protein, carbs, fat, serving, quantity, ingredient_order'
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

    if (ingredientError) {
      console.error(
        'Error loading curated recipe ingredients:',
        ingredientError
      );

      setCuratedRecipes([]);
      setCuratedLoading(false);

      return;
    }

    const loadedRecipes:
      CuratedRecipe[] =
        recipeRows.map(
          (recipeRow) => {
            const recipeId =
              String(
                recipeRow.id
              );

            const ingredients:
              CuratedRecipeIngredient[] =
                (
                  ingredientRows ??
                  []
                )
                  .filter(
                    (
                      ingredient
                    ) =>
                      String(
                        ingredient.recipe_id
                      ) ===
                      recipeId
                  )
                  .map(
                    (
                      ingredient
                    ) => ({
                      id: String(
                        ingredient.id
                      ),

                      recipeId,

                      ingredientName:
                        String(
                          ingredient.ingredient_name ??
                            ''
                        ).trim(),

                      calories:
                        Number(
                          ingredient.calories
                        ) || 0,

                      protein:
                        Number(
                          ingredient.protein
                        ) || 0,

                      carbs:
                        Number(
                          ingredient.carbs
                        ) || 0,

                      fat:
                        Number(
                          ingredient.fat
                        ) || 0,

                      serving:
                        String(
                          ingredient.serving ??
                            ''
                        ).trim(),

                      quantity:
                        Number(
                          ingredient.quantity
                        ) || 1,

                      ingredientOrder:
                        Number(
                          ingredient.ingredient_order
                        ) || 0,
                    })
                  );

            return {
              id: recipeId,

              name: String(
                recipeRow.name ??
                  ''
              ).trim(),

              description:
                String(
                  recipeRow.description ??
                    ''
                ).trim(),

              instructions:
                String(
                  recipeRow.instructions ??
                    ''
                ).trim(),

              servings:
                Number(
                  recipeRow.servings
                ) || 1,

              category:
                String(
                  recipeRow.category ??
                    ''
                ).trim(),

              imageUrl:
                String(
                  recipeRow.image_url ??
                    ''
                ).trim(),

              isFeatured:
                Boolean(
                  recipeRow.is_featured
                ),

              createdAt:
                String(
                  recipeRow.created_at ??
                    ''
                ),

              updatedAt:
                String(
                  recipeRow.updated_at ??
                    ''
                ),

              ingredients,
            };
          }
        );

    setCuratedRecipes(
      loadedRecipes
    );

    setCuratedLoading(false);
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

    const trimmedName =
      recipe.name.trim();

    if (!trimmedName) {
      return null;
    }

    const servings =
      Number(
        recipe.servings
      );

    if (
      !Number.isFinite(
        servings
      ) ||
      servings <= 0
    ) {
      return null;
    }

    const {
      data: createdRecipe,
      error: recipeError,
    } = await supabase
      .from('recipes')
      .insert({
        user_id: userId,
        name: trimmedName,
        description:
          recipe.description.trim(),
        instructions:
          recipe.instructions.trim(),
        servings,
      })
      .select('id')
      .single();

    if (
      recipeError ||
      !createdRecipe
    ) {
      console.error(
        'Error creating recipe:',
        recipeError
      );

      return null;
    }

    const recipeId =
      String(
        createdRecipe.id
      );

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
              Number(
                ingredient.calories
              ) || 0,
            protein:
              Number(
                ingredient.protein
              ) || 0,
            carbs:
              Number(
                ingredient.carbs
              ) || 0,
            fat:
              Number(
                ingredient.fat
              ) || 0,
            serving:
              ingredient.serving.trim(),
            quantity:
              Number(
                ingredient.quantity
              ) || 1,
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
            recipeId
          )
          .eq(
            'user_id',
            userId
          );

        return null;
      }
    }

    await loadRecipesForUser();

    return recipeId;
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

    const trimmedName =
      recipe.name.trim();

    if (!trimmedName) {
      return false;
    }

    const servings =
      Number(
        recipe.servings
      );

    if (
      !Number.isFinite(
        servings
      ) ||
      servings <= 0
    ) {
      return false;
    }

    const {
      error: recipeError,
    } = await supabase
      .from('recipes')
      .update({
        name: trimmedName,
        description:
          recipe.description.trim(),
        instructions:
          recipe.instructions.trim(),
        servings,
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
      error:
        deleteIngredientsError,
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

    if (
      deleteIngredientsError
    ) {
      console.error(
        'Error replacing recipe ingredients:',
        deleteIngredientsError
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
              Number(
                ingredient.calories
              ) || 0,
            protein:
              Number(
                ingredient.protein
              ) || 0,
            carbs:
              Number(
                ingredient.carbs
              ) || 0,
            fat:
              Number(
                ingredient.fat
              ) || 0,
            serving:
              ingredient.serving.trim(),
            quantity:
              Number(
                ingredient.quantity
              ) || 1,
            ingredient_order:
              index,
          })
        );

      const {
        error:
          ingredientInsertError,
      } = await supabase
        .from(
          'recipe_ingredients'
        )
        .insert(
          ingredientRows
        );

      if (
        ingredientInsertError
      ) {
        console.error(
          'Error saving updated recipe ingredients:',
          ingredientInsertError
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
      (current) =>
        current.filter(
          (recipe) =>
            recipe.id !==
            recipeId
        )
    );

    return true;
  }

  async function saveCuratedRecipeToMyRecipes(
    curatedRecipeId: string
  ) {
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

    const newRecipe:
      NewRecipe = {
        name:
          curatedRecipe.name,

        description:
          curatedRecipe.description,

        instructions:
          curatedRecipe.instructions,

        servings:
          curatedRecipe.servings,

        ingredients:
          curatedRecipe.ingredients.map(
            (ingredient) => ({
              ingredientName:
                ingredient.ingredientName,

              calories:
                ingredient.calories,

              protein:
                ingredient.protein,

              carbs:
                ingredient.carbs,

              fat:
                ingredient.fat,

              serving:
                ingredient.serving,

              quantity:
                ingredient.quantity,
            })
          ),
      };

    return await createRecipe(
      newRecipe
    );
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
    recipe:
      | Recipe
      | NewRecipe
      | CuratedRecipe
  ) {
    const calculatableRecipe =
      recipe as CalculatableRecipe;

    const totals =
      calculatableRecipe.ingredients.reduce(
        (
          current,
          ingredient
        ) => {
          const ingredientTotals =
            calculateIngredientTotals(
              ingredient
            );

          return {
            calories:
              current.calories +
              ingredientTotals.calories,

            protein:
              current.protein +
              ingredientTotals.protein,

            carbs:
              current.carbs +
              ingredientTotals.carbs,

            fat:
              current.fat +
              ingredientTotals.fat,
          };
        },
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
    recipe:
      | Recipe
      | NewRecipe
      | CuratedRecipe
  ) {
    const totals =
      calculateRecipeTotals(
        recipe
      );

    const servings =
      Number(
        recipe.servings
      ) || 1;

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
        () => {
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