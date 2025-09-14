import { useState, useRef } from "react";
import { useCalculator } from "@/contexts/CalculatorContext";
import { useComparison } from "@/contexts/ComparisonContext";
import { useDarkMode } from "@/contexts/DarkModeContext";
import { useTooltips } from "@/contexts/TooltipContext";
import FleetConfiguration from "./FleetConfiguration";
import DeploymentTimeline from "./DeploymentTimeline";
import FinancialAnalysis from "./FinancialAnalysis";
import AdditionalMetrics from "./AdditionalMetrics";
import StrategyComparison from "./StrategyComparison";
import SensitivityAnalysis from "./SensitivityAnalysis";
import { TooltipToggle } from "./TooltipToggle";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Download, PanelLeft, PanelRight, Moon, Sun } from "lucide-react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

export default function MainContent() {
  const { deploymentStrategy, results, vehicleParameters, stationConfig, fuelPrices, timeHorizon, hideNegativeValues } = useCalculator();
  const { darkMode, toggleDarkMode } = useDarkMode();
  const [showCashflow, setShowCashflow] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  
  // Function to handle PDF export
  const handleExportPDF = async () => {
    if (!results) return;
    
    try {
      setIsExporting(true);
      
      // Create a date string for the report
      const date = new Date().toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
      
      // Initialize PDF document (A4 size in portrait for better layout)
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      
      // Page dimensions
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 15;
      const contentWidth = pageWidth - (margin * 2);
      
      // ==================== TITLE PAGE ====================
      
      // Add title page background
      pdf.setFillColor(darkMode ? 35 : 240, darkMode ? 41 : 245, darkMode ? 47 : 250);
      pdf.rect(0, 0, pageWidth, pageHeight, 'F');
      
      // Draw header bar
      pdf.setFillColor(darkMode ? 50 : 220, darkMode ? 55 : 225, darkMode ? 60 : 230);
      pdf.rect(0, 0, pageWidth, 40, 'F');
      
      // Header text
      pdf.setFontSize(24);
      pdf.setTextColor(darkMode ? 255 : 0, darkMode ? 255 : 0, darkMode ? 255 : 0);
      pdf.text('CNG Fleet Analysis Report', margin, margin + 10);
      
      // Strategy information
      pdf.setFontSize(18);
      pdf.setTextColor(darkMode ? 230 : 40, darkMode ? 230 : 40, darkMode ? 230 : 40);
      pdf.text(`${strategyTitles[deploymentStrategy]}`, margin, margin + 35);
      
      pdf.setFontSize(12);
      pdf.setTextColor(darkMode ? 200 : 80, darkMode ? 200 : 80, darkMode ? 200 : 80);
      pdf.text(`${strategyTaglines[deploymentStrategy]}`, margin, margin + 45);
      
      // Generate date
      pdf.text(`Generated on ${date}`, margin, margin + 55);
      
      // Fleet information box
      const boxY = margin + 65;
      pdf.setDrawColor(darkMode ? 70 : 200, darkMode ? 70 : 200, darkMode ? 70 : 200);
      pdf.setFillColor(darkMode ? 50 : 245, darkMode ? 55 : 250, darkMode ? 60 : 255);
      pdf.roundedRect(margin, boxY, contentWidth, 45, 3, 3, 'FD');
      
      // Fleet details
      pdf.setTextColor(darkMode ? 255 : 0, darkMode ? 255 : 0, darkMode ? 255 : 0);
      pdf.setFontSize(14);
      pdf.text('Fleet Composition:', margin + 5, boxY + 12);
      
      pdf.setFontSize(11);
      const vehicleY = boxY + 20;
      const col1X = margin + 10;
      const col2X = margin + 70;
      const col3X = margin + 130;
      
      // Labels
      pdf.setTextColor(darkMode ? 200 : 80, darkMode ? 200 : 80, darkMode ? 200 : 80);
      pdf.text('Light-Duty:', col1X, vehicleY + 10);
      pdf.text('Medium-Duty:', col2X, vehicleY + 10);
      pdf.text('Heavy-Duty:', col3X, vehicleY + 10);
      
      // Values 
      pdf.setTextColor(darkMode ? 255 : 0, darkMode ? 255 : 0, darkMode ? 255 : 0);
      pdf.setFontSize(14);
      pdf.text(`${vehicleParameters.lightDutyCount}`, col1X + 35, vehicleY + 10);
      pdf.text(`${vehicleParameters.mediumDutyCount}`, col2X + 41, vehicleY + 10);
      pdf.text(`${vehicleParameters.heavyDutyCount}`, col3X + 35, vehicleY + 10);
      
      // Station information box
      const stationBoxY = boxY + 55;
      pdf.setDrawColor(darkMode ? 70 : 200, darkMode ? 70 : 200, darkMode ? 70 : 200);
      pdf.setFillColor(darkMode ? 50 : 245, darkMode ? 55 : 250, darkMode ? 60 : 255);
      pdf.roundedRect(margin, stationBoxY, contentWidth, 50, 3, 3, 'FD');
      
      // Station details
      pdf.setTextColor(darkMode ? 255 : 0, darkMode ? 255 : 0, darkMode ? 255 : 0);
      pdf.setFontSize(14);
      pdf.text('Station Configuration:', margin + 5, stationBoxY + 12);
      
      pdf.setFontSize(11);
      const stationDetailY = stationBoxY + 25;
      
      // Left column - labels
      pdf.setTextColor(darkMode ? 200 : 80, darkMode ? 200 : 80, darkMode ? 200 : 80);
      pdf.text('Station Type:', margin + 10, stationDetailY);
      pdf.text('Business Type:', margin + 10, stationDetailY + 10);
      pdf.text('Payment Option:', margin + 10, stationDetailY + 20);
      
      // Right column - values
      pdf.setTextColor(darkMode ? 255 : 0, darkMode ? 255 : 0, darkMode ? 255 : 0);
      pdf.text(`${stationConfig.stationType === 'fast' ? 'Fast-Fill' : 'Time-Fill'}`, margin + 50, stationDetailY);
      pdf.text(`${stationConfig.businessType === 'aglc' ? 'Alternative Gas & Light Company' : 'Clean Gas Corporation'}`, margin + 50, stationDetailY + 10);
      pdf.text(`${stationConfig.turnkey ? 'TurnKey (Upfront)' : 'Financed'}`, margin + 50, stationDetailY + 20);
      
      // Key Metrics
      const metricsBoxY = stationBoxY + 60;
      pdf.setDrawColor(darkMode ? 70 : 200, darkMode ? 70 : 200, darkMode ? 70 : 200);
      pdf.setFillColor(darkMode ? 50 : 245, darkMode ? 55 : 250, darkMode ? 60 : 255);
      pdf.roundedRect(margin, metricsBoxY, contentWidth, 90, 3, 3, 'FD');
      
      // Metrics header
      pdf.setTextColor(darkMode ? 255 : 0, darkMode ? 255 : 0, darkMode ? 255 : 0);
      pdf.setFontSize(14);
      pdf.text('Key Financial & Environmental Metrics', margin + 5, metricsBoxY + 12);
      
      // Create metrics in a 2x5 grid layout
      const metrics = [
        { name: 'Total Investment', value: `$${results.totalInvestment.toLocaleString()}` },
        { name: 'Payback Period', value: results.paybackPeriod < 0 ? 'Never' : `${Math.floor(results.paybackPeriod)} years, ${Math.round((results.paybackPeriod % 1) * 12)} months` },
        { name: 'ROI', value: `${Math.round(results.roi)}%` },
        { name: 'Annual Rate of Return', value: `${results.annualRateOfReturn.toFixed(1)}%` },
        { name: 'Annual Fuel Savings', value: `$${results.annualFuelSavings.toLocaleString()}` },
        { name: 'Net Cash Flow', value: `$${results.netCashFlow.toLocaleString()}` },
        { name: 'CO₂ Reduction', value: `${results.co2Reduction.toLocaleString()} kg` },
        { name: 'Cost Per Mile (Gasoline)', value: `$${results.costPerMileGasoline.toFixed(3)}` },
        { name: 'Cost Per Mile (CNG)', value: `$${results.costPerMileCNG.toFixed(3)}` },
        { name: 'Cost Reduction', value: `${results.costReduction.toFixed(1)}%` }
      ];
      
      // Layout metrics in two columns with clear spacing
      const colWidth = contentWidth / 2;
      const metricX1 = margin + 10;
      const metricX2 = margin + 10 + colWidth;
      const metricValueOffset = 62;
      
      pdf.setFontSize(10);
      metrics.forEach((metric, index) => {
        const col = index < 5 ? 0 : 1;
        const row = index % 5;
        const x = col === 0 ? metricX1 : metricX2;
        const y = metricsBoxY + 30 + (row * 12);
        
        pdf.setTextColor(darkMode ? 200 : 80, darkMode ? 200 : 80, darkMode ? 200 : 80);
        pdf.text(metric.name + ':', x, y);
        
        pdf.setTextColor(darkMode ? 255 : 0, darkMode ? 255 : 0, darkMode ? 255 : 0);
        pdf.text(metric.value, x + metricValueOffset, y);
      });
      
      // ==================== FINANCIAL ANALYSIS PAGE ====================
      pdf.addPage();
      
      // Add page background
      pdf.setFillColor(darkMode ? 35 : 240, darkMode ? 41 : 245, darkMode ? 47 : 250);
      pdf.rect(0, 0, pageWidth, pageHeight, 'F');
      
      // Draw header bar
      pdf.setFillColor(darkMode ? 50 : 220, darkMode ? 55 : 225, darkMode ? 60 : 230);
      pdf.rect(0, 0, pageWidth, 30, 'F');
      
      // Page header
      pdf.setFontSize(16);
      pdf.setTextColor(darkMode ? 255 : 0, darkMode ? 255 : 0, darkMode ? 255 : 0);
      pdf.text('Financial Analysis', margin, margin + 5);
      
      // Capture the financial analysis card
      const financialEl = document.querySelector('.financial-analysis');
      if (financialEl) {
        const canvas = await html2canvas(financialEl as HTMLElement, {
          scale: 1.5,
          useCORS: true,
          allowTaint: true,
          backgroundColor: darkMode ? '#1f2937' : '#ffffff'
        });
        
        const imgWidth = contentWidth;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        
        // Add the financial charts
        pdf.addImage(canvas.toDataURL('image/png'), 'PNG', margin, 40, imgWidth, imgHeight);
      }
      
      // ==================== DEPLOYMENT TIMELINE PAGE ====================
      pdf.addPage();
      
      // Add page background
      pdf.setFillColor(darkMode ? 35 : 240, darkMode ? 41 : 245, darkMode ? 47 : 250);
      pdf.rect(0, 0, pageWidth, pageHeight, 'F');
      
      // Draw header bar
      pdf.setFillColor(darkMode ? 50 : 220, darkMode ? 55 : 225, darkMode ? 60 : 230);
      pdf.rect(0, 0, pageWidth, 30, 'F');
      
      // Page header
      pdf.setFontSize(16);
      pdf.setTextColor(darkMode ? 255 : 0, darkMode ? 255 : 0, darkMode ? 255 : 0);
      pdf.text('Deployment Timeline', margin, margin + 5);
      
      // Capture just the deployment timeline
      const timelineEl = document.querySelector('.deployment-timeline');
      if (timelineEl) {
        const canvas = await html2canvas(timelineEl as HTMLElement, {
          scale: 1.5,
          useCORS: true,
          allowTaint: true,
          backgroundColor: darkMode ? '#1f2937' : '#ffffff'
        });
        
        const imgWidth = contentWidth;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        
        // Use full page width for the timeline
        pdf.addImage(canvas.toDataURL('image/png'), 'PNG', margin, 40, imgWidth, imgHeight);
      }
      
      // ==================== EMISSIONS & ADDITIONAL METRICS PAGE ====================
      pdf.addPage();
      
      // Add page background
      pdf.setFillColor(darkMode ? 35 : 240, darkMode ? 41 : 245, darkMode ? 47 : 250);
      pdf.rect(0, 0, pageWidth, pageHeight, 'F');
      
      // Draw header bar
      pdf.setFillColor(darkMode ? 50 : 220, darkMode ? 55 : 225, darkMode ? 60 : 230);
      pdf.rect(0, 0, pageWidth, 30, 'F');
      
      // Page header
      pdf.setFontSize(16);
      pdf.setTextColor(darkMode ? 255 : 0, darkMode ? 255 : 0, darkMode ? 255 : 0);
      pdf.text('Environmental Impact & Additional Metrics', margin, margin + 5);
      
      // Capture the additional metrics section
      const metricsEl = document.querySelector('.additional-metrics');
      if (metricsEl) {
        const canvas = await html2canvas(metricsEl as HTMLElement, {
          scale: 1.5,
          useCORS: true,
          allowTaint: true,
          backgroundColor: darkMode ? '#1f2937' : '#ffffff'
        });
        
        const imgWidth = contentWidth;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        
        // Position environmental metrics on its own page
        pdf.addImage(canvas.toDataURL('image/png'), 'PNG', margin, 40, imgWidth, imgHeight);
      }
      
      // ==================== SENSITIVITY ANALYSIS PAGE ====================
      
      // Get the sensitivity analysis element if it exists
      const sensitivityEl = document.querySelector('.sensitivity-analysis');
      if (sensitivityEl) {
        pdf.addPage();
        
        // Add page background
        pdf.setFillColor(darkMode ? 35 : 240, darkMode ? 41 : 245, darkMode ? 47 : 250);
        pdf.rect(0, 0, pageWidth, pageHeight, 'F');
        
        // Draw header bar
        pdf.setFillColor(darkMode ? 50 : 220, darkMode ? 55 : 225, darkMode ? 60 : 230);
        pdf.rect(0, 0, pageWidth, 30, 'F');
        
        // Page header
        pdf.setFontSize(16);
        pdf.setTextColor(darkMode ? 255 : 0, darkMode ? 255 : 0, darkMode ? 255 : 0);
        pdf.text('Sensitivity Analysis', margin, margin + 5);
        
        const canvas = await html2canvas(sensitivityEl as HTMLElement, {
          scale: 1.5,
          useCORS: true,
          allowTaint: true,
          backgroundColor: darkMode ? '#1f2937' : '#ffffff'
        });
        
        const imgWidth = contentWidth;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        
        // Add the sensitivity analysis
        pdf.addImage(canvas.toDataURL('image/png'), 'PNG', margin, 40, imgWidth, imgHeight);
      }
      
      // Save the PDF with a descriptive filename
      pdf.save(`CNG_Analysis_${deploymentStrategy}_${date.replace(/[\s,]+/g, '_')}.pdf`);
      
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('There was an error generating the PDF. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  // Strategy titles and taglines
  const strategyTitles = {
    immediate: "Immediate Purchase Strategy",
    phased: "Phased Deployment Strategy",
    aggressive: "Aggressive Early Strategy",
    deferred: "Deferred Deployment Strategy",
    manual: "Custom Deployment Strategy"
  };

  const strategyTaglines = {
    immediate: "Full upfront investment for maximum savings potential",
    phased: "Balanced approach with steady investment over time",
    aggressive: "Front-loaded investment to accelerate savings",
    deferred: "Gradual deployment with heavier investment in later years",
    manual: "Customized deployment based on your specific needs"
  };

  const { toggleSidebar, sidebarCollapsed } = useCalculator();

  return (
    <div className="flex-1 overflow-y-auto p-6" ref={contentRef}>
      {/* Strategy Header */}
      <div className="mb-6">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center">
          <div className="flex items-center gap-3">
            <Button 
              variant="outline" 
              size="icon" 
              className="h-8 w-8 bg-transparent"
              onClick={toggleSidebar}
              title={sidebarCollapsed ? "Show Sidebar" : "Hide Sidebar"}
            >
              {sidebarCollapsed ? (
                <PanelRight className="h-4 w-4" />
              ) : (
                <PanelLeft className="h-4 w-4" />
              )}
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {strategyTitles[deploymentStrategy]}
              </h1>
              <p className="text-gray-600 mt-1">
                {strategyTaglines[deploymentStrategy]} • <span className="text-green-600 text-sm">Auto-updating</span>
              </p>
            </div>
          </div>
          <div className="flex items-center mt-3 md:mt-0 space-x-6">
            <div className="flex items-center space-x-2">
              <Label 
                htmlFor="cashflowToggle" 
                className={`mr-3 text-sm font-medium ${!results ? 'text-gray-400 dark:text-gray-500' : 'text-gray-700 dark:text-gray-300'}`}
              >
                Show Cash Flow
              </Label>
              <Switch
                id="cashflowToggle"
                checked={showCashflow}
                onCheckedChange={setShowCashflow}
                disabled={!results}
                className="data-[state=checked]:bg-blue-500"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Label htmlFor="darkModeToggle" className="mr-3 text-sm font-medium text-gray-700 dark:text-gray-300">
                {darkMode ? "Light Mode" : "Dark Mode"}
              </Label>
              <Switch
                id="darkModeToggle"
                checked={darkMode}
                onCheckedChange={toggleDarkMode}
                className="dark-mode-transition data-[state=checked]:bg-blue-500"
              />
              <span className="ml-1">
                {darkMode ? (
                  <Sun size={18} className="text-amber-500 dark:text-amber-300" />
                ) : (
                  <Moon size={18} className="text-blue-800 dark:text-blue-300" />
                )}
              </span>
            </div>
            
            <div className="flex items-center space-x-2">
              <TooltipToggle />
            </div>
          </div>
        </div>
      </div>

      {/* Main content sections */}
      <FleetConfiguration showCashflow={showCashflow} />
      
      <DeploymentTimeline />
      
      {results && (
        <>
          <FinancialAnalysis showCashflow={showCashflow} hideNegativeValues={hideNegativeValues} />
          
          <AdditionalMetrics showCashflow={showCashflow} />
          
          {/* Advanced Analysis Tabs */}
          <div className="mb-6">
            <Tabs defaultValue="comparison" className="w-full">
              <TabsList className="w-full bg-gray-100 dark:bg-gray-800 p-1 mb-4">
                <TabsTrigger value="comparison" className="flex-1 py-2 dark:data-[state=active]:bg-blue-600 dark:data-[state=active]:text-white">Strategy Comparison</TabsTrigger>
                <TabsTrigger value="sensitivity" className="flex-1 py-2 dark:data-[state=active]:bg-blue-600 dark:data-[state=active]:text-white">Sensitivity Analysis</TabsTrigger>
              </TabsList>
              
              <TabsContent value="comparison" className="mt-0">
                <StrategyComparison />
              </TabsContent>
              
              <TabsContent value="sensitivity" className="mt-0">
                <SensitivityAnalysis hideNegativeValues={hideNegativeValues} />
              </TabsContent>
            </Tabs>
          </div>
          
          {/* Export/Save Actions */}
          <div className="flex flex-wrap justify-end gap-3 mt-6">
            <Button 
              variant="outline" 
              className="inline-flex items-center dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600 dark:border-gray-600"
              onClick={handleExportPDF}
              disabled={isExporting}
            >
              {isExporting ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-gray-500 dark:text-gray-300" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Generating PDF...
                </>
              ) : (
                <>
                  <Download className="h-5 w-5 mr-2" />
                  Export PDF
                </>
              )}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
