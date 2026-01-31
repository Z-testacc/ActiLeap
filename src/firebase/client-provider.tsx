'use client';

import { useState, useEffect } from 'react';
import { initializeFirebase } from '@/firebase/index';
import { FirebaseProvider } from '@/firebase/provider';
import type { FirebaseApp } from 'firebase/app';
import type { Firestore } from 'firebase/firestore';
import { hasFirebaseConfig } from './config';

interface FirebaseClientProviderProps {
  children: React.ReactNode;
}

function ErrorDisplay({ title, message, details }: { title: string, message: string, details?: string }) {
  return (
    <div className="flex h-screen items-center justify-center bg-background p-4">
      <div className="rounded-lg border border-destructive bg-destructive/10 p-8 text-center w-full max-w-2xl">
        <h1 className="text-2xl font-bold text-destructive">
          {title}
        </h1>
        <p className="mt-4 text-destructive/80">
          {message}
        </p>
        {details && <pre className="mt-4 text-xs text-left bg-black/20 p-2 rounded-md overflow-auto whitespace-pre-wrap">{details}</pre>}
      </div>
    </div>
  );
}

const MissingFirebaseConfig = () => (
    <ErrorDisplay
        title="Firebase Configuration Missing"
        message="Your Firebase configuration is missing or incomplete. Please ensure your .env.local file is set up correctly with all the necessary Firebase keys from your project's settings."
    />
);


export function FirebaseClientProvider({
  children,
}: FirebaseClientProviderProps) {
  const [firebase, setFirebase] = useState<{
    app: FirebaseApp;
    firestore: Firestore;
  } | null>(null);
  const [initError, setInitError] = useState<Error | null>(null);

  useEffect(() => {
    if (!hasFirebaseConfig) {
      return;
    }
    const init = () => {
      try {
        const firebaseInstances = initializeFirebase();
        setFirebase(firebaseInstances);
      } catch (e: any) {
        console.error("Firebase initialization failed:", e);
        setInitError(e);
      }
    };
    init();
  }, []);

  if (!hasFirebaseConfig) {
    return <MissingFirebaseConfig />;
  }

  if (initError) {
    return (
        <ErrorDisplay
            title="Firebase Initialization Failed"
            message="There was an error initializing the Firebase connection. This is often caused by an invalid or incomplete configuration in your .env.local file."
            details={initError.message}
        />
    )
  }

  if (!firebase) {
    // Render a loading state while Firebase is initializing
    return null;
  }

  return (
    <FirebaseProvider
      app={firebase.app}
      firestore={firebase.firestore}
    >
      {children}
    </FirebaseProvider>
  );
}
