import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import DailyPage from "@/pages/DailyPage";
import HolidayPage from "@/pages/HolidayPage";
import WeekendPage from "@/pages/WeekendPage";

function Router() {
  return (
    <Switch>
      <Route path="/" component={DailyPage} />
      <Route path="/holiday" component={HolidayPage} />
      <Route path="/weekend" component={WeekendPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
