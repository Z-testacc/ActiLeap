import type { LucideIcon } from 'lucide-react';
import type { Timestamp } from 'firebase/firestore';

export type ImagePlaceholder = {
  id: string;
  description: string;
  imageUrl: string;
  imageHint: string;
  width: number;
  height: number;
};

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

export type WorkoutCategory = 'Strength' | 'Cardio' | 'Yoga' | 'HIIT' | 'Stretching' | 'Rehabilitation';
export type WorkoutIntensity = 'Beginner' | 'Intermediate' | 'Advanced';

export type WorkoutStep = {
  instruction: string;
  duration: number; // in seconds
  animationUrl: ImagePlaceholder;
};

export type Workout = {
  slug: string;
  title: string;
  category: WorkoutCategory;
  duration: number; // in minutes
  calories: number;
  intensity: WorkoutIntensity;
  equipment: string[];
  description: string;
  image: ImagePlaceholder;
  steps: WorkoutStep[];
  translations?: {
    [key: string]: { // language code e.g. 'es'
      title: string;
      description: string;
      steps: {
        instruction: string;
      }[];
    };
  };
};

export type ProgressData = {
  date: string;
  activity: number; // in minutes
  calories: number;
};

export type Achievement = {
  id: string;
  title: string;
  description:string;
  icon: LucideIcon;
};

export type PostCategory = 'General' | 'Nutrition' | 'Cardio' | 'Strength' | 'Recovery';

export type CommunityPost = {
  id: string;
  authorId: string;
  authorName: string;
  authorPhotoURL?: string;
  content: string;
  createdAt: Timestamp;
  likeCount?: number;
  commentCount?: number;
  likedBy?: string[];
  category: PostCategory;
};

export type CommunityComment = {
  id: string;
  authorId: string;
  authorName: string;
  authorPhotoURL?: string;
  content: string;
  createdAt: Timestamp;
};

export type Challenge = {
  id: string;
  authorId?: string;
  title: string;
  description: string;
  type: 'time-bound' | 'performance-based';
  goalValue: number;
  goalUnit: string;
  participantCount: number;
  participants?: string[];
  createdAt?: Timestamp;
  endDate?: Timestamp;
};

export type WorkoutExercise = {
  name: string;
  sets: number;
  reps: number;
  weight: number;
};

export type WorkoutLog = {
  id: string;
  userId: string;
  date: Timestamp;
  workoutTitle: string;
  duration: number;
  calories: number;
  exercises?: WorkoutExercise[];
  difficultyRating?: 'easy' | 'moderate' | 'hard';
};

export type UserProfile = {
  id:string;
  displayName: string;
  photoURL?: string;
  age?: number;
  primaryGoal?: 'weight-loss' | 'muscle-gain' | 'general-fitness' | 'endurance';
  xp: number;
  unlockedBadges?: string[];
  joinedGroups?: string[];
  joinedChallenges?: string[];
  lastDailyChallengeDate?: string;
  streak?: number;
  lastWorkoutDate?: string;
  totalCaloriesThisMonth?: number;
  totalWorkoutsThisMonth?: number;
  lastActivityMonth?: string;
  totalCaloriesThisWeek?: number;
  totalWorkoutsThisWeek?: number;
  lastActivityWeek?: string;
  cumulativePushups?: number;
  postCount?: number;
  isMentor?: boolean;
  specialties?: string[];
  mentorId?: string;
  menteeIds?: string[];
  stepsToday?: number;
  hoursSlept?: number;
  dailyCalorieIntake?: number;
  dailyProtein?: number;
  dailyCarbs?: number;
  dailyFats?: number;
};

export type Group = {
  id: string;
  name: string;
  description: string;
  memberCount: number;
};

export type Participant = {
  userId: string;
  displayName: string;
  photoURL?: string;
};

export type GroupWorkoutSession = {
  id: string;
  hostId: string;
  hostName: string;
  hostPhotoURL?: string;
  workoutSlug: string;
  workoutTitle: string;
  startTime: Timestamp;
  participants: Participant[];
  status: 'active' | 'completed';
};
