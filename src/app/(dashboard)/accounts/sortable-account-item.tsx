"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";

interface SortableAccountItemProps {
  id: string;
  children: React.ReactNode;
}

export function SortableAccountItem({ id, children }: SortableAccountItemProps) {
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
        isDragging && "z-50 opacity-90 shadow-lg rounded-lg bg-background"
      )}
    >
      {/* Drag handle - appears on hover, positioned at left edge */}
      <button
        {...attributes}
        {...listeners}
        className={cn(
          "absolute -left-6 top-1/2 -translate-y-1/2 z-10",
          "p-1 opacity-0 group-hover:opacity-100 transition-opacity",
          "cursor-grab active:cursor-grabbing",
          "hover:bg-muted rounded"
        )}
        title="Drag to reorder"
      >
        <GripVertical className="h-4 w-4 text-muted-foreground" />
      </button>
      {children}
    </div>
  );
}
