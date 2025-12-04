import { StatusGroup, createEmptyStatusGroup } from "@/lib/types";
import { StatusGroupCard } from "./StatusGroupCard";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

interface StatusSectionProps {
  statusGroups: StatusGroup[];
  onChange: (groups: StatusGroup[]) => void;
}

export function StatusSection({ statusGroups, onChange }: StatusSectionProps) {
  const addGroup = () => {
    onChange([...statusGroups, createEmptyStatusGroup()]);
  };

  const updateGroup = (index: number, group: StatusGroup) => {
    const newGroups = [...statusGroups];
    newGroups[index] = group;
    onChange(newGroups);
  };

  const removeGroup = (index: number) => {
    const newGroups = statusGroups.filter((_, i) => i !== index);
    onChange(newGroups.length ? newGroups : [createEmptyStatusGroup()]);
  };

  return (
    <div className="bg-card rounded-lg border border-border p-4 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-foreground">שאר העובדים</h3>
        <Button
          variant="outline"
          size="sm"
          onClick={addGroup}
          data-testid="add-status-group"
        >
          <Plus className="h-4 w-4 ml-1" />
          הוסף סטטוס
        </Button>
      </div>
      <ScrollArea className="w-full">
        <div className="flex gap-4 pb-4">
          {statusGroups.map((group, index) => (
            <StatusGroupCard
              key={index}
              group={group}
              index={index}
              onChange={(g) => updateGroup(index, g)}
              onRemove={() => removeGroup(index)}
              canRemove={statusGroups.length > 1}
            />
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  );
}
