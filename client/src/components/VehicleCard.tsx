import { Vehicle, VEHICLES_LIST, EMPLOYEES_LIST } from "@/lib/types";
import { AutocompleteInput } from "./AutocompleteInput";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Plus, X, Trash2 } from "lucide-react";

interface VehicleCardProps {
  vehicle: Vehicle;
  index: number;
  onChange: (vehicle: Vehicle) => void;
  onRemove: () => void;
  canRemove: boolean;
}

export function VehicleCard({
  vehicle,
  index,
  onChange,
  onRemove,
  canRemove,
}: VehicleCardProps) {
  const updateField = (field: keyof Vehicle, value: string | string[]) => {
    onChange({ ...vehicle, [field]: value });
  };

  const addPassenger = () => {
    updateField("passengers", [...vehicle.passengers, ""]);
  };

  const removePassenger = (passengerIndex: number) => {
    const newPassengers = vehicle.passengers.filter((_, i) => i !== passengerIndex);
    updateField("passengers", newPassengers.length ? newPassengers : [""]);
  };

  const updatePassenger = (passengerIndex: number, value: string) => {
    const newPassengers = [...vehicle.passengers];
    newPassengers[passengerIndex] = value;
    updateField("passengers", newPassengers);
  };

  return (
    <Card className="min-w-[200px] w-[220px] flex-shrink-0 shadow-md">
      <CardHeader className="pb-2 pt-3 px-3 flex flex-row items-center justify-between">
        <span className="text-sm font-semibold text-muted-foreground">
          רכב {index + 1}
        </span>
        {canRemove && (
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-destructive hover:text-destructive"
            onClick={onRemove}
            data-testid={`remove-vehicle-${index}`}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-3 px-3 pb-3">
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">מספר רכב</label>
          <AutocompleteInput
            value={vehicle.number}
            onChange={(v) => updateField("number", v)}
            suggestions={VEHICLES_LIST}
            placeholder="מספר רכב"
            testId={`vehicle-number-${index}`}
          />
        </div>
        
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">נהג</label>
          <AutocompleteInput
            value={vehicle.driver}
            onChange={(v) => updateField("driver", v)}
            suggestions={EMPLOYEES_LIST}
            placeholder="שם הנהג"
            testId={`vehicle-driver-${index}`}
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs text-muted-foreground">נוסעים</label>
            <Button
              variant="ghost"
              size="icon"
              className="h-5 w-5"
              onClick={addPassenger}
              data-testid={`add-passenger-${index}`}
            >
              <Plus className="h-3 w-3" />
            </Button>
          </div>
          <div className="space-y-2">
            {vehicle.passengers.map((passenger, pIndex) => (
              <div key={pIndex} className="flex gap-1">
                <AutocompleteInput
                  value={passenger}
                  onChange={(v) => updatePassenger(pIndex, v)}
                  suggestions={EMPLOYEES_LIST}
                  placeholder="שם נוסע"
                  className="flex-1"
                  testId={`passenger-${index}-${pIndex}`}
                />
                {vehicle.passengers.length > 1 && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 flex-shrink-0 text-muted-foreground hover:text-destructive"
                    onClick={() => removePassenger(pIndex)}
                    data-testid={`remove-passenger-${index}-${pIndex}`}
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
