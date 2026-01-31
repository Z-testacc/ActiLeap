'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { getRecommendationsAction } from './actions';
import type { PersonalizedWorkoutRecommendationsOutput } from '@/ai/flows/personalized-workout-recommendations';
import { Bot, Loader2, Zap } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { useFirestore, useCollection } from '@/firebase';
import {
  collection,
  query,
  orderBy,
  limit,
  Timestamp,
} from 'firebase/firestore';
import type { WorkoutLog } from '@/lib/types';

const formSchema = z.object({
  fitnessGoals: z
    .string()
    .min(10, 'Please describe your fitness goals in more detail.'),
  workoutHistory: z
    .string()
    .min(10, 'Please provide more details about your workout history.'),
  preferences: z
    .string()
    .min(10, 'Please tell us more about your preferences.'),
});

export default function RecommendationsPage() {
  const [recommendation, setRecommendation] =
    useState<PersonalizedWorkoutRecommendationsOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fitnessGoals: 'I want to lose weight and improve my cardio.',
      workoutHistory: 'I am a beginner, I sometimes go for a walk.',
      preferences:
        'I prefer 20-30 minute workouts at home, no equipment needed.',
    },
  });

  const { loading: logsLoading } = useCollection(null);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    setRecommendation(null);
    const result = await getRecommendationsAction(values);
    setIsLoading(false);

    if ('error' in result) {
      toast({
        variant: 'destructive',
        title: 'An error occurred',
        description: result.error,
      });
    } else {
      setRecommendation(result);
    }
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 animate-in fade-in-from-bottom-8 duration-500">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-6 w-6" />
            AI Workout Coach
          </CardTitle>
          <CardDescription>
            Tell us about yourself, and our AI will create a personalized
            workout plan for you.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="fitnessGoals"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fitness Goals</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="e.g., 'I want to lose 10 pounds in 3 months and build lean muscle.'"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      What are you trying to achieve?
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="workoutHistory"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Workout History</FormLabel>
                    <FormControl>
                      {logsLoading ? (
                        <Skeleton className="h-[76px]" />
                      ) : (
                        <Textarea
                          placeholder="e.g., 'I run 3 times a week for 30 minutes and do some bodyweight exercises.'"
                          {...field}
                        />
                      )}
                    </FormControl>
                    <FormDescription>
                      What's your current fitness routine like?
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="preferences"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Preferences</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="e.g., 'I prefer outdoor workouts, have access to dumbbells, and can work out for 45 minutes a day.'"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Any preferences for workout types, equipment, or time?
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={isLoading} className="w-full">
                {isLoading && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Get My Plan
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      <Card className="flex flex-col">
        <CardHeader>
          <CardTitle>Your Personalized Plan</CardTitle>
          <CardDescription>
            Here are the workouts recommended just for you by our AI coach.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex-1 space-y-6">
          {isLoading && (
            <div className="space-y-4">
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
              <div className="pt-4 space-y-4">
                <Skeleton className="h-8 w-1/2" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
              </div>
            </div>
          )}
          {recommendation ? (
            <div className="space-y-4">
              <div className="prose prose-sm dark:prose-invert max-w-none bg-muted/50 p-4 rounded-lg">
                <p>{recommendation.summary}</p>
              </div>
              <div className="space-y-3">
                {recommendation.recommendations.map((rec, index) => (
                  <Card key={index} className="transition-all duration-300 hover:shadow-md hover:-translate-y-0.5">
                    <CardHeader>
                      <CardTitle className="text-lg">{rec.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">
                        {rec.description}
                      </p>
                    </CardContent>
                    {rec.slug && (
                      <CardFooter>
                        <Button asChild size="sm">
                          <Link href={`/workouts/${rec.slug}`}>
                            <Zap className="mr-2 h-4 w-4" /> View Workout
                          </Link>
                        </Button>
                      </CardFooter>
                    )}
                  </Card>
                ))}
              </div>
            </div>
          ) : (
            !isLoading && (
              <div className="flex h-full items-center justify-center text-center text-muted-foreground">
                <p>
                  Your personalized workout plan will appear here once
                  generated.
                </p>
              </div>
            )
          )}
        </CardContent>
      </Card>
    </div>
  );
}
