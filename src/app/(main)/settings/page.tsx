'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useFirestore, useDoc } from '@/firebase';
import { getAllWorkoutLogs } from '@/firebase/firestore/workoutLogs';
import { useState, useMemo, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Watch, Heart, UtensilsCrossed, CalendarDays, LifeBuoy, Volume2, Accessibility, Languages, Moon, Sun } from 'lucide-react';
import type { UserProfile, WorkoutLog } from '@/lib/types';
import { Timestamp, doc } from 'firebase/firestore';
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
} from '@/components/ui/form';
import { updateUserProfile } from '@/firebase/firestore/users';
import { Skeleton } from '@/components/ui/skeleton';
import { useAccessibility } from '@/context/AccessibilityContext';
import { Separator } from '@/components/ui/separator';
import { useTheme } from 'next-themes';

const profileFormSchema = z.object({
  displayName: z
    .string()
    .min(2, { message: 'Name must be at least 2 characters.' })
    .max(50),
  age: z.coerce.number().min(13, 'You must be at least 13 years old.').max(120).optional(),
  primaryGoal: z
    .enum(['weight-loss', 'muscle-gain', 'general-fitness', 'endurance'])
    .optional(),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

export default function SettingsPage() {
  const { toast } = useToast();
  const [isExporting, setIsExporting] = useState(false);
  const { isLowBandwidthMode, setIsLowBandwidthMode, isVoiceGuidanceEnabled, setIsVoiceGuidanceEnabled, language, setLanguage } = useAccessibility();
  const { theme, setTheme } = useTheme();

  const { data: userProfile, loading: profileLoading } = useDoc(null);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      displayName: 'Fitness Enthusiast',
      age: 28,
      primaryGoal: 'general-fitness',
    },
  });

  const { isSubmitting } = form.formState;

  async function onSubmit(data: ProfileFormValues) {
    toast({
        variant: "destructive",
        title: "Action Disabled",
        description: "Updating profile is disabled as there is no signed-in user.",
    });
  }

  const handleExportData = async () => {
    toast({
      variant: 'destructive',
      title: 'Action Disabled',
      description: 'Exporting data is disabled as there is no signed-in user.',
    });
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6 animate-in fade-in-from-bottom-8 duration-500">
      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>Manage your personal information.</CardDescription>
        </CardHeader>
        <CardContent>
          {profileLoading ? (
             <div className="space-y-4">
                <Skeleton className="h-10 w-full" />
                <div className="grid grid-cols-2 gap-4">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                </div>
                <Skeleton className="h-10 w-32" />
             </div>
          ) : (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <fieldset disabled>
                  <FormField
                    control={form.control}
                    name="displayName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Your Name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <FormField
                      control={form.control}
                      name="age"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Age</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="e.g. 32"
                              {...field}
                              value={field.value ?? ''}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="primaryGoal"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Primary Goal</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select your goal" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="weight-loss">
                                Weight Loss
                              </SelectItem>
                              <SelectItem value="muscle-gain">
                                Muscle Gain
                              </SelectItem>
                              <SelectItem value="general-fitness">
                                General Fitness
                              </SelectItem>
                              <SelectItem value="endurance">Endurance</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <Button type="submit" disabled className="mt-4">
                    {isSubmitting && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Save Changes
                  </Button>
                </fieldset>
              </form>
            </Form>
          )}
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Appearance</CardTitle>
          <CardDescription>Customize the look and feel of the app.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="dark-mode" className="flex items-center gap-2">
              {theme === 'dark' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
              Dark Mode
            </Label>
            <Switch 
              id="dark-mode" 
              checked={theme === 'dark'} 
              onCheckedChange={(checked) => setTheme(checked ? 'dark' : 'light')}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Notifications</CardTitle>
          <CardDescription>Control how you receive updates.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="workout-reminders">Workout Reminders</Label>
            <Switch id="workout-reminders" defaultChecked />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="hydration-reminders">Hydration Reminders</Label>
            <Switch id="hydration-reminders" />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="community-updates">Community Updates</Label>
            <Switch id="community-updates" defaultChecked />
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Integrations</CardTitle>
          <CardDescription>
            Connect with your favorite health and wellness services.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 pt-4">
            <div className="flex flex-col space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg transition-all hover:shadow-md">
                    <div className="flex items-center gap-4">
                        <Watch className="h-6 w-6 text-muted-foreground" />
                        <div>
                            <Label className="font-semibold text-base">Wearables</Label>
                            <p className="text-sm text-muted-foreground">Sync your watch for live data.</p>
                        </div>
                    </div>
                    <Button variant="outline">Connect</Button>
                </div>
                <div className="flex items-center justify-between p-4 border rounded-lg transition-all hover:shadow-md">
                    <div className="flex items-center gap-4">
                        <Heart className="h-6 w-6 text-muted-foreground" />
                        <div>
                            <Label className="font-semibold text-base">Health Platforms</Label>
                            <p className="text-sm text-muted-foreground">Connect to Apple Health or Google Fit.</p>
                        </div>
                    </div>
                    <div className="space-x-2">
                        <Button variant="outline">Apple Health</Button>
                        <Button variant="outline">Google Fit</Button>
                    </div>
                </div>
                <div className="flex items-center justify-between p-4 border rounded-lg transition-all hover:shadow-md">
                    <div className="flex items-center gap-4">
                        <UtensilsCrossed className="h-6 w-6 text-muted-foreground" />
                        <div>
                            <Label className="font-semibold text-base">Nutrition Apps</Label>
                            <p className="text-sm text-muted-foreground">Sync with MyFitnessPal, etc.</p>
                        </div>
                    </div>
                    <Button variant="outline">Connect</Button>
                </div>
                <div className="flex items-center justify-between p-4 border rounded-lg transition-all hover:shadow-md">
                    <div className="flex items-center gap-4">
                        <CalendarDays className="h-6 w-6 text-muted-foreground" />
                        <div>
                            <Label className="font-semibold text-base">Calendar Sync</Label>
                            <p className="text-sm text-muted-foreground">Add workouts to your calendar.</p>
                        </div>
                    </div>
                    <Button variant="outline">Connect</Button>
                </div>
            </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Accessibility</CardTitle>
          <CardDescription>Customize the app for your needs.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="voice-guidance" className="flex items-center gap-2">
              <Volume2 className="h-5 w-5" />
              Voice Guidance
            </Label>
            <Switch id="voice-guidance" checked={isVoiceGuidanceEnabled} onCheckedChange={setIsVoiceGuidanceEnabled}/>
          </div>
           <Separator />
          <div className="flex items-center justify-between">
            <Label htmlFor="low-bandwidth" className="flex items-center gap-2">
              <Accessibility className="h-5 w-5" />
              Low Bandwidth Mode
            </Label>
            <Switch id="low-bandwidth" checked={isLowBandwidthMode} onCheckedChange={setIsLowBandwidthMode} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Language & Region</CardTitle>
          <CardDescription>
            Choose your preferred language for the app.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="language" className="flex items-center gap-2">
              <Languages className="h-5 w-5" />
              Language
            </Label>
            <Select value={language} onValueChange={setLanguage}>
              <SelectTrigger id="language">
                <SelectValue placeholder="Select language" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en-US">English (United States)</SelectItem>
                <SelectItem value="es-ES">Español (España)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Emergency & Safety</CardTitle>
          <CardDescription>Manage your emergency contacts and safety alerts.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <Label className="font-semibold">Emergency Contacts</Label>
            <p className="text-sm text-muted-foreground">These contacts will be notified if you trigger the SOS alert.</p>
            <div className="mt-2 space-y-2">
               <div className="flex items-center justify-between p-3 border rounded-lg bg-muted/50">
                   <p className="font-medium">Jane Doe (Partner)</p>
                   <Button variant="ghost" size="sm">Remove</Button>
               </div>
            </div>
            <Button variant="outline" className="mt-2 w-full">Add Emergency Contact</Button>
          </div>
          <Separator />
          <div>
             <Label className="font-semibold">Health Alert Thresholds</Label>
             <div className="mt-2 space-y-2">
              <div className="grid grid-cols-2 items-center gap-4">
                  <Label htmlFor="max-heart-rate">Max Heart Rate (BPM)</Label>
                  <Input id="max-heart-rate" type="number" placeholder="180" />
              </div>
             </div>
          </div>
          <Separator />
          <div className="flex items-center justify-between">
              <Label htmlFor="location-sharing" className="flex flex-col space-y-1">
                <span className='font-semibold'>Location Sharing</span>
                <span className='font-normal text-muted-foreground text-sm'>Share location when SOS is active.</span>
              </Label>
              <Switch id="location-sharing" defaultChecked />
          </div>
        </CardContent>
      </Card>


      <Card>
        <CardHeader>
          <CardTitle>Privacy & Security</CardTitle>
          <CardDescription>Manage your data and account.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            variant="outline"
            className="w-full"
            onClick={handleExportData}
            disabled
          >
            {isExporting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Export Data Logs
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" className="w-full" disabled>
                Delete Account
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete your
                  account and remove your data from our servers.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction>Continue</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>
    </div>
  );
}
