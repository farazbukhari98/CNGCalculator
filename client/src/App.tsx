import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import { CalculatorProvider } from "./contexts/CalculatorContext";
import { ComparisonProvider } from "./contexts/ComparisonContext";
import { DarkModeProvider } from "./contexts/DarkModeContext";
import { TooltipProvider } from "./contexts/TooltipContext";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const content = __STANDALONE_LOCAL__ ? <Home /> : <Router />;

  return (
    <QueryClientProvider client={queryClient}>
      <DarkModeProvider>
        <TooltipProvider>
          <CalculatorProvider>
            <ComparisonProvider>
              {content}
              <Toaster />
            </ComparisonProvider>
          </CalculatorProvider>
        </TooltipProvider>
      </DarkModeProvider>
    </QueryClientProvider>
  );
}

export default App;
