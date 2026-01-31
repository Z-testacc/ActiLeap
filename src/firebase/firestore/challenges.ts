'use client';
import {
  type Firestore,
  collection,
  doc,
  getDoc,
  writeBatch,
  runTransaction,
  arrayUnion,
  arrayRemove,
  increment,
  serverTimestamp,
} from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { addDays } from 'date-fns';
import type { Challenge, UserProfile } from '@/lib/types';

type ChallengePayload = Omit<
  Challenge,
  'id' | 'participantCount' | 'participants' | 'createdAt'
> & {
  authorId: string;
};

const initialChallengesData = [
  {
    id: 'weekly-cardio-burn',
    title: 'Weekly Cardio Burn',
    description: 'Burn 2,500 calories through cardio this week.',
    type: 'time-bound' as const,
    goalValue: 2500,
    goalUnit: 'calories',
    participantCount: Math.floor(Math.random() * 800) + 200,
    participants: [],
    endDate: addDays(new Date(), 7),
  },
  {
    id: 'monthly-pushup-challenge',
    title: 'Monthly Push-up Challenge',
    description: 'Complete 500 push-ups before the end of the month.',
    type: 'performance-based' as const,
    goalValue: 500,
    goalUnit: 'pushups',
    participantCount: Math.floor(Math.random() * 500) + 100,
    participants: [],
    endDate: addDays(new Date(), 30),
  },
  {
    id: 'weekend-warrior-5k',
    title: 'Weekend Warrior 5k',
    description: 'Log a 5k run this weekend.',
    type: 'time-bound' as const,
    goalValue: 5,
    goalUnit: 'km',
    participantCount: Math.floor(Math.random() * 300) + 50,
    participants: [],
    endDate: addDays(new Date(), 3),
  },
];

export async function seedChallenges(db: Firestore) {
  const challengesCollection = collection(db, 'challenges');
  const batch = writeBatch(db);
  let hasWrites = false;

  for (const challenge of initialChallengesData) {
    const challengeRef = doc(challengesCollection, challenge.id);
    try {
      const docSnap = await getDoc(challengeRef);
      if (!docSnap.exists()) {
        hasWrites = true;
        batch.set(challengeRef, challenge);
      }
    } catch (error) {
      console.error(`Failed to check challenge ${challenge.id}:`, error);
      const permissionError = new FirestorePermissionError({
        path: challengeRef.path,
        operation: 'get',
      });
      errorEmitter.emit('permission-error', permissionError);
    }
  }

  if (hasWrites) {
    try {
      await batch.commit();
      console.log('Initial challenges have been seeded.');
    } catch (error) {
      console.error('Challenge seeding transaction failed: ', error);
      const permissionError = new FirestorePermissionError({
        path: challengesCollection.path,
        operation: 'write',
      });
      errorEmitter.emit('permission-error', permissionError);
    }
  }
}

export async function toggleChallengeParticipation(
  db: Firestore,
  userId: string,
  challengeId: string,
  isParticipant: boolean
): Promise<{ badgeUnlocked?: string }> {
  const userRef = doc(db, 'users', userId);
  const challengeRef = doc(db, 'challenges', challengeId);

  try {
    const badgeUnlocked = await runTransaction(db, async transaction => {
      const userDoc = await transaction.get(userRef);
      if (!userDoc.exists()) {
        throw new Error('User document does not exist!');
      }

      const userUpdateData: { [key: string]: any } = {};
      let unlockedBadgeId: string | undefined = undefined;

      if (isParticipant) {
        // Leaving the challenge
        userUpdateData.joinedChallenges = arrayRemove(challengeId);
      } else {
        // Joining the challenge
        const userData = userDoc.data() as UserProfile;
        userUpdateData.joinedChallenges = arrayUnion(challengeId);
        userUpdateData.xp = increment(10); // Award 10 XP for joining

        // Check if 'first-challenge' badge needs to be awarded
        if (!userData.unlockedBadges?.includes('first-challenge')) {
          userUpdateData.unlockedBadges = arrayUnion('first-challenge');
          unlockedBadgeId = 'first-challenge';
        }
      }

      transaction.update(userRef, userUpdateData);
      transaction.update(challengeRef, {
        participants: isParticipant ? arrayRemove(userId) : arrayUnion(userId),
        participantCount: increment(isParticipant ? -1 : 1),
      });

      return unlockedBadgeId;
    });

    return { badgeUnlocked };
  } catch (serverError) {
    console.error('Challenge participation transaction failed: ', serverError);
    const permissionError = new FirestorePermissionError({
      path: `transaction on ${userRef.path} and ${challengeRef.path}`,
      operation: 'update',
    });
    errorEmitter.emit('permission-error', permissionError);
    // Rethrow to be caught by the UI
    throw serverError;
  }
}

export function createChallenge(db: Firestore, challengeData: ChallengePayload) {
  if (!challengeData.authorId) {
    return Promise.reject(
      new Error('User must be logged in to create a challenge.')
    );
  }

  const userRef = doc(db, 'users', challengeData.authorId);
  const newChallengeRef = doc(collection(db, 'challenges'));

  const newChallengeData = {
    ...challengeData,
    participantCount: 1,
    participants: [challengeData.authorId],
    createdAt: serverTimestamp(),
  };

  return runTransaction(db, async transaction => {
    // 1. Create the new challenge
    transaction.set(newChallengeRef, newChallengeData);

    // 2. Add the challenge to the user's list of joined challenges
    transaction.update(userRef, {
      joinedChallenges: arrayUnion(newChallengeRef.id),
    });
  }).catch(serverError => {
    const permissionError = new FirestorePermissionError({
      path: `transaction on ${newChallengeRef.path} and ${userRef.path}`,
      operation: 'write',
      requestResourceData: newChallengeData,
    });
    errorEmitter.emit('permission-error', permissionError);
    console.error('Create challenge transaction failed: ', serverError);
    // Rethrow to be caught by the UI
    throw serverError;
  });
}
