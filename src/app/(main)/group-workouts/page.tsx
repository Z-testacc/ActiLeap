'use client';

import { useMemo } from 'react';
import { collection, query, where, orderBy, doc } from 'firebase/firestore';
import { useCollection, useFirestore, useDoc } from '@/firebase';
import type { GroupWorkoutSession, UserProfile, Participant } from '@/lib/types';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Users, Clock, Play } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { getImageData } from '@/lib/placeholder-images';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Timestamp } from 'firebase/firestore';
import { joinGroupWorkoutSession } from '@/firebase/firestore/group-workouts';
import { useToast } from '@/hooks/use-toast';

export default function GroupWorkoutsPage() {
  const firestore = useFirestore();
  const router = useRouter();
  const { toast } = useToast();

  const sessionsQuery = useMemo(() => {
    if (!firestore) return null;
    return query(
      collection(firestore, 'groupWorkoutSessions'),
      where('status', '==', 'active'),
      orderBy('startTime', 'desc')
    );
  }, [firestore]);

  const { data: sessions, loading } = useCollection(sessionsQuery);
  const userAvatar = getImageData('user-avatar');

  const handleJoinSession = async (session: GroupWorkoutSession) => {
    toast({
      variant: 'destructive',
      title: 'Action Disabled',
      description: 'Joining sessions is disabled as there is no signed-in user.',
    });
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Active Group Workouts
          </h1>
          <p className="text-muted-foreground">
            Join a live session with other members of the community.
          </p>
        </div>
        <Button asChild>
          <Link href="/workouts">Start a Public Workout</Link>
        </Button>
      </div>

      {loading && (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-10 w-full mt-4" />
              </CardContent>
              <CardFooter>
                <Skeleton className="h-10 w-full" />
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {!loading && sessions && sessions.length > 0 && (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {(sessions as GroupWorkoutSession[]).map(session => {
            const isParticipant = false;
            return (
              <Card key={session.id}>
                <CardHeader>
                  <CardTitle>{session.workoutTitle}</CardTitle>
                  <CardDescription>Hosted by {session.hostName}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      <span>
                        Started{' '}
                        {formatDistanceToNow(
                          (session.startTime as Timestamp).toDate(),
                          { addSuffix: true }
                        )}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      <span>{session.participants.length} participant(s)</span>
                    </div>
                  </div>
                  <div className="flex -space-x-2 overflow-hidden">
                    {session.participants.slice(0, 5).map(p => (
                      <Avatar
                        key={p.userId}
                        className="inline-block h-8 w-8 rounded-full ring-2 ring-background"
                      >
                        <AvatarImage src={p.photoURL || userAvatar.imageUrl} />
                        <AvatarFallback>
                          {p.displayName.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                    ))}
                    {session.participants.length > 5 && (
                      <Avatar className="inline-block h-8 w-8 rounded-full ring-2 ring-background">
                        <AvatarFallback>
                          +{session.participants.length - 5}
                        </AvatarFallback>
                      </Avatar>
                    )}
                  </div>
                </CardContent>
                <CardFooter>
                  <Button
                    className="w-full"
                    onClick={() => handleJoinSession(session)}
                    disabled={isParticipant}
                  >
                    <Play className="mr-2 h-4 w-4" />{' '}
                    {isParticipant ? 'Joined' : 'Join Workout'}
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}

      {!loading && (!sessions || sessions.length === 0) && (
        <Card className="flex flex-col items-center justify-center py-16 text-center">
          <CardContent className="pt-6">
            <Users className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold">No Active Sessions</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              There are no public group workouts happening right now.
            </p>
            <Button className="mt-4" asChild>
              <Link href="/workouts">Be the first to start one!</Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
