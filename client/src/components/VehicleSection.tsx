import { Vehicle, createEmptyVehicle } from "@/lib/types";
import { VehicleCard } from "./VehicleCard";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

interface VehicleSectionProps {
  title: string;
  vehicles: Vehicle[];
  onChange: (vehicles: Vehicle[]) => void;
  testIdPrefix: string;
}

export function VehicleSection({
  title,
  vehicles,
  onChange,
  testIdPrefix,
}: VehicleSectionProps) {
  const addVehicle = () => {
    onChange([...vehicles, createEmptyVehicle()]);
  };

  const updateVehicle = (index: number, vehicle: Vehicle) => {
    const newVehicles = [...vehicles];
    newVehicles[index] = vehicle;
    onChange(newVehicles);
  };

  const removeVehicle = (index: number) => {
    const newVehicles = vehicles.filter((_, i) => i !== index);
    onChange(newVehicles.length ? newVehicles : [createEmptyVehicle()]);
  };

  return (
    <div className="bg-card rounded-lg border border-border p-4 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-foreground">{title}</h3>
        <Button
          variant="outline"
          size="sm"
          onClick={addVehicle}
          data-testid={`add-${testIdPrefix}-vehicle`}
        >
          <Plus className="h-4 w-4 ml-1" />
          הוסף רכב
        </Button>
      </div>
      <ScrollArea className="w-full">
        <div className="flex gap-4 pb-4">
          {vehicles.map((vehicle, index) => (
            <VehicleCard
              key={index}
              vehicle={vehicle}
              index={index}
              onChange={(v) => updateVehicle(index, v)}
              onRemove={() => removeVehicle(index)}
              canRemove={vehicles.length > 1}
            />
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  );
}
