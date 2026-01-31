'use client';

import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { addWorkoutLog } from '@/firebase/firestore/workoutLogs';
import { Loader2, PlusCircle, Trash2 } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from './ui/scroll-area';
import { achievements } from '@/lib/data';

const exerciseSchema = z.object({
  name: z.string().min(1, 'Exercise name is required.'),
  sets: z.coerce.number().min(1, 'At least 1 set.'),
  reps: z.coerce.number().min(1, 'At least 1 rep.'),
  weight: z.coerce.number().min(0, 'Weight cannot be negative.'),
});

const formSchema = z.object({
  workoutTitle: z.string().min(1, 'Workout title is required.'),
  duration: z.coerce.number().min(1, 'Duration must be at least 1 minute.'),
  calories: z.coerce.number().min(0, 'Calories must be a positive number.'),
  exercises: z.array(exerciseSchema).optional(),
});

interface LogWorkoutDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function LogWorkoutDialog({ open, onOpenChange }: LogWorkoutDialogProps) {
  const { toast } = useToast();
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      workoutTitle: '',
      duration: 30,
      calories: 250,
      exercises: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "exercises"
  });

  const { isSubmitting } = form.formState;

  async function onSubmit(values: z.infer<typeof formSchema>) {
    toast({
      variant: 'destructive',
      title: 'Action Disabled',
      description: 'Logging workouts is disabled as there is no signed-in user.',
    });
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      if (!isOpen) {
        form.reset();
      }
      onOpenChange(isOpen);
    }}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Log an Activity</DialogTitle>
          <DialogDescription>
            Record your completed workout session here. Click save when you're done.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <ScrollArea className="h-[500px] p-4">
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="workoutTitle"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Workout Title</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Morning Run" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="duration"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Duration (minutes)</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="calories"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Calories Burned</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <Separator />
                
                <div>
                  <h3 className="text-lg font-medium">Strength Exercises</h3>
                  <p className="text-sm text-muted-foreground">Optionally log specific exercises.</p>
                </div>
                
                {fields.map((field, index) => (
                  <div key={field.id} className="space-y-2 rounded-md border p-4 relative">
                     <FormField
                        control={form.control}
                        name={`exercises.${index}.name`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Exercise Name</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g., Bench Press" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div className="grid grid-cols-3 gap-2">
                        <FormField
                          control={form.control}
                          name={`exercises.${index}.sets`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Sets</FormLabel>
                              <FormControl><Input type="number" placeholder="3" {...field} /></FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                         <FormField
                          control={form.control}
                          name={`exercises.${index}.reps`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Reps</FormLabel>
                              <FormControl><Input type="number" placeholder="10" {...field} /></FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                         <FormField
                          control={form.control}
                          name={`exercises.${index}.weight`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Weight (kg)</FormLabel>
                              <FormControl><Input type="number" placeholder="50" {...field} /></FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <Button type="button" variant="ghost" size="icon" className="absolute top-2 right-2" onClick={() => remove(index)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                  </div>
                ))}

                <Button type="button" variant="outline" size="sm" onClick={() => append({ name: '', sets: 3, reps: 10, weight: 0 })}>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Add Exercise
                </Button>
              </div>
            </ScrollArea>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
