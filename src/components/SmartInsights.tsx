'use client';

import { useEffect, useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useUser, useFirestore } from '@/firebase';
import { getAllWorkoutLogs } from '@/firebase/firestore/workoutLogs';
import type { WorkoutLog } from '@/lib/types';
import { getSmartInsightsAction } from '@/app/(main)/progress/actions';
import type { WorkoutInsightsOutput } from '@/ai/flows/workout-insights';
import { Lightbulb, AlertTriangle } from 'lucide-react';

export function SmartInsights() {
  const { user } = useUser();
  const firestore = useFirestore();
  const [insights, setInsights] = useState<WorkoutInsightsOutput | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchInsights() {
      if (!user || !firestore) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const logs: WorkoutLog[] = await getAllWorkoutLogs(firestore, user.uid);

        if (logs.length < 3) {
          setInsights({ insights: [] });
          setLoading(false);
          return;
        }

        const result = await getSmartInsightsAction(logs);

        if ('error' in result) {
          setError(result.error);
        } else {
          setInsights(result);
        }
      } catch (e) {
        setError('An unexpected error occurred while fetching insights.');
        console.error(e);
      } finally {
        setLoading(false);
      }
    }

    fetchInsights();
  }, [user, firestore]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="text-accent" />
            AI-Powered Insights
          </CardTitle>
          <CardDescription>
            Analyzing your progress to find actionable recommendations...
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
             <Skeleton className="h-20 w-full" />
             <Skeleton className="h-20 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }
  
  if (error) {
     return (
       <Card className="border-destructive/50 bg-destructive/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle />
            Could Not Load Insights
          </CardTitle>
          <CardDescription className="text-destructive/80">
            {error}
          </CardDescription>
        </CardHeader>
      </Card>
     )
  }

  if (!insights || insights.insights.length === 0) {
    return (
      <Card className="bg-muted/40">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="text-accent" />
            AI-Powered Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
            <p className="text-center text-muted-foreground py-4">
                Log a few more workouts to start receiving personalized insights and recommendations.
            </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lightbulb className="text-accent" />
          AI-Powered Insights
        </CardTitle>
        <CardDescription>
          Here are some observations and recommendations based on your recent activity.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-6 md:grid-cols-2">
        {insights.insights.map((insight, index) => (
          <div key={index} className="rounded-lg border-l-4 border-accent bg-accent/10 p-4">
            <h4 className="font-semibold">{insight.title}</h4>
            <p className="mt-1 text-sm text-muted-foreground">{insight.description}</p>
            <p className="mt-2 text-sm font-medium text-accent-foreground/80">{insight.recommendation}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
