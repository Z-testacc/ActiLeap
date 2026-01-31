'use client';
import {
  runTransaction,
  type Firestore,
  arrayUnion,
  arrayRemove,
  increment,
  collection,
  doc,
  getDoc,
  writeBatch,
} from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { initialGroupsData } from '@/lib/groups';

export function toggleGroupMembership(
  db: Firestore,
  userId: string,
  groupId: string,
  isMember: boolean
) {
  const userRef = doc(db, 'users', userId);
  const groupRef = doc(db, 'groups', groupId);

  runTransaction(db, async transaction => {
    // Update user profile
    transaction.update(userRef, {
      joinedGroups: isMember ? arrayRemove(groupId) : arrayUnion(groupId),
    });

    // Update group member count
    transaction.update(groupRef, {
      memberCount: increment(isMember ? -1 : 1),
    });
  }).catch(async serverError => {
    const permissionError = new FirestorePermissionError({
      path: `transaction on ${userRef.path} and ${groupRef.path}`,
      operation: 'update',
    });
    errorEmitter.emit('permission-error', permissionError);
    console.error('Transaction failed: ', serverError);
  });
}

export async function seedGroups(db: Firestore) {
  const groupsCollection = collection(db, 'groups');
  const batch = writeBatch(db);
  let hasWrites = false;

  for (const group of initialGroupsData) {
    const groupRef = doc(groupsCollection, group.id);
    try {
      const docSnap = await getDoc(groupRef);
      if (!docSnap.exists()) {
        hasWrites = true;
        batch.set(groupRef, {
          name: group.name,
          description: group.description,
          memberCount: Math.floor(Math.random() * 200) + 10, // Random initial members
        });
      }
    } catch (error) {
      console.error(`Failed to check group ${group.id}:`, error);
       const permissionError = new FirestorePermissionError({
        path: groupRef.path,
        operation: 'get',
      });
      errorEmitter.emit('permission-error', permissionError);
    }
  }

  if (hasWrites) {
    try {
      await batch.commit();
      console.log('Initial groups have been seeded.');
    } catch (error) {
      console.error('Group seeding transaction failed: ', error);
       const permissionError = new FirestorePermissionError({
        path: groupsCollection.path,
        operation: 'write',
      });
      errorEmitter.emit('permission-error', permissionError);
    }
  }
}
