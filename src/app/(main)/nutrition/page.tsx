'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { PieChart, Pie, Cell, Legend } from 'recharts';
import { Button } from '@/components/ui/button';
import { useDoc, useFirestore } from '@/firebase';
import { useMemo } from 'react';
import { doc } from 'firebase/firestore';
import type { UserProfile } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { UtensilsCrossed } from 'lucide-react';
import Link from 'next/link';

const macroChartConfig = {
  protein: { label: 'Protein (g)', color: 'hsl(var(--chart-1))' },
  carbs: { label: 'Carbs (g)', color: 'hsl(var(--chart-2))' },
  fats: { label: 'Fats (g)', color: 'hsl(var(--chart-3))' },
} satisfies ChartConfig;

export default function NutritionPage() {
  const { data: userProfile, loading: profileLoading } = useDoc(null);
  const currentUser = userProfile as UserProfile | null;

  const caloriesConsumed = currentUser?.dailyCalorieIntake ?? 1850;
  const caloriesBurned = (currentUser?.totalCaloriesThisWeek ?? 1750) / 7; // Average daily burn
  const netCalories = caloriesConsumed - caloriesBurned;
  
  const macroData = [
    { name: 'protein', value: currentUser?.dailyProtein ?? 150, fill: 'var(--color-protein)' },
    { name: 'carbs', value: currentUser?.dailyCarbs ?? 200, fill: 'var(--color-carbs)' },
    { name: 'fats', value: currentUser?.dailyFats ?? 60, fill: 'var(--color-fats)' },
  ];

  if (profileLoading) {
    return (
        <div className="grid gap-6 animate-in fade-in-from-bottom-8 duration-500">
            <div className="grid gap-6 md:grid-cols-3">
                <Skeleton className="h-32" />
                <Skeleton className="h-32" />
                <Skeleton className="h-32" />
            </div>
            <Skeleton className="h-96" />
        </div>
    )
  }
  
  // Since there's no auth, we can't connect to a nutrition app. Show placeholder/static info.
  return (
    <div className="space-y-6 animate-in fade-in-from-bottom-8 duration-500">
        <div className="grid gap-6 md:grid-cols-3">
            <Card className="transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
                <CardHeader>
                    <CardTitle>Calories In</CardTitle>
                    <CardDescription>Consumed today</CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-4xl font-bold">{caloriesConsumed.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">kcal</p>
                </CardContent>
            </Card>
            <Card className="transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
                <CardHeader>
                    <CardTitle>Calories Out</CardTitle>
                    <CardDescription>Avg. daily burn</CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-4xl font-bold">{Math.round(caloriesBurned).toLocaleString()}</p>
                     <p className="text-xs text-muted-foreground">kcal</p>
                </CardContent>
            </Card>
             <Card className={netCalories > 0 ? 'border-accent/50 bg-accent/10 transition-all duration-300 hover:shadow-lg hover:-translate-y-1' : 'border-success/50 bg-success/10 transition-all duration-300 hover:shadow-lg hover:-translate-y-1'}>
                <CardHeader>
                    <CardTitle className={netCalories > 0 ? 'text-accent' : 'text-success'}>Net Calories</CardTitle>
                    <CardDescription>{netCalories > 0 ? 'Surplus' : 'Deficit'}</CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-4xl font-bold">{Math.abs(Math.round(netCalories)).toLocaleString()}</p>
                     <p className="text-xs text-muted-foreground">kcal</p>
                </CardContent>
            </Card>
        </div>

      <Card>
        <CardHeader>
          <CardTitle>Macronutrient Breakdown</CardTitle>
          <CardDescription>Your daily intake of protein, carbs, and fats.</CardDescription>
        </CardHeader>
        <CardContent className="flex-1 items-center justify-center">
            <ChartContainer config={macroChartConfig} className="h-64 w-full">
              <PieChart>
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent indicator="dot" />}
                />
                <Pie data={macroData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={80} label>
                     {macroData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                </Pie>
              </PieChart>
            </ChartContainer>
        </CardContent>
      </Card>
    </div>
  );
}
