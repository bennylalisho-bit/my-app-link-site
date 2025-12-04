import { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { VehicleSection } from "@/components/VehicleSection";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Send } from "lucide-react";
import { format, addDays } from "date-fns";
import { he } from "date-fns/locale";
import {
  WeekendArrangement,
  createEmptyWeekendArrangement,
  formatDateToId,
} from "@/lib/types";
import {
  subscribeToWeekendArrangement,
  saveWeekendArrangement,
} from "@/lib/firestore";

export default function WeekendPage() {
  const [departureDate, setDepartureDate] = useState<Date>(new Date());
  const [arrivalDate, setArrivalDate] = useState<Date>(addDays(new Date(), 1));
  const [data, setData] = useState<WeekendArrangement>(
    createEmptyWeekendArrangement(
      formatDateToId(new Date()),
      formatDateToId(addDays(new Date(), 1))
    )
  );
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    const unsubscribe = subscribeToWeekendArrangement(
      departureDate,
      arrivalDate,
      (arrangement) => {
        setData(arrangement);
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [departureDate, arrivalDate]);

  const handleDataChange = (newData: WeekendArrangement) => {
    setData(newData);
    saveWeekendArrangement(departureDate, arrivalDate, newData);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-foreground">סידור סופש</h2>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="bg-card rounded-lg border border-border p-4 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-foreground">שישי - יציאה</h3>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="gap-2" data-testid="date-picker-friday">
                      <CalendarIcon className="h-4 w-4" />
                      {format(departureDate, "dd/MM/yyyy", { locale: he })}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="end">
                    <Calendar
                      mode="single"
                      selected={departureDate}
                      onSelect={(d) => d && setDepartureDate(d)}
                      locale={he}
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <VehicleSection
                title=""
                vehicles={data.departure}
                onChange={(vehicles) =>
                  handleDataChange({ ...data, departure: vehicles })
                }
                testIdPrefix="departure"
              />
            </div>

            <div className="bg-card rounded-lg border border-border p-4 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-foreground">שבת - חזרה</h3>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="gap-2" data-testid="date-picker-saturday">
                      <CalendarIcon className="h-4 w-4" />
                      {format(arrivalDate, "dd/MM/yyyy", { locale: he })}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="end">
                    <Calendar
                      mode="single"
                      selected={arrivalDate}
                      onSelect={(d) => d && setArrivalDate(d)}
                      locale={he}
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <VehicleSection
                title=""
                vehicles={data.arrival}
                onChange={(vehicles) =>
                  handleDataChange({ ...data, arrival: vehicles })
                }
                testIdPrefix="arrival"
              />
            </div>
          </div>
        )}
      </main>

      <Button
        className="fixed bottom-6 left-6 h-14 w-14 rounded-full shadow-xl"
        size="icon"
        data-testid="publish-button-weekend"
      >
        <Send className="h-6 w-6" />
      </Button>
    </div>
  );
}
