'use server';

/**
 * @fileOverview A workout insights AI agent.
 *
 * - getWorkoutInsights - A function that returns smart insights based on workout history.
 * - WorkoutInsightsInput - The input type for the getWorkoutInsights function.
 * - WorkoutInsightsOutput - The return type for the getWorkoutInsights function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import type { WorkoutLog } from '@/lib/types';

const WorkoutInsightsInputSchema = z.object({
  workoutHistory: z
    .string()
    .describe(
      'A JSON string of the user\'s workout history. Each log includes date, title, duration, calories, and a list of exercises with sets, reps, and weight.'
    ),
});
export type WorkoutInsightsInput = z.infer<typeof WorkoutInsightsInputSchema>;

const WorkoutInsightsOutputSchema = z.object({
  insights: z
    .array(
      z.object({
        title: z.string().describe('A short, catchy title for the insight.'),
        description: z
          .string()
          .describe(
            'A detailed description of the observation (e.g., a detected plateau in a specific exercise).'
          ),
        recommendation: z
          .string()
          .describe(
            'An actionable recommendation for the user (e.g., "Try increasing the weight by 5% on your next session.").'
          ),
      })
    )
    .describe('A list of smart insights and recommendations.'),
});
export type WorkoutInsightsOutput = z.infer<typeof WorkoutInsightsOutputSchema>;

export async function getWorkoutInsights(
  input: WorkoutLog[]
): Promise<WorkoutInsightsOutput> {
  // Sanitize logs to avoid sending excessively large data
  const sanitizedLogs = input.map(log => ({
    date: log.date,
    workoutTitle: log.workoutTitle,
    duration: log.duration,
    calories: log.calories,
    exercises: log.exercises?.map(e => ({
        name: e.name,
        sets: e.sets,
        reps: e.reps,
        weight: e.weight
    }))
  }));

  const flowInput = {
    workoutHistory: JSON.stringify(sanitizedLogs, null, 2),
  };
  return workoutInsightsFlow(flowInput);
}

const prompt = ai.definePrompt({
  name: 'workoutInsightsPrompt',
  input: { schema: WorkoutInsightsInputSchema },
  output: { schema: WorkoutInsightsOutputSchema },
  prompt: `You are an expert fitness analyst AI. Your task is to analyze a user's workout history and provide smart insights and actionable recommendations.

User's Workout History (JSON format):
{{{workoutHistory}}}

Analyze the user's workout history with these goals in mind:
1.  **Detect Plateaus**: Identify if the user's strength progression (weight, reps, or volume) for specific exercises has stalled for 2 or more weeks.
2.  **Provide Recommendations**: Based on your analysis, provide concrete, actionable advice. For example, if you detect a plateau, suggest a specific change like "Increase weight by 5%," "Try a different exercise," or "Switch to HIIT for variety."
3.  **Identify Positive Trends**: Acknowledge progress and consistency to motivate the user.
4.  **Keep it Concise**: Generate a maximum of 2-3 of the most important insights. If there are no significant trends or plateaus, you can return an empty array.

Generate a list of insights. Each insight must have a clear title, a description of what you observed, and a specific recommendation.`,
});

const workoutInsightsFlow = ai.defineFlow(
  {
    name: 'workoutInsightsFlow',
    inputSchema: WorkoutInsightsInputSchema,
    outputSchema: WorkoutInsightsOutputSchema,
  },
  async input => {
    const { output } = await prompt(input);
    return output!;
  }
);
