'use client';

import { Plus } from 'lucide-react';
import { Button } from './ui/button';

interface FloatingActionButtonProps {
    onClick: () => void;
}

export function FloatingActionButton({ onClick }: FloatingActionButtonProps) {
    return (
        <Button
            onClick={onClick}
            className="fixed bottom-20 right-4 z-50 h-14 w-14 rounded-full shadow-lg"
        >
            <Plus className="h-6 w-6" />
            <span className="sr-only">Log Activity</span>
        </Button>
    )
}
