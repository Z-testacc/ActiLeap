'use client';

import { useMemo } from 'react';
import {
  collection,
  query,
  orderBy,
  limit,
  Timestamp,
  doc,
} from 'firebase/firestore';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartConfig,
} from '@/components/ui/chart';
import {
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
  XAxis,
  YAxis,
} from 'recharts';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { achievements, PIE_CHART_COLORS, workouts } from '@/lib/data';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useCollection, useFirestore, useDoc } from '@/firebase';
import type { WorkoutLog, UserProfile } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { SmartInsights } from '@/components/SmartInsights';

const volumeChartConfig = {
  volume: {
    label: 'Volume (kg)',
    color: 'hsl(var(--primary))',
  },
} satisfies ChartConfig;

export default function ProgressPage() {
  const { data: userProfile, loading: userProfileLoading } = useDoc(null);
  const { data: workoutLogs, loading: workoutLogsLoading } = useCollection(null);

  const unlockedBadges = useMemo(
    () => (userProfile as UserProfile)?.unlockedBadges || [],
    [userProfile]
  );

  const strengthVolumeOverTimeData: any[] = [];
  const workoutDistribution: any[] = [];
  const pieChartConfig = { workouts: { label: 'Workouts' } };

  return (
    <div className="animate-in fade-in-from-bottom-8 duration-500">
        <Tabs defaultValue="history" className="space-y-4">
        <TabsList>
            <TabsTrigger value="history">History</TabsTrigger>
            <TabsTrigger value="overview">Overview</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
            <Card>
                <CardHeader>
                <CardTitle>Strength Volume</CardTitle>
                <CardDescription>
                    Total volume (sets × reps × weight) lifted in your workouts.
                </CardDescription>
                </CardHeader>
                <CardContent>
                {workoutLogsLoading && <Skeleton className="h-64 w-full" />}
                {!workoutLogsLoading && (
                    <div className="flex h-64 w-full items-center justify-center text-center text-muted-foreground">
                    <p>
                        No user signed in. Workout data is unavailable.
                    </p>
                    </div>
                )}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                <CardTitle>Workout Distribution</CardTitle>
                <CardDescription>
                    Distribution of your workout types.
                </CardDescription>
                </CardHeader>
                <CardContent className="flex items-center justify-center">
                {workoutLogsLoading && <Skeleton className="h-64 w-64 rounded-full" />}
                {!workoutLogsLoading && (
                    <div className="flex h-64 w-full items-center justify-center text-muted-foreground">
                    No user signed in. Workout data is unavailable.
                    </div>
                )}
                </CardContent>
            </Card>
            </div>

            <SmartInsights />

            <Card>
            <CardHeader>
                <CardTitle>Achievements & Streaks</CardTitle>
                <CardDescription>
                Milestones you've unlocked on your fitness journey.
                </CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                {userProfileLoading &&
                Array.from({ length: 8 }).map((_, i) => (
                    <Skeleton key={i} className="h-36 w-full" />
                ))}
                {!userProfileLoading &&
                achievements.map(achievement => {
                    const isUnlocked = unlockedBadges.includes(achievement.id);
                    return (
                    <div
                        key={achievement.id}
                        className={cn(
                        'flex flex-col items-center justify-center gap-2 rounded-lg border p-4 text-center transition-all duration-300',
                        isUnlocked
                            ? 'border-transparent bg-gradient-to-br from-yellow-400 to-amber-500 text-white shadow-lg hover:shadow-amber-500/50 hover:-translate-y-1'
                            : 'bg-muted/50 opacity-60'
                        )}
                    >
                        <div
                        className={cn(
                            'rounded-full p-3',
                            isUnlocked
                            ? 'bg-white/20'
                            : 'bg-muted-foreground/20'
                        )}
                        >
                        <achievement.icon className="h-8 w-8" />
                        </div>
                        <p className="font-semibold">{achievement.title}</p>
                        <p className="text-xs text-muted-foreground">
                        {achievement.description}
                        </p>
                    </div>
                    );
                })}
            </CardContent>
            </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
            <Card>
            <CardHeader>
                <CardTitle>Workout History</CardTitle>
                <CardDescription>A log of your completed workouts.</CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                <TableHeader>
                    <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Workout</TableHead>
                    <TableHead className="text-right">Duration</TableHead>
                    <TableHead className="text-right">Calories</TableHead>
                    <TableHead className="text-right">Exercises</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {workoutLogsLoading && (
                    <TableRow>
                        <TableCell colSpan={5} className="h-24 text-center">
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="mt-2 h-4 w-full" />
                        </TableCell>
                    </TableRow>
                    )}
                    {!workoutLogsLoading && (
                    <TableRow>
                        <TableCell colSpan={5} className="h-24 text-center">
                        No user signed in. Workout logs are unavailable.
                        </TableCell>
                    </TableRow>
                    )}
                </TableBody>
                </Table>
            </CardContent>
            <CardFooter className="flex justify-center">
                <Button variant="outline" disabled>
                Load More
                </Button>
            </CardFooter>
            </Card>
        </TabsContent>
        </Tabs>
    </div>
  );
}
