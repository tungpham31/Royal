"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, X, Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { WidgetId, WIDGET_DEFINITIONS } from "@/types/widgets";

interface WidgetWrapperProps {
  id: WidgetId;
  isEditing: boolean;
  isVisible: boolean;
  onToggleVisibility: (id: WidgetId) => void;
  children: React.ReactNode;
  className?: string;
}

export function WidgetWrapper({
  id,
  isEditing,
  isVisible,
  onToggleVisibility,
  children,
  className,
}: WidgetWrapperProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id, disabled: !isEditing });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const widget = WIDGET_DEFINITIONS[id];

  if (!isVisible && !isEditing) {
    return null;
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "relative",
        isDragging && "z-50 opacity-90",
        !isVisible && isEditing && "opacity-50",
        className
      )}
    >
      {isEditing && (
        <div className="absolute -top-2 -left-2 -right-2 -bottom-2 border-2 border-dashed border-primary/50 rounded-xl pointer-events-none" />
      )}
      {isEditing && (
        <div className="absolute top-2 right-2 z-10 flex items-center gap-1">
          <button
            onClick={() => onToggleVisibility(id)}
            className="p-1.5 rounded-md bg-background/80 backdrop-blur-sm border shadow-sm hover:bg-muted transition-colors"
            title={isVisible ? "Hide widget" : "Show widget"}
          >
            {isVisible ? (
              <Eye className="h-4 w-4 text-muted-foreground" />
            ) : (
              <EyeOff className="h-4 w-4 text-muted-foreground" />
            )}
          </button>
          <button
            {...attributes}
            {...listeners}
            className="p-1.5 rounded-md bg-background/80 backdrop-blur-sm border shadow-sm cursor-grab active:cursor-grabbing hover:bg-muted transition-colors"
            title="Drag to reorder"
          >
            <GripVertical className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>
      )}
      <div className={cn(!isVisible && isEditing && "grayscale")}>
        {children}
      </div>
    </div>
  );
}
