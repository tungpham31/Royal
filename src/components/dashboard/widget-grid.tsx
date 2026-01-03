"use client";

import { useState, useCallback } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { WidgetConfig, WidgetId } from "@/types/widgets";
import { WidgetWrapper } from "./widget-wrapper";
import { saveDashboardPreferences } from "@/actions/dashboard";

interface WidgetGridProps {
  initialLayout: WidgetConfig[];
  isEditing: boolean;
  children: (props: {
    layout: WidgetConfig[];
    renderWidget: (id: WidgetId, content: React.ReactNode, className?: string) => React.ReactNode;
  }) => React.ReactNode;
}

export function WidgetGrid({ initialLayout, isEditing, children }: WidgetGridProps) {
  const [layout, setLayout] = useState<WidgetConfig[]>(initialLayout);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event;

      if (over && active.id !== over.id) {
        const oldIndex = layout.findIndex((item) => item.id === active.id);
        const newIndex = layout.findIndex((item) => item.id === over.id);

        const newLayout = arrayMove(layout, oldIndex, newIndex).map(
          (item, index) => ({
            ...item,
            order: index,
          })
        );

        setLayout(newLayout);
        await saveDashboardPreferences(newLayout);
      }
    },
    [layout]
  );

  const handleToggleVisibility = useCallback(
    async (id: WidgetId) => {
      const newLayout = layout.map((item) =>
        item.id === id ? { ...item, visible: !item.visible } : item
      );
      setLayout(newLayout);
      await saveDashboardPreferences(newLayout);
    },
    [layout]
  );

  const renderWidget = useCallback(
    (id: WidgetId, content: React.ReactNode, className?: string) => {
      const config = layout.find((item) => item.id === id);
      if (!config) return null;

      return (
        <WidgetWrapper
          key={id}
          id={id}
          isEditing={isEditing}
          isVisible={config.visible}
          onToggleVisibility={handleToggleVisibility}
          className={className}
        >
          {content}
        </WidgetWrapper>
      );
    },
    [layout, isEditing, handleToggleVisibility]
  );

  const sortedLayout = [...layout].sort((a, b) => a.order - b.order);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={sortedLayout.map((item) => item.id)}
        strategy={verticalListSortingStrategy}
      >
        {children({ layout: sortedLayout, renderWidget })}
      </SortableContext>
    </DndContext>
  );
}
