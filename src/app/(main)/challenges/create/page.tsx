'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useToast } from '@/hooks/use-toast';
import { useFirestore } from '@/firebase';
import { createChallenge } from '@/firebase/firestore/challenges';
import { Loader2, Calendar as CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

const formSchema = z
  .object({
    title: z.string().min(5, 'Title must be at least 5 characters.'),
    description: z
      .string()
      .min(10, 'Description must be at least 10 characters.'),
    type: z.enum(['time-bound', 'performance-based']),
    goalValue: z.coerce.number().min(1, 'Goal must be at least 1.'),
    goalUnit: z
      .string()
      .min(
        1,
        'Please provide a unit for the goal (e.g., workouts, pushups, calories).'
      ),
    endDate: z.date().optional(),
  })
  .refine(
    data => {
      if (data.type === 'time-bound' && !data.endDate) {
        return false;
      }
      return true;
    },
    {
      message: 'End date is required for time-bound challenges.',
      path: ['endDate'],
    }
  );

type ChallengeFormValues = z.infer<typeof formSchema>;

export default function CreateChallengePage() {
  const router = useRouter();
  const { toast } = useToast();
  const firestore = useFirestore();

  const form = useForm<ChallengeFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      description: '',
      type: 'performance-based',
      goalValue: 100,
      goalUnit: 'pushups',
    },
  });

  const challengeType = form.watch('type');
  const { isSubmitting } = form.formState;

  async function onSubmit(values: ChallengeFormValues) {
    toast({
      variant: 'destructive',
      title: 'Action Disabled',
      description: 'Creating challenges is disabled as there is no signed-in user.',
    });
  }

  return (
    <div className="animate-in fade-in-from-bottom-8 duration-500">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Create a New Challenge</CardTitle>
          <CardDescription>
            Set up a new peer-to-peer challenge and invite your friends to
            compete.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Challenge Title</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., 100 Pushup Challenge"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Describe the rules and goals of your challenge"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel>Challenge Type</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="flex space-x-4"
                      >
                        <FormItem className="flex items-center space-x-3 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="performance-based" />
                          </FormControl>
                          <FormLabel className="font-normal">
                            Performance-based
                          </FormLabel>
                        </FormItem>
                        <FormItem className="flex items-center space-x-3 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="time-bound" />
                          </FormControl>
                          <FormLabel className="font-normal">Time-bound</FormLabel>
                        </FormItem>
                      </RadioGroup>
                    </FormControl>
                    <FormDescription>
                      Performance-based challenges are ongoing until the goal is
                      met. Time-bound challenges have a specific end date.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="goalValue"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Goal Value</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="100" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="goalUnit"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Goal Unit</FormLabel>
                      <FormControl>
                        <Input placeholder="pushups" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {challengeType === 'time-bound' && (
                <FormField
                  control={form.control}
                  name="endDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>End Date</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={'outline'}
                              className={cn(
                                'w-[240px] pl-3 text-left font-normal',
                                !field.value && 'text-muted-foreground'
                              )}
                            >
                              {field.value ? (
                                format(field.value, 'PPP')
                              ) : (
                                <span>Pick a date</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={date =>
                              date < new Date() || date < new Date('1900-01-01')
                            }
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <Button type="submit" disabled={isSubmitting} className="w-full">
                {isSubmitting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Create Challenge
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
