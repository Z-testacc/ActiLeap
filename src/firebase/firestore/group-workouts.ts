'use client';

import {
  type Firestore,
  collection,
  addDoc,
  doc,
  updateDoc,
  arrayUnion,
  serverTimestamp,
} from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import type { Workout, Participant } from '@/lib/types';

type HostData = {
  hostId: string;
  hostName: string;
  hostPhotoURL?: string;
};

export async function createGroupWorkoutSession(
  db: Firestore,
  host: HostData,
  workout: Workout
): Promise<string | null> {
  if (!host.hostId) {
    throw new Error('User must be logged in to host a session.');
  }

  const sessionsCollection = collection(db, 'groupWorkoutSessions');

  const initialParticipant: Participant = {
    userId: host.hostId,
    displayName: host.hostName,
    photoURL: host.hostPhotoURL,
  };

  const newSession = {
    hostId: host.hostId,
    hostName: host.hostName,
    hostPhotoURL: host.hostPhotoURL,
    workoutSlug: workout.slug,
    workoutTitle: workout.title,
    startTime: serverTimestamp(),
    participants: [initialParticipant],
    status: 'active' as const,
  };

  try {
    const docRef = await addDoc(sessionsCollection, newSession);
    return docRef.id;
  } catch (serverError) {
    const permissionError = new FirestorePermissionError({
      path: sessionsCollection.path,
      operation: 'create',
      requestResourceData: newSession,
    });
    errorEmitter.emit('permission-error', permissionError);
    console.error('Create group session failed:', serverError);
    throw serverError; // Rethrow to be caught by UI
  }
}

export async function joinGroupWorkoutSession(
  db: Firestore,
  sessionId: string,
  participant: Participant
): Promise<void> {
  if (!participant.userId) {
    throw new Error('User must be logged in to join a session.');
  }

  const sessionRef = doc(db, 'groupWorkoutSessions', sessionId);

  const dataToUpdate = {
    participants: arrayUnion(participant),
  };

  try {
    await updateDoc(sessionRef, dataToUpdate);
  } catch (serverError) {
    const permissionError = new FirestorePermissionError({
      path: sessionRef.path,
      operation: 'update',
      requestResourceData: dataToUpdate,
    });
    errorEmitter.emit('permission-error', permissionError);
    console.error('Join group session failed:', serverError);
    throw serverError; // Rethrow to be caught by UI
  }
}
