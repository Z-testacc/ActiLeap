'use client';

import {
  collection,
  serverTimestamp,
  type Firestore,
  doc,
  runTransaction,
  increment,
  arrayUnion,
} from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import type { UserProfile, WorkoutExercise, WorkoutLog } from '@/lib/types';
import { XP_PER_WORKOUT } from '@/lib/xp';
import { getISOWeek, getYear } from 'date-fns';


type WorkoutLogPayload = {
  userId: string;
  workoutTitle: string;
  duration: number;
  calories: number;
  exercises?: WorkoutExercise[];
  difficultyRating?: 'easy' | 'moderate' | 'hard';
};

function getWeekId(date: Date): string {
  const year = getYear(date);
  const week = getISOWeek(date);
  return `${year}-W${String(week).padStart(2, '0')}`;
}

export async function addWorkoutLog(
  db: Firestore,
  log: WorkoutLogPayload
): Promise<{ unlockedBadges: string[] }> {
  if (!log.userId) {
    throw new Error('User must be logged in to add a workout log.');
  }
  
  const userRef = doc(db, 'users', log.userId);
  const logsCollection = collection(db, 'users', log.userId, 'workoutLogs');
  const newLogRef = doc(logsCollection);

  try {
    const unlockedBadges = await runTransaction(db, async transaction => {
      const badgesToUnlock: string[] = [];
      const userDoc = await transaction.get(userRef);
      
      const newLog = {
        ...log,
        date: serverTimestamp(),
      };
      transaction.set(newLogRef, newLog);

      if (!userDoc.exists()) {
        // If user profile doesn't exist, create it.
        let cumulativePushups = 0;
        if (log.exercises) {
          for (const exercise of log.exercises) {
            if (exercise.name.toLowerCase().includes('push-up') || exercise.name.toLowerCase().includes('push up')) {
              cumulativePushups += exercise.sets * exercise.reps;
            }
          }
        }
        
        badgesToUnlock.push('first-workout');
        if (cumulativePushups >= 100) {
            badgesToUnlock.push('push-up-pro');
        }

        const newUserProfile: UserProfile = {
            id: log.userId,
            displayName: 'New User',
            xp: XP_PER_WORKOUT,
            photoURL: '',
            unlockedBadges: badgesToUnlock,
            streak: 1,
            lastWorkoutDate: new Date().toISOString().split('T')[0],
            totalCaloriesThisMonth: log.calories,
            totalWorkoutsThisMonth: 1,
            lastActivityMonth: new Date().toISOString().substring(0, 7),
            totalCaloriesThisWeek: log.calories,
            totalWorkoutsThisWeek: 1,
            lastActivityWeek: getWeekId(new Date()),
            cumulativePushups: cumulativePushups,
            postCount: 0,
        };
        transaction.set(userRef, newUserProfile);
        return badgesToUnlock;
      }
      
      // User profile exists, update it.
      const userData = userDoc.data() as UserProfile;
      const today = new Date();
      const todayString = today.toISOString().split('T')[0];
      const currentMonth = todayString.substring(0, 7);
      const currentWeek = getWeekId(today);
      
      // Check for first workout badge
      const logsSnapshot = await getDocs(query(logsCollection));
      if (logsSnapshot.size === 0 && !userData.unlockedBadges?.includes('first-workout')) {
          badgesToUnlock.push('first-workout');
      }

      // Calculate streak
      let newStreak = userData.streak || 0;
      if (userData.lastWorkoutDate) {
        const lastDate = new Date(userData.lastWorkoutDate);
        const todayDate = new Date(todayString);
        lastDate.setHours(0, 0, 0, 0);
        todayDate.setHours(0, 0, 0, 0);
        const diffTime = todayDate.getTime() - lastDate.getTime();
        const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 1) {
          newStreak += 1;
        } else if (diffDays > 1) {
          newStreak = 1;
        }
      } else {
        newStreak = 1;
      }
      if (newStreak >= 7 && !userData.unlockedBadges?.includes('7-day-streak')) {
          badgesToUnlock.push('7-day-streak');
      }
      
      // Calculate monthly/weekly stats
      const monthlyCalories = (userData.lastActivityMonth === currentMonth) ? (userData.totalCaloriesThisMonth || 0) + log.calories : log.calories;
      const monthlyWorkouts = (userData.lastActivityMonth === currentMonth) ? (userData.totalWorkoutsThisMonth || 0) + 1 : 1;
      const weeklyCalories = (userData.lastActivityWeek === currentWeek) ? (userData.totalCaloriesThisWeek || 0) + log.calories : log.calories;
      const weeklyWorkouts = (userData.lastActivityWeek === currentWeek) ? (userData.totalWorkoutsThisWeek || 0) + 1 : 1;
      
      // Calculate cumulative pushups
      let newCumulativePushups = userData.cumulativePushups || 0;
      if (log.exercises) {
        for (const exercise of log.exercises) {
          if (exercise.name.toLowerCase().includes('push-up') || exercise.name.toLowerCase().includes('push up')) {
            newCumulativePushups += exercise.sets * exercise.reps;
          }
        }
      }
      if (newCumulativePushups >= 100 && !userData.unlockedBadges?.includes('push-up-pro')) {
          badgesToUnlock.push('push-up-pro');
      }
      
      // Prepare update data
      const userUpdateData: any = {
        xp: increment(XP_PER_WORKOUT),
        streak: newStreak,
        lastWorkoutDate: todayString,
        totalCaloriesThisMonth: monthlyCalories,
        totalWorkoutsThisMonth: monthlyWorkouts,
        lastActivityMonth: currentMonth,
        totalCaloriesThisWeek: weeklyCalories,
        totalWorkoutsThisWeek: weeklyWorkouts,
        lastActivityWeek: currentWeek,
        cumulativePushups: newCumulativePushups,
      };

      if (badgesToUnlock.length > 0) {
        userUpdateData.unlockedBadges = arrayUnion(...badgesToUnlock);
      }

      transaction.update(userRef, userUpdateData);
      
      return badgesToUnlock;
    });

    return { unlockedBadges };
  } catch (serverError) {
    console.error('Add workout log transaction failed:', serverError);
    const permissionError = new FirestorePermissionError({
      path: `transaction on ${userRef.path} and ${newLogRef.path}`,
      operation: 'write',
    });
    errorEmitter.emit('permission-error', permissionError);
    return { unlockedBadges: [] };
  }
}

export async function getAllWorkoutLogs(
  db: Firestore,
  userId: string
): Promise<WorkoutLog[]> {
  if (!userId) {
    throw new Error('User ID is required to get workout logs.');
  }
  const logsCollection = collection(db, 'users', userId, 'workoutLogs');
  const q = query(logsCollection, orderBy('date', 'desc'));

  try {
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as WorkoutLog[];
  } catch(serverError) {
     const permissionError = new FirestorePermissionError({
      path: logsCollection.path,
      operation: 'list',
    });
    errorEmitter.emit('permission-error', permissionError);
    return [];
  }
}

export function updateWorkoutLogFeedback(
  db: Firestore,
  userId: string,
  logId: string,
  difficultyRating: 'easy' | 'moderate' | 'hard'
) {
  if (!userId) {
    console.error('User ID is required to update feedback.');
    return;
  }
  const logRef = doc(db, 'users', userId, 'workoutLogs', logId);
  const dataToUpdate = { difficultyRating };
  updateDoc(logRef, dataToUpdate).catch(async serverError => {
    const permissionError = new FirestorePermissionError({
      path: logRef.path,
      operation: 'update',
      requestResourceData: dataToUpdate,
    });
    errorEmitter.emit('permission-error', permissionError);
  });
}
