'use server';

import {
  getPersonalizedWorkoutRecommendations,
  type PersonalizedWorkoutRecommendationsInput,
  type PersonalizedWorkoutRecommendationsOutput,
} from '@/ai/flows/personalized-workout-recommendations';
import { z } from 'zod';

const PersonalizedWorkoutRecommendationsInputSchema = z.object({
  fitnessGoals: z.string(),
  workoutHistory: z.string(),
  preferences: z.string(),
});

export async function getRecommendationsAction(
  input: PersonalizedWorkoutRecommendationsInput
): Promise<PersonalizedWorkoutRecommendationsOutput | { error: string }> {
  const parsedInput = PersonalizedWorkoutRecommendationsInputSchema.safeParse(input);

  if (!parsedInput.success) {
    return { error: 'Invalid input.' };
  }

  try {
    const result = await getPersonalizedWorkoutRecommendations(parsedInput.data);
    return result;
  } catch (e) {
    console.error(e);
    return { error: 'Failed to get recommendations. Please try again.' };
  }
}
