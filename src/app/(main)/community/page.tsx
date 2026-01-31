'use client';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { Users, Heart, MessageSquare, Trophy, Loader2, MoreVertical, Trash2, Users2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCollection, useFirestore, useDoc } from '@/firebase';
import { useState, useMemo, useEffect } from 'react';
import { collection, query, orderBy, limit, doc, Timestamp, where } from 'firebase/firestore';
import type { UserProfile, CommunityPost, CommunityComment, Group, Challenge, PostCategory } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { getImageData } from '@/lib/placeholder-images';
import { addPost, toggleLikePost, addComment, deletePost, deleteComment } from '@/firebase/firestore/posts';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { ScrollArea } from '@/components/ui/scroll-area';
import { seedGroups, toggleGroupMembership } from '@/firebase/firestore/groups';
import { seedChallenges, toggleChallengeParticipation } from '@/firebase/firestore/challenges';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const postCategories: PostCategory[] = ['General', 'Nutrition', 'Cardio', 'Strength', 'Recovery'];

export default function CommunityPage() {
  const firestore = useFirestore();
  const { toast } = useToast();

  const [postContent, setPostContent] = useState('');
  const [postCategory, setPostCategory] = useState<PostCategory>('General');
  const [isPosting, setIsPosting] = useState(false);
  const [isSeeding, setIsSeeding] = useState(true);
  const [postToDelete, setPostToDelete] = useState<string | null>(null);
  const [activeFeedCategory, setActiveFeedCategory] = useState<PostCategory | 'All'>('All');

  useEffect(() => {
    if (firestore) {
        Promise.all([seedGroups(firestore), seedChallenges(firestore)]).finally(() => setIsSeeding(false));
    }
  }, [firestore]);
  
  const userProfileRef = null; // No user
  const { data: userProfile } = useDoc(userProfileRef);

  const leaderboardQuery = useMemo(() => {
    if (!firestore) return null;
    return query(
      collection(firestore, 'users'),
      orderBy('xp', 'desc'),
      limit(5)
    );
  }, [firestore]);

  const { data: leaderboardData, loading: leaderboardLoading } =
    useCollection(leaderboardQuery);

  const postsQuery = useMemo(() => {
    if (!firestore) return null;
    const postsCollection = collection(firestore, 'posts');
    if (activeFeedCategory === 'All') {
        return query(postsCollection, orderBy('createdAt', 'desc'), limit(20));
    }
    return query(postsCollection, where('category', '==', activeFeedCategory), orderBy('createdAt', 'desc'), limit(20));
  }, [firestore, activeFeedCategory]);

  const { data: posts, loading: postsLoading } = useCollection(postsQuery);
  
  const groupsQuery = useMemo(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'groups'), orderBy('name', 'asc'));
  }, [firestore]);

  const { data: groups, loading: groupsLoading } = useCollection(groupsQuery);
  const joinedGroups: string[] = [];

  const challengesQuery = useMemo(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'challenges'), orderBy('endDate', 'asc'));
  }, [firestore]);

  const { data: challenges, loading: challengesLoading } = useCollection(challengesQuery);
  const joinedChallenges: string[] = [];
  
  const handleJoinToggle = () => {
    toast({
      variant: 'destructive',
      title: 'Action Disabled',
      description: 'Joining groups is disabled as there is no signed-in user.',
    });
  };

  const handleChallengeJoinToggle = async () => {
    toast({
      variant: 'destructive',
      title: 'Action Disabled',
      description: 'Joining challenges is disabled as there is no signed-in user.',
    });
  };

  const handlePost = async () => {
     toast({
      variant: 'destructive',
      title: 'Action Disabled',
      description: 'Posting is disabled as there is no signed-in user.',
    });
  };
  
  const handleLike = () => {
    toast({
      variant: 'destructive',
      title: 'Action Disabled',
      description: 'Liking posts is disabled as there is no signed-in user.',
    });
  };
  
  const handleDeletePost = () => {
    if (!firestore || !postToDelete) return;
    toast({
      variant: 'destructive',
      title: 'Action Disabled',
      description: 'Deleting posts is disabled as there is no signed-in user.',
    });
    setPostToDelete(null);
  }

  const userAvatar = getImageData('user-avatar');

  return (
    <>
      <AlertDialog open={!!postToDelete} onOpenChange={(open) => !open && setPostToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your post.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeletePost} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>Share your progress</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Textarea
                  placeholder="Sign in to share your progress with the community."
                  value={postContent}
                  onChange={e => setPostContent(e.target.value)}
                  disabled
                />
                 <Select value={postCategory} onValueChange={(v) => setPostCategory(v as PostCategory)} disabled>
                    <SelectTrigger className="w-full sm:w-[180px]">
                        <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                        {postCategories.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                    </SelectContent>
                </Select>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button onClick={handlePost} disabled>
                {isPosting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Post
              </Button>
            </CardFooter>
          </Card>

          <Tabs defaultValue="feed" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="feed">Feed</TabsTrigger>
              <TabsTrigger value="challenges">Challenges</TabsTrigger>
              <TabsTrigger value="groups">Groups</TabsTrigger>
              <TabsTrigger value="group-workouts">Live Workouts</TabsTrigger>
            </TabsList>
            
            <TabsContent value="feed" className="mt-6 space-y-6">
              <Tabs defaultValue="All" onValueChange={(val) => setActiveFeedCategory(val as PostCategory | 'All')}>
                  <TabsList className="flex-wrap h-auto">
                    <TabsTrigger value="All">All</TabsTrigger>
                    {postCategories.map(cat => (
                      <TabsTrigger key={cat} value={cat}>{cat}</TabsTrigger>
                    ))}
                  </TabsList>
              </Tabs>
              {(postsLoading || isSeeding) && (
                <div className="space-y-4 pt-4">
                  <Skeleton className="h-40 w-full" />
                  <Skeleton className="h-40 w-full" />
                  <Skeleton className="h-40 w-full" />
                </div>
              )}
              {!(postsLoading || isSeeding) && posts?.length === 0 && (
                <Card>
                    <CardContent className="pt-6 text-center text-muted-foreground">
                        <p>The feed is quiet... Be the first to post something!</p>
                    </CardContent>
                </Card>
              )}
              {(posts as CommunityPost[])?.map(post => {
                const isLiked = false;
                const isAuthor = false;

                return (
                  <Card key={post.id} className="transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
                    <Collapsible>
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-4">
                            <Avatar>
                              <AvatarImage
                                src={post.authorPhotoURL || userAvatar.imageUrl}
                                data-ai-hint={'person portrait'}
                              />
                              <AvatarFallback>
                                {post.authorName.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-semibold">{post.authorName}</p>
                              <p className="text-xs text-muted-foreground">
                                {post.createdAt ? formatDistanceToNow((post.createdAt as Timestamp).toDate(), { addSuffix: true }) : 'just now'}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {post.category && post.category !== 'General' && (
                                <Badge variant="secondary">{post.category}</Badge>
                            )}
                            {isAuthor && (
                                <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                    <MoreVertical className="h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem
                                    className="text-destructive"
                                    onSelect={() => setPostToDelete(post.id)}
                                    >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Delete
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                                </DropdownMenu>
                            )}
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="break-words whitespace-pre-wrap">{post.content}</p>
                      </CardContent>
                      <CardFooter className="flex gap-4">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="flex items-center gap-2 text-muted-foreground transition-transform active:scale-125"
                          onClick={() => handleLike()}
                        >
                          <Heart className={cn("h-4 w-4", isLiked && "fill-red-500 text-red-500")} /> {post.likeCount ?? 0}
                        </Button>
                        <CollapsibleTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="flex items-center gap-2 text-muted-foreground"
                          >
                            <MessageSquare className="h-4 w-4" /> {post.commentCount ?? 0}
                          </Button>
                        </CollapsibleTrigger>
                      </CardFooter>
                      <CollapsibleContent>
                        <PostComments postId={post.id} />
                      </CollapsibleContent>
                    </Collapsible>
                  </Card>
                )
              })}
            </TabsContent>
            
            <TabsContent value="challenges" className="mt-6 space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold tracking-tight">Community Challenges</h2>
                <Button asChild>
                    <Link href="/challenges/create">Create Peer Challenge</Link>
                </Button>
              </div>
              {(challengesLoading || isSeeding) &&
                Array.from({ length: 2 }).map((_, i) => (
                  <Card key={i}>
                    <CardHeader>
                      <Skeleton className="h-5 w-3/4" />
                      <Skeleton className="h-4 w-full" />
                    </CardHeader>
                    <CardContent>
                      <Skeleton className="h-2 w-full" />
                      <div className="flex items-center justify-between mt-2">
                        <Skeleton className="h-4 w-1/4" />
                        <Skeleton className="h-4 w-1/4" />
                      </div>
                    </CardContent>
                    <CardFooter>
                       <Skeleton className="h-9 w-full" />
                    </CardFooter>
                  </Card>
                ))}
              {!(challengesLoading || isSeeding) &&
                (challenges as Challenge[])?.map(challenge => {
                  const progress = Math.floor(Math.random() * 81) + 10;
                  const isParticipant = joinedChallenges.includes(challenge.id);
                  return (
                    <Card key={challenge.id} className="transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
                      <CardHeader>
                        <CardTitle>{challenge.title}</CardTitle>
                        <CardDescription>{challenge.description}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <Progress value={progress} className="h-2" />
                        <div className="flex items-center justify-between text-xs text-muted-foreground mt-2">
                          <span>{progress}% complete</span>
                          <div className="flex items-center">
                            <Users className="h-3 w-3 mr-1" />
                            <span>
                              {challenge.participantCount.toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </CardContent>
                      <CardFooter>
                        <Button
                          variant={isParticipant ? 'default' : 'outline'}
                          size="sm"
                          className="w-full"
                          onClick={() => handleChallengeJoinToggle()}
                          disabled
                        >
                          {isParticipant ? 'Joined' : 'Join Challenge'}
                        </Button>
                      </CardFooter>
                    </Card>
                  );
                })}
            </TabsContent>
            
            <TabsContent value="groups" className="mt-6 space-y-4">
              <h2 className="text-2xl font-bold tracking-tight">Workout Groups</h2>
              {(groupsLoading || isSeeding) && (
                Array.from({ length: 3 }).map((_, i) => (
                    <Card key={i} className="p-4">
                        <div className="flex items-center justify-between">
                            <div className='space-y-2'>
                            <Skeleton className="h-5 w-32" />
                            <Skeleton className="h-4 w-20" />
                            </div>
                            <Skeleton className="h-9 w-20" />
                        </div>
                    </Card>
                ))
              )}
              {!(groupsLoading || isSeeding) && (groups as Group[])?.map(group => {
                const isMember = joinedGroups.includes(group.id);
                return (
                  <Card key={group.id} className="transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
                    <CardContent className="p-4 flex items-center justify-between">
                        <div>
                            <p className="font-semibold">{group.name}</p>
                            <p className="text-sm text-muted-foreground">{group.memberCount.toLocaleString()} members</p>
                        </div>
                        <Button 
                            variant={isMember ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => handleJoinToggle()}
                            disabled
                        >
                            {isMember ? 'Joined' : 'Join'}
                        </Button>
                    </CardContent>
                  </Card>
                )
              })}
            </TabsContent>

            <TabsContent value="group-workouts" className="mt-6 space-y-4 text-center">
                 <Card>
                    <CardHeader>
                        <CardTitle>Join a Live Session</CardTitle>
                        <CardDescription>Workout with other members of the community in real-time.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Users2 className="mx-auto h-12 w-12 text-muted-foreground" />
                        <p className="mt-2 text-sm text-muted-foreground">
                         Find active group workouts and start a session with others.
                        </p>
                    </CardContent>
                    <CardFooter>
                        <Button asChild className="w-full">
                            <Link href="/group-workouts">View Active Sessions</Link>
                        </Button>
                    </CardFooter>
                </Card>
            </TabsContent>
          </Tabs>

        </div>

        <div className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="text-secondary" />
                Leaderboard
              </CardTitle>
              <CardDescription>
                See how you rank against the community.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {leaderboardLoading &&
                Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-4 rounded-md p-2">
                    <Skeleton className="h-6 w-6" />
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-24" />
                    </div>
                    <Skeleton className="h-4 w-16" />
                  </div>
                ))}
              {!leaderboardLoading &&
                (leaderboardData as UserProfile[])?.map((entry, index) => {
                  const isCurrentUser = false;
                  return (
                    <div
                      key={entry.id}
                      className={cn(
                        'flex items-center gap-4 rounded-md p-2',
                        isCurrentUser && 'bg-primary/10'
                      )}
                    >
                      <div className="font-bold text-lg w-6 text-center">
                        {index + 1}
                      </div>
                      <Avatar>
                        <AvatarImage
                          src={entry.photoURL || userAvatar.imageUrl}
                          data-ai-hint={'person portrait'}
                        />
                        <AvatarFallback>
                          {entry.displayName?.charAt(0) || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p
                          className={cn(
                            'font-semibold',
                            isCurrentUser && 'text-primary'
                          )}
                        >
                          {entry.displayName}
                        </p>
                      </div>
                      <div className="font-bold text-primary">
                        {entry.xp.toLocaleString()} XP
                      </div>
                    </div>
                  );
                })}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}

function PostComments({ postId }: { postId: string }) {
  const firestore = useFirestore();
  const { toast } = useToast();
  const [commentContent, setCommentContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [commentToDelete, setCommentToDelete] = useState<string | null>(null);

  const commentsQuery = useMemo(() => {
    if (!firestore) return null;
    return query(
      collection(firestore, 'posts', postId, 'comments'),
      orderBy('createdAt', 'asc'),
      limit(50)
    );
  }, [firestore, postId]);

  const { data: comments, loading: commentsLoading } = useCollection(commentsQuery);
  const userAvatar = getImageData('user-avatar');

  const handleAddComment = () => {
    toast({
      variant: 'destructive',
      title: 'Action Disabled',
      description: 'Commenting is disabled as there is no signed-in user.',
    });
  };
  
  const handleDeleteComment = () => {
    toast({
        variant: 'destructive',
        title: 'Action Disabled',
        description: 'Deleting comments is disabled as there is no signed-in user.',
    });
    setCommentToDelete(null);
  };

  return (
    <>
      <AlertDialog open={!!commentToDelete} onOpenChange={(open) => !open && setCommentToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your comment.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteComment} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <div className="px-6 pb-6 pt-2 space-y-4 bg-muted/50 border-t">
        {commentsLoading && (
          <div className="space-y-2 p-2">
            <Skeleton className="h-10 w-full" />
          </div>
        )}
        <ScrollArea className="max-h-60 pr-4">
          <div className="space-y-4">
            {(comments as CommunityComment[])?.map(comment => {
              const isAuthor = false;
              return (
              <div key={comment.id} className="flex items-start gap-3 group">
                <Avatar className="h-8 w-8">
                  <AvatarImage
                    src={comment.authorPhotoURL || userAvatar.imageUrl}
                    data-ai-hint={'person portrait'}
                  />
                  <AvatarFallback>{comment.authorName.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="bg-background rounded-lg p-3 text-sm flex-1">
                  <p className="font-semibold">{comment.authorName}</p>
                  <p className="text-muted-foreground break-words whitespace-pre-wrap">{comment.content}</p>
                  <p className="text-xs text-muted-foreground pt-1">
                    {comment.createdAt ? formatDistanceToNow((comment.createdAt as Timestamp).toDate(), { addSuffix: true }) : 'just now'}
                  </p>
                </div>
                {isAuthor && (
                   <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          className="text-destructive"
                          onSelect={() => setCommentToDelete(comment.id)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                )}
              </div>
            )})}
          </div>
        </ScrollArea>
        {!commentsLoading && comments?.length === 0 && (
            <p className="text-sm text-center text-muted-foreground py-4">No comments yet. Be the first to reply!</p>
          )}
        <div className="flex gap-2 pt-2">
          <Textarea 
            placeholder="Write a comment..."
            className="text-sm bg-background"
            value={commentContent}
            onChange={(e) => setCommentContent(e.target.value)}
            disabled
            rows={1}
          />
          <Button onClick={handleAddComment} disabled>
            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Post"}
          </Button>
        </div>
      </div>
    </>
  )
}
