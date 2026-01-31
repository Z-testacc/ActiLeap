'use client';

import { useEffect } from 'react';
import { errorEmitter } from '@/firebase/error-emitter';
import { useToast } from '@/hooks/use-toast';
import { FirestorePermissionError } from '@/firebase/errors';

export function FirebaseErrorListener() {
  const { toast } = useToast();

  useEffect(() => {
    const handlePermissionError = (error: FirestorePermissionError) => {
      console.error('Firestore Permission Error:', error.toMetric());

      toast({
        variant: 'destructive',
        title: 'Permission Denied',
        description:
          'You do not have permission to perform this action. Check Firestore security rules.',
      });

      // In a development environment, we can throw the error to show the Next.js overlay
      if (process.env.NODE_ENV === 'development') {
        // We throw in a timeout to break out of the event emitter's call stack
        setTimeout(() => {
          throw error;
        });
      }
    };

    const unsubscribe = errorEmitter.on(
      'permission-error',
      handlePermissionError
    );

    return () => {
      unsubscribe();
    };
  }, [toast]);

  return null;
}
