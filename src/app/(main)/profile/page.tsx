'use client';

import { useFirestore, useDoc } from '@/firebase';
import { useMemo } from 'react';
import type { UserProfile } from '@/lib/types';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Flame, Dumbbell, Footprints, Bed, LogOut } from 'lucide-react';
import { getImageData } from '@/lib/placeholder-images';
import { getProgressToNextLevel } from '@/lib/xp';
import { achievements } from '@/lib/data';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';

export default function ProfilePage() {
  const router = useRouter();
  const { toast } = useToast();

  const { data: userProfile, loading: userProfileLoading } = useDoc(null);

  const currentUserProfile = userProfile as UserProfile | null;
  const userAvatar = getImageData('user-avatar');

  const { currentLevel, currentLevelXp, nextLevelXp, progressPercentage } =
    getProgressToNextLevel(currentUserProfile?.xp ?? 125);
    
  const unlockedBadges = useMemo(
    () => (userProfile as UserProfile)?.unlockedBadges || ['first-workout'],
    [userProfile]
  );
  
  const handleLogout = async () => {
    // No auth, so this button doesn't do anything.
     toast({
        title: "Signed Out",
        description: "You have been signed out."
      });
  };

  return (
    <div className="space-y-6 animate-in fade-in-from-bottom-8 duration-500">
      <Card>
        <CardHeader className="items-center text-center">
          {userProfileLoading ? (
            <Skeleton className="h-24 w-24 rounded-full" />
          ) : (
            <Avatar className="h-24 w-24">
              <AvatarImage
                src={currentUserProfile?.photoURL || userAvatar.imageUrl}
                data-ai-hint={userAvatar.imageHint}
              />
              <AvatarFallback>
                {currentUserProfile?.displayName?.charAt(0) || 'U'}
              </AvatarFallback>
            </Avatar>
          )}
          <div className="pt-2">
            <CardTitle className="text-3xl">
              {userProfileLoading ? (
                <Skeleton className="h-8 w-40" />
              ) : (
                currentUserProfile?.displayName || 'Fitness Enthusiast'
              )}
            </CardTitle>
            <CardDescription className="pt-1">
              {userProfileLoading ? (
                 <Skeleton className="h-5 w-24" />
              ) : (
                `Level ${currentLevel}`
              )}
            </CardDescription>
          </div>
           <div className="flex items-center justify-center gap-2 mt-4">
             <Button asChild variant="outline" size="sm">
                  <Link href="/settings">Edit Profile</Link>
              </Button>
              <Button onClick={handleLogout} variant="ghost" size="sm" className="text-destructive hover:bg-destructive/10 hover:text-destructive" disabled>
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
              </Button>
            </div>
        </CardHeader>
        <CardContent>
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

      <Card>
        <CardHeader>
          <CardTitle>Key Stats</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
           <div className="flex flex-col items-center justify-center p-4 rounded-lg bg-background">
                <div className="text-4xl font-bold flex items-center gap-2">
                    <Flame className="h-8 w-8 text-success" />
                    {userProfileLoading ? <Skeleton className='w-12 h-10' /> : (currentUserProfile?.streak ?? 5)}
                </div>
                <div className="text-sm text-muted-foreground mt-1">Day Streak</div>
            </div>
            <div className="flex flex-col items-center justify-center p-4 rounded-lg bg-background">
                <div className="text-4xl font-bold flex items-center gap-2">
                    <Dumbbell className="h-8 w-8 text-primary" />
                    {userProfileLoading ? <Skeleton className='w-16 h-10' /> : (currentUserProfile?.totalWorkoutsThisMonth ?? 12)}
                </div>
                <div className="text-sm text-muted-foreground mt-1">Workouts This Month</div>
            </div>
             <div className="flex flex-col items-center justify-center p-4 rounded-lg bg-background">
                <div className="text-4xl font-bold flex items-center gap-2">
                    <Footprints className="h-8 w-8 text-primary" />
                    {userProfileLoading ? <Skeleton className='w-24 h-10' /> : (currentUserProfile?.stepsToday ?? 8045).toLocaleString()}
                </div>
                <div className="text-sm text-muted-foreground mt-1">Steps Today</div>
            </div>
             <div className="flex flex-col items-center justify-center p-4 rounded-lg bg-background">
                <div className="text-4xl font-bold flex items-center gap-2">
                    <Bed className="h-8 w-8 text-accent" />
                    {userProfileLoading ? <Skeleton className='w-16 h-10' /> : (currentUserProfile?.hoursSlept ?? 7)}
                </div>
                <div className="text-sm text-muted-foreground mt-1">Hours Slept</div>
            </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
            <CardTitle>Achievements</CardTitle>
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
    </div>
  );
}
