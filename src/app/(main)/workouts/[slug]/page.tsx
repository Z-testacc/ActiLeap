'use client';

import { notFound, useRouter } from 'next/navigation';
import Image from 'next/image';
import { workouts } from '@/lib/data';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import {
  Clock,
  BarChart,
  Volume2,
  Play,
  Pause,
  SkipForward,
  SkipBack,
  XCircle,
  Loader2,
  Users2,
  CalendarPlus,
  LifeBuoy,
  Trophy,
} from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { getSpeechAction } from './actions';
import { CircularProgress } from '@/components/ui/circular-progress';
import type { Workout, UserProfile } from '@/lib/types';
import { useFirestore, useDoc } from '@/firebase';
import { doc } from 'firebase/firestore';
import { createGroupWorkoutSession } from '@/firebase/firestore/group-workouts';
import {
  addWorkoutLog,
  updateWorkoutLogFeedback,
} from '@/firebase/firestore/workoutLogs';
import { useToast } from '@/hooks/use-toast';
import { useAccessibility } from '@/context/AccessibilityContext';

function WorkoutSession({
  workout,
  onExit,
}: {
  workout: Workout;
  onExit: (completed: boolean) => void;
}) {
  const {
    isVoiceGuidanceEnabled,
    setIsVoiceGuidanceEnabled,
    isLowBandwidthMode,
    language,
  } = useAccessibility();
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(workout.steps[0].duration);
  const [isPaused, setIsPaused] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isFetchingAudio, setIsFetchingAudio] = useState(false);
  const [isSosDialogOpen, setIsSosDialogOpen] = useState(false);
  const { toast } = useToast();

  const audioRef = useRef<HTMLAudioElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const currentStep = workout.steps[currentStepIndex];
  
  const langKey = language.split('-')[0];
  const currentInstruction = workout.translations?.[langKey]?.steps[currentStepIndex]?.instruction || currentStep.instruction;

  const progress =
    ((currentStep.duration - timeLeft) / currentStep.duration) * 100;

  const fetchAudio = useCallback(
    async (text: string) => {
      if (!isVoiceGuidanceEnabled) return;
      setIsFetchingAudio(true);
      setAudioUrl(null);
      try {
        const { audioUrl: url, error } = await getSpeechAction(text, language);
        if (url) {
          setAudioUrl(url);
        }
        if (error) {
          console.error('Failed to fetch audio:', error);
        }
      } catch (error) {
        console.error('Failed to fetch audio:', error);
      } finally {
        setIsFetchingAudio(false);
      }
    },
    [isVoiceGuidanceEnabled, language]
  );

  useEffect(() => {
    fetchAudio(currentInstruction);
    setTimeLeft(currentStep.duration);
    setIsPaused(false);
  }, [currentStepIndex, currentStep, fetchAudio, currentInstruction]);

  useEffect(() => {
    if (audioUrl && audioRef.current) {
      audioRef.current.play().catch(e => console.error('Audio playback failed', e));
    }
  }, [audioUrl]);

  useEffect(() => {
    if (!isPaused) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prevTime => {
          if (prevTime <= 1) {
            if (currentStepIndex < workout.steps.length - 1) {
              setCurrentStepIndex(i => i + 1);
            } else {
              onExit(true); // Workout completed
            }
            return 0;
          }
          return prevTime - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPaused, currentStepIndex, workout.steps.length, onExit]);

  const handleNext = () => {
    if (currentStepIndex < workout.steps.length - 1) {
      setCurrentStepIndex(i => i + 1);
    }
  };

  const handlePrev = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(i => i - 1);
    }
  };

  const handleSos = () => {
    setIsSosDialogOpen(false);
    toast({
      variant: 'destructive',
      title: 'Emergency SOS Activated',
      description: 'Emergency contacts have been notified. (This is a simulation)',
    });
    // In a real app, you would add native code here to call/text emergency contacts.
  };
  
  const workoutTitle = workout.translations?.[langKey]?.title || workout.title;

  return (
    <>
      <AlertDialog open={isSosDialogOpen} onOpenChange={setIsSosDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Activate Emergency SOS?</AlertDialogTitle>
            <AlertDialogDescription>
              This will immediately notify your pre-set emergency contacts and share your location. Are you sure you want to proceed?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90"
              onClick={handleSos}
            >
              Activate SOS
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="flex flex-col items-center justify-center p-4 h-full">
        <Card className="w-full max-w-2xl relative">
          <div className="absolute top-4 right-4 flex gap-2">
            <Button
              variant="destructive"
              size="icon"
              onClick={() => setIsSosDialogOpen(true)}
              className="rounded-full animate-pulse-red"
            >
              <LifeBuoy />
              <span className="sr-only">SOS</span>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onExit(false)}
            >
              <XCircle />
              <span className="sr-only">Exit</span>
            </Button>
          </div>
          <CardHeader className="text-center pt-16">
            <CardTitle className="text-3xl">{workoutTitle}</CardTitle>
            <p className="text-muted-foreground">
              Step {currentStepIndex + 1} of {workout.steps.length}
            </p>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-8">
            <div className="relative w-48 h-48">
              <CircularProgress value={progress} />
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-4xl font-bold">{timeLeft}</span>
                <span className="text-sm text-muted-foreground">seconds</span>
              </div>
            </div>

            <div className="text-center">
              <p className="text-2xl font-semibold">{currentInstruction}</p>
            </div>

            {!isLowBandwidthMode && (
              <Image
                src={currentStep.animationUrl.imageUrl}
                alt={currentStep.instruction}
                width={currentStep.animationUrl.width}
                height={currentStep.animationUrl.height}
                className="mt-2 rounded-lg object-cover"
                data-ai-hint={currentStep.animationUrl.imageHint}
              />
            )}

            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="icon"
                onClick={handlePrev}
                disabled={currentStepIndex === 0}
              >
                <SkipBack />
              </Button>
              <Button size="lg" onClick={() => setIsPaused(p => !p)}>
                {isPaused ? (
                  <Play className="h-6 w-6" />
                ) : (
                  <Pause className="h-6 w-6" />
                )}
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={handleNext}
                disabled={currentStepIndex === workout.steps.length - 1}
              >
                <SkipForward />
              </Button>
            </div>

            {currentStepIndex === workout.steps.length - 1 && (
                <Button
                    size="lg"
                    variant="success"
                    className="mt-4 animate-pulse-gentle"
                    onClick={() => onExit(true)}
                >
                    <Trophy className="mr-2 h-5 w-5" />
                    Workout Complete
                </Button>
            )}

            <div className="flex items-center space-x-2">
              <Switch
                id="session-voice-guidance"
                checked={isVoiceGuidanceEnabled}
                onCheckedChange={setIsVoiceGuidanceEnabled}
              />
              <Label
                htmlFor="session-voice-guidance"
                className="flex items-center gap-2"
              >
                <Volume2 className="h-5 w-5 text-muted-foreground" />
                <span>Voice Guidance</span>
                {isFetchingAudio && <Loader2 className="h-4 w-4 animate-spin" />}
              </Label>
            </div>
          </CardContent>
        </Card>
        {audioUrl && <audio ref={audioRef} src={audioUrl} />}
      </div>
    </>
  );
}

export default function WorkoutDetailPage({
  params,
}: {
  params: { slug: string };
}) {
  const workout = workouts.find(w => w.slug === params.slug);
  const { toast } = useToast();
  const { isVoiceGuidanceEnabled, setIsVoiceGuidanceEnabled, isLowBandwidthMode, language } =
    useAccessibility();

  const [isSessionActive, setIsSessionActive] = useState(false);
  const [isPublicSession, setIsPublicSession] = useState(false);
  const [isCreatingSession, setIsCreatingSession] = useState(false);
  const [isFeedbackDialogOpen, setIsFeedbackDialogOpen] = useState(false);
  const [completedLogId, setCompletedLogId] = useState<string | null>(null);

  useEffect(() => {
    if (!workout) {
      notFound();
    }
  }, [workout]);

  if (!workout) {
    return null; // or a loading state, though useEffect handles notFound
  }
  
  const langKey = language.split('-')[0];
  const workoutTitle = workout.translations?.[langKey]?.title || workout.title;
  const workoutDescription = workout.translations?.[langKey]?.description || workout.description;

  const handleBeginWorkout = async () => {
    if (isPublicSession) {
       toast({
          variant: 'destructive',
          title: 'Action Disabled',
          description: 'Starting a public session is disabled as there is no signed-in user.',
        });
        return;
    }
    setIsSessionActive(true);
  };

  const handleSessionExit = async (completed: boolean) => {
    setIsSessionActive(false);

    if (completed && workout) {
      toast({
        title: 'Workout Finished!',
        description: 'Great job! To save your progress, please sign in.',
      });
      //setIsFeedbackDialogOpen(true); // Don't ask for feedback if user can't save
    }
  };

  const handleFeedbackSubmit = (rating: 'easy' | 'moderate' | 'hard') => {
    toast({
        title: 'Action Disabled',
        description: 'Saving feedback is disabled as there is no signed-in user.',
      });
    setIsFeedbackDialogOpen(false);
    setCompletedLogId(null);
  };

  if (isSessionActive) {
    return <WorkoutSession workout={workout} onExit={handleSessionExit} />;
  }

  return (
    <>
      <DifficultyFeedbackDialog
        open={isFeedbackDialogOpen}
        onOpenChange={setIsFeedbackDialogOpen}
        onSubmit={handleFeedbackSubmit}
      />
      <div className="grid gap-8 md:grid-cols-3">
        <div className="md:col-span-2 space-y-8">
          <Card className="overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
            {!isLowBandwidthMode && (
              <Image
                src={workout.image.imageUrl}
                alt={workout.title}
                width={workout.image.width}
                height={workout.image.height}
                className="w-full h-64 object-cover"
                priority
                data-ai-hint={workout.image.imageHint}
              />
            )}
            <CardHeader>
              <div className="flex flex-wrap items-center gap-4">
                <Badge>{workout.category}</Badge>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="h-5 w-5" />
                  <span>{workout.duration} minutes</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <BarChart className="h-5 w-5" />
                  <span>{workout.intensity}</span>
                </div>
              </div>
              <CardTitle className="text-3xl font-bold pt-4">
                {workoutTitle}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">{workoutDescription}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Workout Steps</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-6">
                {workout.steps.map((step, index) => {
                  const instruction = workout.translations?.[langKey]?.steps[index]?.instruction || step.instruction;
                  return (
                    <li key={index} className="flex gap-4">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold">{instruction}</p>
                        <p className="text-sm text-muted-foreground">
                          {step.duration} seconds
                        </p>
                        {!isLowBandwidthMode && (
                          <Image
                            src={step.animationUrl.imageUrl}
                            alt={step.instruction}
                            width={step.animationUrl.width}
                            height={step.animationUrl.height}
                            className="mt-2 rounded-lg object-cover"
                            data-ai-hint={step.animationUrl.imageHint}
                          />
                        )}
                      </div>
                    </li>
                  )
                })}
              </ul>
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-1">
          <Card className="sticky top-24">
            <CardHeader>
              <CardTitle>Start Session</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <Label
                  htmlFor="voice-guidance"
                  className="flex items-center gap-2"
                >
                  <Volume2 className="h-5 w-5 text-muted-foreground" />
                  <span>Voice Guidance</span>
                </Label>
                <Switch
                  id="voice-guidance"
                  checked={isVoiceGuidanceEnabled}
                  onCheckedChange={setIsVoiceGuidanceEnabled}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label
                  htmlFor="public-session"
                  className="flex items-center gap-2"
                >
                  <Users2 className="h-5 w-5 text-muted-foreground" />
                  <span>Public Session</span>
                </Label>
                <Switch
                  id="public-session"
                  checked={isPublicSession}
                  onCheckedChange={setIsPublicSession}
                  disabled
                />
              </div>
              <Separator />
              <div>
                <h4 className="font-semibold mb-2">Equipment Needed</h4>
                <ul className="list-disc list-inside text-muted-foreground">
                  {workout.equipment.map(item => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
              <div className="flex flex-col gap-2">
                <Button
                  size="lg"
                  className="w-full animate-pulse-gentle disabled:animate-none"
                  onClick={handleBeginWorkout}
                  disabled={isCreatingSession}
                >
                  {isCreatingSession ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    'Begin Workout'
                  )}
                </Button>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => toast({ title: "Connect your calendar", description: "You can connect your calendar in the settings to enable this feature."})}
                >
                  <CalendarPlus className="mr-2 h-4 w-4" />
                  Add to Calendar
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}

function DifficultyFeedbackDialog({
  open,
  onOpenChange,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (rating: 'easy' | 'moderate' | 'hard') => void;
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (rating: 'easy' | 'moderate' | 'hard') => {
    setIsSubmitting(true);
    onSubmit(rating);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Workout Complete!</DialogTitle>
          <DialogDescription>
            Great job finishing your workout. How did it feel? Your feedback
            will help us tailor future recommendations.
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-3 gap-4 py-4">
          <Button
            variant="outline"
            className="h-20 flex-col"
            onClick={() => handleSubmit('easy')}
            disabled={isSubmitting}
          >
            <span className="text-2xl">😊</span>
            <span>Easy</span>
          </Button>
          <Button
            variant="outline"
            className="h-20 flex-col"
            onClick={() => handleSubmit('moderate')}
            disabled={isSubmitting}
          >
            <span className="text-2xl">🙂</span>
            <span>Just Right</span>
          </Button>
          <Button
            variant="outline"
            className="h-20 flex-col"
            onClick={() => handleSubmit('hard')}
            disabled={isSubmitting}
          >
            <span className="text-2xl">🥵</span>
            <span>Hard</span>
          </Button>
        </div>
        <DialogFooter>
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Skip
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
