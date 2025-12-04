import { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { VehicleSection } from "@/components/VehicleSection";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Send } from "lucide-react";
import { format } from "date-fns";
import { he } from "date-fns/locale";
import {
  HolidayArrangement,
  createEmptyHolidayArrangement,
} from "@/lib/types";
import {
  subscribeToHolidayArrangement,
  saveHolidayArrangement,
} from "@/lib/firestore";

export default function HolidayPage() {
  const [date, setDate] = useState<Date>(new Date());
  const [data, setData] = useState<HolidayArrangement>(createEmptyHolidayArrangement());
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    const unsubscribe = subscribeToHolidayArrangement(date, (arrangement) => {
      setData(arrangement);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [date]);

  const handleDataChange = (newData: HolidayArrangement) => {
    setData(newData);
    saveHolidayArrangement(date, newData);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-foreground">סידור חג</h2>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="gap-2" data-testid="date-picker-holiday">
                <CalendarIcon className="h-4 w-4" />
                {format(date, "dd/MM/yyyy", { locale: he })}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                mode="single"
                selected={date}
                onSelect={(d) => d && setDate(d)}
                locale={he}
              />
            </PopoverContent>
          </Popover>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="space-y-6">
            <VehicleSection
              title="רכבים"
              vehicles={data.vehicles}
              onChange={(vehicles) =>
                handleDataChange({ ...data, vehicles })
              }
              testIdPrefix="holiday"
            />
          </div>
        )}
      </main>

      <Button
        className="fixed bottom-6 left-6 h-14 w-14 rounded-full shadow-xl"
        size="icon"
        data-testid="publish-button-holiday"
      >
        <Send className="h-6 w-6" />
      </Button>
    </div>
  );
}
