"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";

interface SortableAccountItemProps {
  id: string;
  children: React.ReactNode;
  isEditMode: boolean;
}

export function SortableAccountItem({ id, children, isEditMode }: SortableAccountItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group relative",
        isDragging && "z-50 opacity-90 shadow-lg rounded-lg bg-background",
        isEditMode && "cursor-grab active:cursor-grabbing"
      )}
      // Apply drag listeners to entire row when in edit mode
      {...(isEditMode ? { ...attributes, ...listeners } : {})}
    >
      {/* Drag icon - only visible in edit mode as visual indicator */}
      {isEditMode && (
        <div
          className={cn(
            "absolute -left-6 top-1/2 -translate-y-1/2 z-10",
            "p-1"
          )}
        >
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </div>
      )}
      {children}
    </div>
  );
}
