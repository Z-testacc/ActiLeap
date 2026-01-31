'use server';

import { getWorkoutInsights, type WorkoutInsightsOutput } from '@/ai/flows/workout-insights';
import type { WorkoutLog } from '@/lib/types';
import { z } from 'zod';

const WorkoutLogsSchema = z.array(z.any());

export async function getSmartInsightsAction(
  logs: WorkoutLog[]
): Promise<WorkoutInsightsOutput | { error: string }> {
  const parsedInput = WorkoutLogsSchema.safeParse(logs);

  if (!parsedInput.success) {
    return { error: 'Invalid input.' };
  }

  if (logs.length < 5) {
    return { insights: [] };
  }

  try {
    const result = await getWorkoutInsights(parsedInput.data);
    return result;
  } catch (e) {
    console.error(e);
    return { error: 'Failed to get insights. Please try again.' };
  }
}
