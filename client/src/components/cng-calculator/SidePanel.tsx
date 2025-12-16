import { useState } from "react";
import { ChevronDown, RefreshCw } from "lucide-react";
import VehicleParameters from "./VehicleParameters";
import StationConfiguration from "./StationConfiguration";
import FuelPrices from "./FuelPrices";
import RenewableNaturalGas from "./RenewableNaturalGas";
import GlobalSettings from "./GlobalSettings";
import { Badge } from "@/components/ui/badge";
import { useCalculator } from "@/contexts/CalculatorContext";

export default function SidePanel() {
  
  const [openSections, setOpenSections] = useState({
    globalSettings: false,
    vehicleParams: false,
    stationConfig: false,
    fuelPrices: false,
    renewableNaturalGas: false,
  });

  const toggleSection = (section: keyof typeof openSections) => {
    setOpenSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  return (
    <div className="w-full h-full bg-white shadow-lg overflow-y-auto dark-mode-transition dark:bg-gray-800">
      {/* Side Panel Header */}
      <div className="p-4 bg-blue-800 text-white dark:bg-blue-900">
        <h1 className="text-xl font-bold">CNG Fleet Calculator</h1>
        <p className="text-sm text-blue-100 mt-1">Optimize your fleet conversion strategy</p>
      </div>

      {/* Collapsible Sections */}
      <div className="p-4 space-y-4">
        {/* Global Settings Section */}
        <div className="mb-4">
          <button
            type="button"
            className="flex items-center justify-between w-full px-4 py-2 text-left text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 dark-mode-transition"
            onClick={() => toggleSection("globalSettings")}
            aria-expanded={openSections.globalSettings}
          >
            <span className="font-medium">Global Settings</span>
            <ChevronDown
              className={`w-5 h-5 transition-transform duration-200 ${
                openSections.globalSettings ? "rotate-180" : ""
              }`}
            />
          </button>
          <div
            className={`mt-2 ${openSections.globalSettings ? "" : "hidden"}`}
          >
            <GlobalSettings />
          </div>
        </div>

        {/* Vehicle Parameters Section */}
        <div className="mb-4">
          <button
            type="button"
            className="flex items-center justify-between w-full px-4 py-2 text-left text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 dark-mode-transition"
            onClick={() => toggleSection("vehicleParams")}
            aria-expanded={openSections.vehicleParams}
          >
            <span className="font-medium">Vehicle Parameters</span>
            <ChevronDown
              className={`w-5 h-5 transition-transform duration-200 ${
                openSections.vehicleParams ? "rotate-180" : ""
              }`}
            />
          </button>
          <div
            className={`mt-2 ${openSections.vehicleParams ? "" : "hidden"}`}
          >
            <VehicleParameters />
          </div>
        </div>

        {/* Station Configuration Section */}
        <div className="mb-4">
          <button
            type="button"
            className="flex items-center justify-between w-full px-4 py-2 text-left text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 dark-mode-transition"
            onClick={() => toggleSection("stationConfig")}
            aria-expanded={openSections.stationConfig}
          >
            <span className="font-medium">Station Configuration</span>
            <ChevronDown
              className={`w-5 h-5 transition-transform duration-200 ${
                openSections.stationConfig ? "rotate-180" : ""
              }`}
            />
          </button>
          <div
            className={`mt-2 ${openSections.stationConfig ? "" : "hidden"}`}
          >
            <StationConfiguration />
          </div>
        </div>

        {/* Fuel Prices Section */}
        <div className="mb-4">
          <button
            type="button"
            className="flex items-center justify-between w-full px-4 py-2 text-left text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 dark-mode-transition"
            onClick={() => toggleSection("fuelPrices")}
            aria-expanded={openSections.fuelPrices}
          >
            <span className="font-medium">Fuel Prices</span>
            <ChevronDown
              className={`w-5 h-5 transition-transform duration-200 ${
                openSections.fuelPrices ? "rotate-180" : ""
              }`}
            />
          </button>
          <div className={`mt-2 ${openSections.fuelPrices ? "" : "hidden"}`}>
            <FuelPrices />
          </div>
        </div>

        {/* Renewable Natural Gas Section */}
        <div className="mb-4">
          <button
            type="button"
            className="flex items-center justify-between w-full px-4 py-2 text-left text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 dark-mode-transition"
            onClick={() => toggleSection("renewableNaturalGas")}
            aria-expanded={openSections.renewableNaturalGas}
          >
            <span className="font-medium">Renewable Natural Gas</span>
            <ChevronDown
              className={`w-5 h-5 transition-transform duration-200 ${
                openSections.renewableNaturalGas ? "rotate-180" : ""
              }`}
            />
          </button>
          <div className={`mt-2 ${openSections.renewableNaturalGas ? "" : "hidden"}`}>
            <RenewableNaturalGas />
          </div>
        </div>

        {/* Auto-update indicator */}
        <div className="flex items-center justify-center gap-2 p-3 mt-4 bg-gray-100 rounded-lg dark:bg-gray-700 dark-mode-transition">
          <RefreshCw size={18} className="text-green-600 animate-spin animate-once animate-duration-1000" />
          <span className="text-sm text-gray-600 dark:text-gray-300">Calculations update automatically</span>
        </div>
      </div>
    </div>
  );
}
