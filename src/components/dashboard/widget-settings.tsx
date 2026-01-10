"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Settings2, Pencil, Check } from "lucide-react";
import { WidgetConfig, WIDGET_DEFINITIONS, WidgetId } from "@/types/widgets";
import { saveDashboardPreferences } from "@/actions/dashboard";

interface WidgetSettingsProps {
  layout: WidgetConfig[];
  onLayoutChange: (layout: WidgetConfig[]) => void;
  isEditing: boolean;
  onEditToggle: () => void;
}

export function WidgetSettings({
  layout,
  onLayoutChange,
  isEditing,
  onEditToggle,
}: WidgetSettingsProps) {
  const handleToggleWidget = async (id: WidgetId) => {
    const newLayout = layout.map((item) =>
      item.id === id ? { ...item, visible: !item.visible } : item
    );
    onLayoutChange(newLayout);
    await saveDashboardPreferences(newLayout);
  };

  return (
    <div className="flex items-center gap-2">
      <Button
        variant={isEditing ? "default" : "outline"}
        size="sm"
        onClick={onEditToggle}
      >
        {isEditing ? (
          <>
            <Check className="h-4 w-4" />
            Done
          </>
        ) : (
          <>
            <Pencil className="h-4 w-4" />
            Customize
          </>
        )}
      </Button>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="icon">
            <Settings2 className="h-4 w-4" />
            <span className="sr-only">Widget settings</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>Show Widgets</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {layout
            .filter((item) => WIDGET_DEFINITIONS[item.id])
            .map((item) => {
              const widget = WIDGET_DEFINITIONS[item.id];
              return (
                <DropdownMenuCheckboxItem
                  key={item.id}
                  checked={item.visible}
                  onCheckedChange={() => handleToggleWidget(item.id)}
                >
                  {widget.name}
                </DropdownMenuCheckboxItem>
              );
            })}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
