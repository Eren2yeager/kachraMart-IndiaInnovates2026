'use client';

import { CheckCircle2, Circle, Clock } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { WasteStatus } from '@/types';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const STEPS: { status: WasteStatus; label: string; shortLabel: string }[] = [
    { status: 'pending', label: 'Pending', shortLabel: 'Pending' },
    { status: 'collector_assigned', label: 'Collector Assigned', shortLabel: 'Assigned' },
    { status: 'picked_up', label: 'Picked Up', shortLabel: 'Picked Up' },
    { status: 'stored_in_hub', label: 'Stored in Hub', shortLabel: 'In Hub' },
    { status: 'sold_to_dealer', label: 'Sold to Dealer', shortLabel: 'Sold' },
];

const STATUS_INDEX: Record<WasteStatus, number> = {
    pending: 0,
    collector_assigned: 1,
    picked_up: 2,
    stored_in_hub: 3,
    sold_to_dealer: 4,
    cancelled: -1,
};

interface PickupStatusTimelineProps {
    status: WasteStatus;
    compact?: boolean;
}

export function PickupStatusTimeline({ status, compact = false }: PickupStatusTimelineProps) {
    const currentIndex = STATUS_INDEX[status];

    if (status === 'cancelled') {
        return (
            <div className="flex items-center gap-1.5">
                <div className="h-2 w-2 rounded-full bg-red-500" />
                <span className={cn('text-red-600 dark:text-red-400 font-medium', compact ? 'text-xs' : 'text-sm')}>
                    Cancelled
                </span>
            </div>
        );
    }

    if (compact) {
        return (
            <div className="flex items-center gap-1">
                {STEPS.map((step, index) => {
                    const isDone = index < currentIndex;
                    const isCurrent = index === currentIndex;
                    return (
                        <TooltipProvider key={step.status} delayDuration={200}>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <div className="flex items-center gap-1">
                                        <div
                                            className={cn(
                                                'h-2 w-2 rounded-full transition-colors',
                                                isDone && 'bg-green-500',
                                                isCurrent && 'bg-primary ring-2 ring-primary/30',
                                                !isDone && !isCurrent && 'bg-muted-foreground/30'
                                            )}
                                        />
                                        {index < STEPS.length - 1 && (
                                            <div
                                                className={cn(
                                                    'h-px w-3 transition-colors',
                                                    isDone ? 'bg-green-500' : 'bg-muted-foreground/20'
                                                )}
                                            />
                                        )}
                                    </div>
                                </TooltipTrigger>
                                <TooltipContent side="top">
                                    <p className="text-xs">{step.label}</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    );
                })}
                <span className="ml-1 text-xs font-medium text-muted-foreground">
                    {STEPS[currentIndex]?.shortLabel}
                </span>
            </div>
        );
    }

    return (
        <div className="w-full">
            <div className="flex items-start justify-between relative">
                {/* Connecting line */}
                <div className="absolute top-3.5 left-0 right-0 h-px bg-muted-foreground/20 z-0" />
                <div
                    className="absolute top-3.5 left-0 h-px bg-green-500 z-0 transition-all duration-500"
                    style={{ width: `${(Math.max(0, currentIndex) / (STEPS.length - 1)) * 100}%` }}
                />

                {STEPS.map((step, index) => {
                    const isDone = index < currentIndex;
                    const isCurrent = index === currentIndex;
                    return (
                        <div key={step.status} className="flex flex-col items-center gap-1.5 z-10 flex-1">
                            <div
                                className={cn(
                                    'h-7 w-7 rounded-full flex items-center justify-center border-2 transition-all',
                                    isDone && 'bg-green-500 border-green-500 text-white',
                                    isCurrent && 'bg-primary border-primary text-primary-foreground shadow-md shadow-primary/30',
                                    !isDone && !isCurrent && 'bg-background border-muted-foreground/30 text-muted-foreground'
                                )}
                            >
                                {isDone ? (
                                    <CheckCircle2 className="h-4 w-4" />
                                ) : isCurrent ? (
                                    <Clock className="h-3.5 w-3.5" />
                                ) : (
                                    <Circle className="h-3.5 w-3.5" />
                                )}
                            </div>
                            <span
                                className={cn(
                                    'text-[10px] text-center leading-tight max-w-[60px]',
                                    isDone && 'text-green-600 dark:text-green-400 font-medium',
                                    isCurrent && 'text-primary font-semibold',
                                    !isDone && !isCurrent && 'text-muted-foreground'
                                )}
                            >
                                {step.shortLabel}
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
