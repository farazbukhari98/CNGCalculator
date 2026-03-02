import SidePanel from "@/components/cng-calculator/SidePanel";
import MainContent from "@/components/cng-calculator/MainContent";
import { useCalculator } from "@/contexts/CalculatorContext";
import { useState, useCallback, useEffect } from "react";
import truckImg from "@assets/truck.png";

export default function Home() {
  const { sidebarCollapsed } = useCalculator();
  const [sidebarWidth, setSidebarWidth] = useState(320); // Default 320px (md:w-80)
  const [isResizing, setIsResizing] = useState(false);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isResizing) return;
    
    const newWidth = Math.min(Math.max(e.clientX, 240), 600); // Min 240px, Max 600px
    setSidebarWidth(newWidth);
  }, [isResizing]);

  const handleMouseUp = useCallback(() => {
    setIsResizing(false);
  }, []);

  // Add global mouse listeners when resizing
  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    } else {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isResizing, handleMouseMove, handleMouseUp]);
  
  return (
    <div className="flex flex-col min-h-screen">
      {/* Sticky Header Bar */}
      <div className="sticky top-0 z-50 w-full bg-green-900/95 dark:bg-green-950/95 backdrop-blur-sm shadow-md h-24 sm:h-28 flex flex-col justify-center px-6 sm:px-10">
        <h1 className="text-2xl sm:text-3xl font-bold text-white drop-shadow-sm">CNG Fleet Conversion Forecast</h1>
        <p className="text-sm sm:text-base text-green-100/90 mt-1">Optimize your fleet conversion strategy</p>
      </div>

      {/* Hero Image (scrolls with page) */}
      <div className="relative w-full -mt-24 sm:-mt-28 pointer-events-none">
        <img
          src={truckImg}
          alt="CNG Truck"
          className="w-full h-[280px] sm:h-[320px] object-cover"
          style={{ objectPosition: 'center 45%' }}
        />
        <div className="absolute inset-0 bg-green-900/60 dark:bg-green-950/70" />
      </div>

      {/* Main App Area */}
      <div className="flex flex-col md:flex-row flex-1">
        {!sidebarCollapsed && (
          <div 
            className="relative shrink-0"
            style={{ width: `${sidebarWidth}px` }}
          >
            {/* Sticky Sidebar */}
            <div className="sticky top-24 sm:top-28 h-[calc(100vh-6rem)] sm:h-[calc(100vh-7rem)]">
              <SidePanel />
            </div>
            {/* Resize handle */}
            <div
              className="absolute top-0 right-0 w-1 h-full bg-gray-300 hover:bg-blue-400 cursor-col-resize transition-colors z-10"
              onMouseDown={handleMouseDown}
              style={{ 
                backgroundColor: isResizing ? '#3b82f6' : undefined 
              }}
            />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <MainContent />
        </div>
      </div>
    </div>
  );
}
