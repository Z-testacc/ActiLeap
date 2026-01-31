'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Clock,
  BarChart,
  Zap,
  SlidersHorizontal,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { workouts } from '@/lib/data';
import type { WorkoutCategory, WorkoutIntensity } from '@/lib/types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Slider } from '@/components/ui/slider';
import { useAccessibility } from '@/context/AccessibilityContext';

const categories: WorkoutCategory[] = ['Strength', 'Cardio', 'Yoga', 'HIIT', 'Stretching', 'Rehabilitation'];
const intensities: WorkoutIntensity[] = ['Beginner', 'Intermediate', 'Advanced'];
const allEquipment = [...new Set(workouts.flatMap(w => w.equipment))].sort();
const durationMarks = [
  { value: '0-15', label: '< 15 min' },
  { value: '15-30', label: '15-30 min' },
  { value: '30-45', label: '30-45 min' },
  { value: '45-90', label: '> 45 min' },
];

export default function WorkoutsPage() {
  const [activeCategory, setActiveCategory] = useState<WorkoutCategory | 'All'>('All');
  const [selectedIntensities, setSelectedIntensities] = useState<Set<WorkoutIntensity>>(new Set());
  const [selectedDurations, setSelectedDurations] = useState<Set<string>>(new Set());
  const [selectedEquipment, setSelectedEquipment] = useState<Set<string>>(new Set());
  const { isLowBandwidthMode } = useAccessibility();
  
  const handleMultiSelectChange = <T extends string>(setter: React.Dispatch<React.SetStateAction<Set<T>>>) => (value: T) => {
    setter(prev => {
      const newSet = new Set(prev);
      if (newSet.has(value)) {
        newSet.delete(value);
      } else {
        newSet.add(value);
      }
      return newSet;
    });
  };
  
  const handleIntensityChange = handleMultiSelectChange(setSelectedIntensities);
  const handleDurationChange = handleMultiSelectChange(setSelectedDurations);
  const handleEquipmentChange = handleMultiSelectChange(setSelectedEquipment);

  const filteredWorkouts = workouts.filter(workout => {
    const categoryMatch = activeCategory === 'All' || workout.category === activeCategory;
    const intensityMatch = selectedIntensities.size === 0 || selectedIntensities.has(workout.intensity);
    
    const durationMatch = selectedDurations.size === 0 || Array.from(selectedDurations).some(range => {
      const [min, max] = range.split('-').map(Number);
      if (max) {
        return workout.duration >= min && workout.duration <= max;
      }
      return workout.duration >= min;
    });

    const equipmentMatch = selectedEquipment.size === 0 || workout.equipment.some(e => selectedEquipment.has(e));

    return categoryMatch && intensityMatch && durationMatch && equipmentMatch;
  });

  return (
    <div className="space-y-8 animate-in fade-in-from-bottom-8 duration-500">
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <Tabs defaultValue="All" onValueChange={(val) => setActiveCategory(val as WorkoutCategory | 'All')}>
          <TabsList className="flex-wrap h-auto">
            <TabsTrigger value="All">All</TabsTrigger>
            {categories.map(cat => (
              <TabsTrigger key={cat} value={cat}>{cat}</TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline">
              <SlidersHorizontal className="mr-2 h-4 w-4" />
              Filters
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-72">
            <div className="grid gap-4">
              <h4 className="font-medium leading-none">Filters</h4>
              <Separator />
              
              <div className="grid gap-2">
                <Label>Intensity</Label>
                <div className="flex flex-wrap gap-2">
                {intensities.map(intensity => (
                  <div key={intensity} className="flex items-center space-x-2">
                    <Checkbox
                      id={`intensity-${intensity}`}
                      checked={selectedIntensities.has(intensity)}
                      onCheckedChange={() => handleIntensityChange(intensity)}
                    />
                    <label htmlFor={`intensity-${intensity}`} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                      {intensity}
                    </label>
                  </div>
                ))}
                </div>
              </div>
              
              <Separator />

              <div className="grid gap-2">
                <Label>Duration</Label>
                <div className="flex flex-wrap gap-2">
                {durationMarks.map(mark => (
                  <div key={mark.value} className="flex items-center space-x-2">
                    <Checkbox
                      id={`duration-${mark.value}`}
                      checked={selectedDurations.has(mark.value)}
                      onCheckedChange={() => handleDurationChange(mark.value)}
                    />
                    <label htmlFor={`duration-${mark.value}`} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                      {mark.label}
                    </label>
                  </div>
                ))}
                </div>
              </div>

              <Separator />

              <div className="grid gap-2">
                <Label>Equipment</Label>
                <div className="flex flex-wrap gap-2">
                {allEquipment.map(equipment => (
                  <div key={equipment} className="flex items-center space-x-2">
                    <Checkbox
                      id={`equipment-${equipment}`}
                      checked={selectedEquipment.has(equipment)}
                      onCheckedChange={() => handleEquipmentChange(equipment)}
                    />
                    <label htmlFor={`equipment-${equipment}`} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                      {equipment === 'None' ? 'Bodyweight' : equipment}
                    </label>
                  </div>
                ))}
                </div>
              </div>

            </div>
          </PopoverContent>
        </Popover>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {filteredWorkouts.map(workout => (
          <Card key={workout.slug} className="flex flex-col overflow-hidden transition-transform duration-300 hover:scale-105 hover:shadow-xl">
            {!isLowBandwidthMode && (
              <CardHeader className="p-0">
                <Image
                  src={workout.image.imageUrl}
                  alt={workout.title}
                  width={workout.image.width}
                  height={workout.image.height}
                  className="h-48 w-full object-cover"
                  data-ai-hint={workout.image.imageHint}
                />
              </CardHeader>
            )}
            <CardContent className="flex-1 p-6">
              <Badge variant="secondary" className="mb-2">{workout.category}</Badge>
              <CardTitle className="mb-2">{workout.title}</CardTitle>
              <CardDescription>{workout.description}</CardDescription>
            </CardContent>
            <CardFooter className="flex justify-between p-6 pt-0">
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  <span>{workout.duration} min</span>
                </div>
                <div className="flex items-center gap-1">
                  <BarChart className="h-4 w-4" />
                  <span>{workout.intensity}</span>
                </div>
              </div>
              <Button asChild size="sm">
                <Link href={`/workouts/${workout.slug}`}>
                  <Zap className="mr-2 h-4 w-4" /> View
                </Link>
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
      {filteredWorkouts.length === 0 && (
        <div className="text-center text-muted-foreground py-16">
          <p>No workouts match your filters.</p>
        </div>
      )}
    </div>
  );
}
