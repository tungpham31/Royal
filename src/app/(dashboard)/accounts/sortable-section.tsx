"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";
import { ReactNode, forwardRef } from "react";

interface SortableSectionProps {
  id: string;
  children: (dragHandle: ReactNode | null) => ReactNode;
  isEditMode: boolean;
}

export function SortableSection({ id, children, isEditMode }: SortableSectionProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
    over,
  } = useSortable({
    id,
    data: {
      type: "section",
      id,
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const dragHandle = isEditMode ? (
    <button
      ref={setActivatorNodeRef}
      {...attributes}
      {...listeners}
      className={cn(
        "p-1 cursor-grab active:cursor-grabbing",
        "hover:bg-muted rounded transition-colors",
        "touch-none select-none"
      )}
      title="Drag to reorder section"
    >
      <GripVertical className="h-4 w-4 text-muted-foreground" />
    </button>
  ) : null;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group/section",
        isDragging && "z-50 opacity-90 shadow-xl rounded-lg bg-background"
      )}
    >
      {children(dragHandle)}
    </div>
  );
}
