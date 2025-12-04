import { StatusGroup, EMPLOYEES_LIST, STATUS_OPTIONS } from "@/lib/types";
import { AutocompleteInput } from "./AutocompleteInput";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Plus, X, Trash2 } from "lucide-react";

interface StatusGroupCardProps {
  group: StatusGroup;
  index: number;
  onChange: (group: StatusGroup) => void;
  onRemove: () => void;
  canRemove: boolean;
}

export function StatusGroupCard({
  group,
  index,
  onChange,
  onRemove,
  canRemove,
}: StatusGroupCardProps) {
  const updateStatus = (value: string) => {
    onChange({ ...group, status: value });
  };

  const addEmployee = () => {
    onChange({ ...group, employees: [...group.employees, ""] });
  };

  const removeEmployee = (empIndex: number) => {
    const newEmployees = group.employees.filter((_, i) => i !== empIndex);
    onChange({ ...group, employees: newEmployees.length ? newEmployees : [""] });
  };

  const updateEmployee = (empIndex: number, value: string) => {
    const newEmployees = [...group.employees];
    newEmployees[empIndex] = value;
    onChange({ ...group, employees: newEmployees });
  };

  return (
    <Card className="min-w-[200px] w-[220px] flex-shrink-0 shadow-md">
      <CardHeader className="pb-2 pt-3 px-3 flex flex-row items-center justify-between">
        <span className="text-sm font-semibold text-muted-foreground">
          סטטוס {index + 1}
        </span>
        {canRemove && (
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-destructive hover:text-destructive"
            onClick={onRemove}
            data-testid={`remove-status-${index}`}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-3 px-3 pb-3">
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">סוג הסטטוס</label>
          <AutocompleteInput
            value={group.status}
            onChange={updateStatus}
            suggestions={STATUS_OPTIONS}
            placeholder="בחר סטטוס"
            testId={`status-name-${index}`}
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs text-muted-foreground">עובדים</label>
            <Button
              variant="ghost"
              size="icon"
              className="h-5 w-5"
              onClick={addEmployee}
              data-testid={`add-status-employee-${index}`}
            >
              <Plus className="h-3 w-3" />
            </Button>
          </div>
          <div className="space-y-2">
            {group.employees.map((employee, empIndex) => (
              <div key={empIndex} className="flex gap-1">
                <AutocompleteInput
                  value={employee}
                  onChange={(v) => updateEmployee(empIndex, v)}
                  suggestions={EMPLOYEES_LIST}
                  placeholder="שם עובד"
                  className="flex-1"
                  testId={`status-employee-${index}-${empIndex}`}
                />
                {group.employees.length > 1 && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 flex-shrink-0 text-muted-foreground hover:text-destructive"
                    onClick={() => removeEmployee(empIndex)}
                    data-testid={`remove-status-employee-${index}-${empIndex}`}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
