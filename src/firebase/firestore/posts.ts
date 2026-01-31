'use client';
import {
  collection,
  addDoc,
  serverTimestamp,
  type Firestore,
  doc,
  updateDoc,
  increment,
  arrayUnion,
  arrayRemove,
  deleteDoc,
  writeBatch,
  runTransaction,
  getDoc,
} from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import type { PostCategory, UserProfile } from '@/lib/types';

type PostPayload = {
  authorId: string;
  authorName: string;
  authorPhotoURL?: string;
  content: string;
  category: PostCategory;
};

const TOP_CONTRIBUTOR_POST_COUNT = 10;

export async function addPost(
  db: Firestore,
  post: PostPayload
): Promise<{ badgeUnlocked?: string }> {
  if (!post.authorId) {
    throw new Error('User must be logged in to add a post.');
  }
  const postsCollection = collection(db, 'posts');
  const userRef = doc(db, 'users', post.authorId);

  try {
    const badgeUnlocked = await runTransaction(db, async transaction => {
      const userDoc = await transaction.get(userRef);
      if (!userDoc.exists()) {
        throw 'User document does not exist!';
      }
      const userData = userDoc.data() as UserProfile;

      const newPostCount = (userData.postCount || 0) + 1;

      // 1. Create the new post
      const newPost = {
        ...post,
        createdAt: serverTimestamp(),
        likeCount: 0,
        commentCount: 0,
        likedBy: [],
      };
      const newPostRef = doc(postsCollection);
      transaction.set(newPostRef, newPost);

      // 2. Update user's post count and potentially badges
      const userUpdateData: { [key: string]: any } = {
        postCount: newPostCount,
      };

      let unlockedBadgeId: string | undefined = undefined;
      if (
        newPostCount >= TOP_CONTRIBUTOR_POST_COUNT &&
        !userData.unlockedBadges?.includes('top-contributor')
      ) {
        userUpdateData.unlockedBadges = arrayUnion('top-contributor');
        unlockedBadgeId = 'top-contributor';
      }

      transaction.update(userRef, userUpdateData);
      return unlockedBadgeId;
    });

    return { badgeUnlocked };
  } catch (serverError) {
    console.error('Add post transaction failed:', serverError);
    const permissionError = new FirestorePermissionError({
      path: `transaction on ${userRef.path} and ${postsCollection.path}`,
      operation: 'write',
    });
    errorEmitter.emit('permission-error', permissionError);
    return {}; // Return empty object on failure
  }
}

export function toggleLikePost(
  db: Firestore,
  postId: string,
  userId: string,
  isLiked: boolean
) {
  const postRef = doc(db, 'posts', postId);
  const dataToUpdate = {
    likeCount: increment(isLiked ? -1 : 1),
    likedBy: isLiked ? arrayRemove(userId) : arrayUnion(userId),
  };

  updateDoc(postRef, dataToUpdate).catch(async serverError => {
    const permissionError = new FirestorePermissionError({
      path: postRef.path,
      operation: 'update',
      requestResourceData: dataToUpdate,
    });
    errorEmitter.emit('permission-error', permissionError);
  });
}

type CommentPayload = {
  authorId: string;
  authorName: string;
  authorPhotoURL?: string;
  content: string;
};

export function addComment(db: Firestore, postId: string, comment: CommentPayload) {
  if (!comment.authorId) {
    throw new Error('User must be logged in to comment.');
  }

  const commentsCollection = collection(db, 'posts', postId, 'comments');
  const postRef = doc(db, 'posts', postId);

  const newComment = {
    ...comment,
    createdAt: serverTimestamp(),
  };

  addDoc(commentsCollection, newComment)
    .then(() => {
      const dataToUpdate = { commentCount: increment(1) };
      updateDoc(postRef, dataToUpdate).catch(async serverError => {
        const permissionError = new FirestorePermissionError({
          path: postRef.path,
          operation: 'update',
          requestResourceData: dataToUpdate,
        });
        errorEmitter.emit('permission-error', permissionError);
      });
    })
    .catch(async serverError => {
      const permissionError = new FirestorePermissionError({
        path: commentsCollection.path,
        operation: 'create',
        requestResourceData: newComment,
      });
      errorEmitter.emit('permission-error', permissionError);
    });
}

export function deletePost(db: Firestore, postId: string) {
  const postRef = doc(db, 'posts', postId);
  // Note: This does not delete the comments subcollection.
  // A Cloud Function would be needed for full cleanup.
  deleteDoc(postRef).catch(async serverError => {
    const permissionError = new FirestorePermissionError({
      path: postRef.path,
      operation: 'delete',
    });
    errorEmitter.emit('permission-error', permissionError);
  });
}

export function deleteComment(
  db: Firestore,
  postId: string,
  commentId: string
) {
  const postRef = doc(db, 'posts', postId);
  const commentRef = doc(db, 'posts', postId, 'comments', commentId);

  const batch = writeBatch(db);

  // Delete the comment and decrement the post's comment count
  batch.delete(commentRef);
  batch.update(postRef, { commentCount: increment(-1) });

  batch.commit().catch(async serverError => {
    const permissionError = new FirestorePermissionError({
      path: commentRef.path,
      operation: 'delete',
    });
    errorEmitter.emit('permission-error', permissionError);
  });
}

    