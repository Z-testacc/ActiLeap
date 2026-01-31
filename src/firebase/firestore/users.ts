'use client';

import {
  doc,
  updateDoc,
  type Firestore,
} from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import type { UserProfile } from '@/lib/types';

export function updateUserProfile(
  db: Firestore,
  userId: string,
  data: Partial<UserProfile>
) {
  if (!userId) {
    return Promise.reject(new Error('User ID not provided.'));
  };
  const userRef = doc(db, 'users', userId);

  return updateDoc(userRef, data).catch(async serverError => {
    const permissionError = new FirestorePermissionError({
      path: userRef.path,
      operation: 'update',
      requestResourceData: data,
    });
    errorEmitter.emit('permission-error', permissionError);
    // Rethrow the error to be handled by the caller
    throw serverError;
  });
}
