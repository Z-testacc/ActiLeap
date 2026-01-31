'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Flame,
  Bed,
  Footprints,
  Watch,
  HeartPulse,
  AlertTriangle,
  ArrowRight,
} from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { useState, useMemo, useEffect } from 'react';
import { LogWorkoutDialog } from '@/components/LogWorkoutDialog';
import { useFirestore, useDoc } from '@/firebase';
import {
  doc,
  setDoc,
  increment,
  arrayUnion,
  collection,
  query,
  orderBy,
  limit,
  Timestamp,
  runTransaction,
} from 'firebase/firestore';
import type { UserProfile, WorkoutLog } from '@/lib/types';
import { getProgressToNextLevel } from '@/lib/xp';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { cn } from '@/lib/utils';

type Vitals = {
  bpm: number;
  kcal: number;
};
type AlertState = 'normal' | 'warning' | 'critical';

export default function DashboardPage() {
  const [isLogDialogOpen, setIsLogDialogOpen] = useState(false);
  const [dailyChallengeCompleted, setDailyChallengeCompleted] = useState(false);
  const { toast } = useToast();

  const [vitals, setVitals] = useState<Vitals>({ bpm: 78, kcal: 120 });
  const [alertState, setAlertState] = useState<AlertState>('normal');

  // Simulate vitals changing and triggering alerts
  useEffect(() => {
    const interval = setInterval(() => {
      setVitals(prev => {
        const newBpm = Math.floor(prev.bpm + (Math.random() - 0.5) * 5);

        if (newBpm > 180) setAlertState('critical');
        else if (newBpm > 160) setAlertState('warning');
        else setAlertState('normal');

        return {
          bpm: Math.max(60, Math.min(190, newBpm)), // Clamp BPM between 60-190
          kcal: prev.kcal + 1,
        };
      });
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const { data: userProfile, loading: userProfileLoading } = useDoc(null);

  const currentUserProfile = userProfile as UserProfile | null;

  const { currentLevel, currentLevelXp, nextLevelXp, progressPercentage } =
    getProgressToNextLevel(currentUserProfile?.xp ?? 0);

  const displayName = 'Fitness Fan';

  const handleDailyChallenge = async () => {
    toast({
      variant: 'destructive',
      title: 'Action Disabled',
      description: 'This feature is disabled as there is no signed-in user.',
    });
  };

  return (
    <>
      <LogWorkoutDialog
        open={isLogDialogOpen}
        onOpenChange={setIsLogDialogOpen}
      />
      <div className="grid gap-6 animate-in fade-in-from-bottom-8 duration-500">
        <Card className="grid md:grid-cols-2 overflow-hidden">
          <CardHeader className="p-6">
            <CardTitle className="text-3xl font-bold">
              Good Morning, {displayName}!
            </CardTitle>
            <CardDescription>Ready to conquer your day?</CardDescription>
          </CardHeader>
          <CardContent className="p-6 bg-muted/50 flex flex-col justify-center">
            <div className="space-y-2">
              <div className="flex justify-between items-center px-1 font-medium">
                <span className="text-primary">Level {currentLevel}</span>
                <span className="text-sm text-muted-foreground">
                  {currentLevelXp.toLocaleString()} /{' '}
                  {nextLevelXp.toLocaleString()} XP
                </span>
              </div>
              <Progress value={progressPercentage} className="h-2" />
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6 md:grid-cols-3">
          <Card className="transition-all duration-300 hover:shadow-md hover:-translate-y-0.5">
            <CardHeader className="pb-2">
              <CardDescription>Day Streak</CardDescription>
              <CardTitle className="text-4xl font-bold flex items-center gap-2">
                <Flame className="text-success" />
                {currentUserProfile?.streak ?? 0}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card className="transition-all duration-300 hover:shadow-md hover:-translate-y-0.5">
            <CardHeader className="pb-2">
              <CardDescription>Steps Today</CardDescription>
              <CardTitle className="text-4xl font-bold flex items-center gap-2">
                <Footprints className="text-primary" />
                {(currentUserProfile?.stepsToday ?? 6480).toLocaleString()}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card className="transition-all duration-300 hover:shadow-md hover:-translate-y-0.5">
            <CardHeader className="pb-2">
              <CardDescription>Hours Slept</CardDescription>
              <CardTitle className="text-4xl font-bold flex items-center gap-2">
                <Bed className="text-accent" />
                {currentUserProfile?.hoursSlept ?? 7.5}
              </CardTitle>
            </CardHeader>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card className="border-accent border-2 transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
            <CardHeader>
              <CardTitle>Daily Challenge</CardTitle>
              <CardDescription>
                Complete today's challenge for bonus XP!
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-center">
              <h3 className="text-lg font-semibold">2 Minute Plank</h3>
              <p className="text-sm text-muted-foreground">
                Hold a plank for a total of 2 minutes.
              </p>
            </CardContent>
            <CardFooter>
              <Button
                className="w-full bg-accent hover:bg-accent/90 text-accent-foreground"
                onClick={handleDailyChallenge}
                disabled
              >
                I did it! (+15 XP) <ArrowRight className="ml-2" />
              </Button>
            </CardFooter>
          </Card>

          <Card
            className={cn(
              'transition-all duration-300',
              alertState === 'critical'
                ? 'border-destructive bg-destructive/10'
                : alertState === 'warning'
                ? 'border-accent bg-accent/10'
                : 'bg-card'
            )}
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Watch />
                Live Wearable Stats
              </CardTitle>
              <CardDescription>
                {alertState === 'critical' && (
                  <span className="flex items-center gap-1 text-destructive font-semibold pt-1">
                    <AlertTriangle className="h-4 w-4" /> Critical Alert!
                  </span>
                )}
                {alertState === 'warning' && (
                  <span className="flex items-center gap-1 text-accent font-semibold pt-1">
                    <AlertTriangle className="h-4 w-4" /> High Heart Rate
                  </span>
                )}
                {alertState === 'normal' &&
                  'Real-time data from your connected device.'}
              </CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <div className="flex flex-col items-center justify-center p-4 rounded-lg bg-background">
                <div className="text-4xl font-bold flex items-center gap-2">
                  <HeartPulse className="h-8 w-8 text-destructive" />{' '}
                  {vitals.bpm}
                </div>
                <div className="text-sm text-muted-foreground">BPM</div>
              </div>
              <div className="flex flex-col items-center justify-center p-4 rounded-lg bg-background">
                <div className="text-4xl font-bold flex items-center gap-2">
                  <Flame className="h-8 w-8 text-accent" /> {vitals.kcal}
                </div>
                <div className="text-sm text-muted-foreground">
                  kcal Now
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
