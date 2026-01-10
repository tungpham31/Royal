"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";

interface SortableSectionProps {
  id: string;
  children: React.ReactNode;
}

export function SortableSection({ id, children }: SortableSectionProps) {
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
        "group/section relative",
        isDragging && "z-50 opacity-90 shadow-xl rounded-lg"
      )}
    >
      {/* Section drag handle - positioned at the top-left of the card */}
      <button
        {...attributes}
        {...listeners}
        className={cn(
          "absolute -left-6 top-6 z-10",
          "p-1 opacity-0 group-hover/section:opacity-100 transition-opacity",
          "cursor-grab active:cursor-grabbing",
          "hover:bg-muted rounded"
        )}
        title="Drag to reorder section"
      >
        <GripVertical className="h-4 w-4 text-muted-foreground" />
      </button>
      {children}
    </div>
  );
}
