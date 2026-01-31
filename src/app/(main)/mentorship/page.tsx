'use client';

import { useState, useMemo } from 'react';
import { useCollection, useFirestore, useDoc } from '@/firebase';
import { collection, query, where, doc } from 'firebase/firestore';
import { updateUserProfile } from '@/firebase/firestore/users';
import type { UserProfile } from '@/lib/types';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { Star, Loader2, Handshake } from 'lucide-react';
import { getImageData } from '@/lib/placeholder-images';
import { getLevelFromXp } from '@/lib/xp';

function MentorCard({ mentor }: { mentor: UserProfile }) {
  const userAvatar = getImageData('user-avatar');
  return (
    <Card className="transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
      <CardHeader className="flex flex-row items-center gap-4">
        <Avatar className="h-16 w-16">
          <AvatarImage src={mentor.photoURL || userAvatar.imageUrl} data-ai-hint="person portrait" />
          <AvatarFallback>{mentor.displayName?.charAt(0) || 'M'}</AvatarFallback>
        </Avatar>
        <div>
          <CardTitle>{mentor.displayName}</CardTitle>
          <CardDescription>Level {getLevelFromXp(mentor.xp || 0)} Fitness Enthusiast</CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        {mentor.specialties && mentor.specialties.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {mentor.specialties.map(specialty => (
              <Badge key={specialty} variant="secondary">{specialty}</Badge>
            ))}
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Button className="w-full" disabled>
            <Handshake className="mr-2 h-4 w-4" />
            Request Mentorship
        </Button>
      </CardFooter>
    </Card>
  );
}

export default function MentorshipPage() {
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isUpdating, setIsUpdating] = useState(false);

  const mentorsQuery = useMemo(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'users'), where('isMentor', '==', true));
  }, [firestore]);

  const { data: mentors, loading: mentorsLoading } = useCollection(mentorsQuery);

  const { data: userProfile, loading: profileLoading } = useDoc(null);
  const currentUser = userProfile as UserProfile | null;

  const handleBecomeMentor = () => {
    toast({
        variant: "destructive",
        title: "Action Disabled",
        description: "This feature is disabled as there is no signed-in user."
    });
  };
  
  const userAvatar = getImageData('user-avatar');

  const YourMentorSection = () => {
      return (
        <Card className="bg-gradient-to-br from-primary/80 to-primary text-primary-foreground animate-in fade-in-from-bottom-8 duration-500">
            <CardHeader>
                <CardTitle>Your Mentor</CardTitle>
                <CardDescription className="text-primary-foreground/80">Your guide on your fitness journey.</CardDescription>
            </CardHeader>
            <CardContent className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                    <AvatarImage src={userAvatar.imageUrl} />
                    <AvatarFallback>M</AvatarFallback>
                </Avatar>
                <div>
                    <p className="text-2xl font-bold">Alex Mentor</p>
                    <p className="text-sm">Strength Training, Nutrition</p>
                </div>
            </CardContent>
        </Card>
      )
  };

  const YourMenteesSection = () => {
    return (
        <Card className="animate-in fade-in-from-bottom-8 duration-500">
            <CardHeader>
                <CardTitle>Your Mentees</CardTitle>
                <CardDescription>The users you are currently guiding.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="text-center text-muted-foreground p-8">You have no mentees yet.</div>
            </CardContent>
        </Card>
    )
  };


  const FindMentorSection = () => (
    <div className="space-y-8 animate-in fade-in-from-bottom-8 duration-500">
        <Card>
            <CardHeader>
                <CardTitle className="text-3xl">Find a Mentor</CardTitle>
                <CardDescription>Connect with experienced users who can guide you on your fitness journey.</CardDescription>
            </CardHeader>
            <CardContent>
                <p className="text-muted-foreground">Mentors can review your workout logs, provide feedback, and help you stay motivated. Find a mentor whose specialities match your goals to get started.</p>
            </CardContent>
            <CardFooter>
                <Button onClick={handleBecomeMentor} disabled={isUpdating || currentUser?.isMentor} variant="outline">
                    {isUpdating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Star className="mr-2 h-4 w-4" />}
                    Become a Mentor
                </Button>
            </CardFooter>
        </Card>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {mentorsLoading && Array.from({length: 3}).map((_, i) => <Skeleton key={i} className="h-64 w-full" />)}
            {!mentorsLoading && mentors && (mentors as UserProfile[]).map(mentor => (
                <MentorCard key={mentor.id} mentor={mentor} />
            ))}
        </div>
        {!mentorsLoading && (!mentors || mentors.length === 0) && (
            <Card>
                <CardContent className="py-16 text-center text-muted-foreground">
                    <p>No mentors are available right now. Check back later or become one yourself!</p>
                </CardContent>
            </Card>
        )}
    </div>
  );

  if (profileLoading) {
      return (
          <div className="space-y-8 animate-in fade-in-from-bottom-8 duration-500">
              <Skeleton className="h-48 w-full" />
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                <Skeleton className="h-64 w-full" />
                <Skeleton className="h-64 w-full" />
                <Skeleton className="h-64 w-full" />
              </div>
          </div>
      )
  }

  return <FindMentorSection />;
}
