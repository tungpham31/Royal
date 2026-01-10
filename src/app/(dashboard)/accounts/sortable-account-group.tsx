"use client";

import { useCallback } from "react";
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
import { updateAccountsOrder } from "@/actions/accounts";

interface Account {
  id: string;
}

interface SortableAccountGroupProps<T extends Account> {
  accounts: T[];
  onReorder: (newAccounts: T[]) => void;
  children: React.ReactNode;
}

export function SortableAccountGroup<T extends Account>({
  accounts,
  onReorder,
  children,
}: SortableAccountGroupProps<T>) {
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
        const oldIndex = accounts.findIndex((a) => a.id === active.id);
        const newIndex = accounts.findIndex((a) => a.id === over.id);

        const newAccounts = arrayMove(accounts, oldIndex, newIndex);

        // Optimistic update
        onReorder(newAccounts);

        // Persist to database
        const updates = newAccounts.map((account, index) => ({
          id: account.id,
          display_order: index,
        }));

        await updateAccountsOrder(updates);
      }
    },
    [accounts, onReorder]
  );

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={accounts.map((a) => a.id)}
        strategy={verticalListSortingStrategy}
      >
        {children}
      </SortableContext>
    </DndContext>
  );
}
