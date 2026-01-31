'use server';

/**
 * @fileOverview A personalized workout recommendation AI agent.
 *
 * - getPersonalizedWorkoutRecommendations - A function that returns personalized workout recommendations.
 * - PersonalizedWorkoutRecommendationsInput - The input type for the getPersonalizedWorkoutRecommendations function.
 * - PersonalizedWorkoutRecommendationsOutput - The return type for the getPersonalizedWorkoutRecommendations function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { workouts } from '@/lib/data';

const PersonalizedWorkoutRecommendationsInputSchema = z.object({
  fitnessGoals: z
    .string()
    .describe('The fitness goals of the user, e.g., weight loss, muscle gain, general fitness.'),
  workoutHistory: z
    .string()
    .describe(
      'The workout history of the user, including types of workouts, frequency, duration, and intensity.'
    ),
  preferences: z
    .string()
    .describe(
      'The preferences of the user, including preferred workout types, equipment availability, and time constraints.'
    ),
});
export type PersonalizedWorkoutRecommendationsInput = z.infer<
  typeof PersonalizedWorkoutRecommendationsInputSchema
>;

const PromptInputSchema = PersonalizedWorkoutRecommendationsInputSchema.extend({
  availableWorkouts: z.string().describe('A JSON string of available workouts in the app library.')
});

const PersonalizedWorkoutRecommendationsOutputSchema = z.object({
  summary: z.string().describe('A short, motivating summary of the recommended workout plan.'),
  recommendations: z.array(z.object({
    title: z.string().describe('The title of the recommended workout.'),
    description: z.string().describe('A brief description of why this workout is recommended for the user.'),
    slug: z.string().optional().describe('The slug of a matching workout from the library, if available.'),
  })).describe('A list of personalized workout recommendations.'),
});
export type PersonalizedWorkoutRecommendationsOutput = z.infer<
  typeof PersonalizedWorkoutRecommendationsOutputSchema
>;

export async function getPersonalizedWorkoutRecommendations(
  input: PersonalizedWorkoutRecommendationsInput
): Promise<PersonalizedWorkoutRecommendationsOutput> {
  return personalizedWorkoutRecommendationsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'personalizedWorkoutRecommendationsPrompt',
  input: {schema: PromptInputSchema},
  output: {schema: PersonalizedWorkoutRecommendationsOutputSchema},
  prompt: `You are an expert personal trainer AI. Your task is to create a personalized workout plan based on the user's profile and a list of available workouts.

User Profile:
- Fitness Goals: {{{fitnessGoals}}}
- Workout History: {{{workoutHistory}}}
- Preferences: {{{preferences}}}

Here is a list of workouts available in the app's library:
{{{availableWorkouts}}}

**Analysis and Response Rules:**

1.  **New User Detection**: If the \`workoutHistory\` field is exactly "No recent workouts logged.", treat this as a new user.
    *   **Summary**: Your summary should be a short, welcoming message like "Welcome to ActiveLeap! Let's get you started on your fitness journey."
    *   **Recommendation**: Provide exactly one recommendation: the "Cardio Core Crusher" workout. The \`slug\` must be "cardio-core-crusher", the title must be "Cardio Core Crusher", and the description should be something like "This is a great beginner-friendly workout to get your heart pumping and build a strong core."

2.  **Existing User Analysis**: If the user has a workout history, analyze it along with their goals and preferences.
    *   **Summary**: Create a concise, motivating summary for the user based on your analysis.
    *   **Recommendations**: Provide a list of 1-2 recommended workouts.
        *   If you find a suitable workout from the provided library, use its exact title and \`slug\`.
        *   If no existing workout is a good fit, create a new custom workout suggestion (without a slug).
        *   **Adapt to Difficulty**: If the user consistently finds workouts 'hard', recommend easier alternatives ('Beginner' intensity). If they find them 'easy', suggest more challenging ones.
        *   **Prioritize Recovery**: If the history shows a high frequency of intense workouts (e.g., multiple 'Advanced' or 'HIIT' workouts in the last few days), prioritize suggesting a 'Stretching', 'Yoga', or 'Rehabilitation' workout and explain why recovery is important.

Your final output must match the required JSON schema.`,
});

const personalizedWorkoutRecommendationsFlow = ai.defineFlow(
  {
    name: 'personalizedWorkoutRecommendationsFlow',
    inputSchema: PersonalizedWorkoutRecommendationsInputSchema,
    outputSchema: PersonalizedWorkoutRecommendationsOutputSchema,
  },
  async input => {
    const workoutSummaries = workouts.map(w => ({
        slug: w.slug,
        title: w.title,
        category: w.category,
        intensity: w.intensity,
        duration: w.duration,
        equipment: w.equipment,
    }));

    const augmentedInput = {
        ...input,
        availableWorkouts: JSON.stringify(workoutSummaries, null, 2),
    };
    
    const {output} = await prompt(augmentedInput);
    return output!;
  }
);
