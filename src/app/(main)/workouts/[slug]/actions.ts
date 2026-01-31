'use server';

import { textToSpeech } from '@/ai/flows/text-to-speech';
import { z } from 'zod';

const SpeechRequestSchema = z.object({
  text: z.string().min(1),
  language: z.string().min(1),
});

export async function getSpeechAction(
  text: string,
  language: string,
): Promise<{ audioUrl?: string; error?: string }> {
  const parsedInput = SpeechRequestSchema.safeParse({ text, language });

  if (!parsedInput.success) {
    return { error: 'Invalid input.' };
  }

  try {
    const audioUrl = await textToSpeech(parsedInput.data.text, parsedInput.data.language);
    return { audioUrl };
  } catch (e) {
    console.error(e);
    return { error: 'Failed to generate speech. Please try again.' };
  }
}
