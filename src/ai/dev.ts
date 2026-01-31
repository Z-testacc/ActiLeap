'use server';
import { config } from 'dotenv';
config();

import '@/ai/flows/personalized-workout-recommendations.ts';
import '@/ai/flows/text-to-speech.ts';
import '@/ai/flows/workout-insights.ts';
