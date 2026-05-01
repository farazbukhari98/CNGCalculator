import assert from "node:assert/strict";
import {
  applyVehicleLifecycle,
  calculateROI,
  distributeVehicles,
} from "../client/src/lib/calculator";
import type { FuelPrices, StationConfig, VehicleParameters } from "../client/src/types/calculator";

const baseVehicleParameters: VehicleParameters = {
  lightDutyCount: 0,
  mediumDutyCount: 0,
  heavyDutyCount: 0,
  lightDutyCost: 15000,
  mediumDutyCost: 15000,
  heavyDutyCost: 50000,
  lightDutyLifespan: 7,
  mediumDutyLifespan: 7,
  heavyDutyLifespan: 7,
  lightDutyMPG: 12,
  mediumDutyMPG: 10,
  heavyDutyMPG: 5,
  lightDutyAnnualMiles: 20000,
  mediumDutyAnnualMiles: 20000,
  heavyDutyAnnualMiles: 40000,
  lightDutyFuelType: "gasoline",
  mediumDutyFuelType: "diesel",
  heavyDutyFuelType: "diesel",
  lightDutyCngEfficiencyLoss: 50,
  mediumDutyCngEfficiencyLoss: 75,
  heavyDutyCngEfficiencyLoss: 100,
  lightDutyMaintenanceSavings: 0,
  mediumDutyMaintenanceSavings: 0.05,
  heavyDutyMaintenanceSavings: 0.05,
};

const baseFuelPrices: FuelPrices = {
  gasolinePrice: 3.38,
  dieselPrice: 3.84,
  cngPrice: 0.82,
  cngTaxCredit: 0,
  annualIncrease: 0,
  gasolineToCngConversionFactor: 1,
  dieselToCngConversionFactor: 1.136,
};

const turnkeyStation: StationConfig = {
  stationType: "time",
  businessType: "aglc",
  stationOption: "turnkey",
  sizingMethod: "peak",
  stationMarkup: 20,
};

function testRecurringLifecycleReplacements() {
  const params: VehicleParameters = {
    ...baseVehicleParameters,
    lightDutyCount: 1,
    lightDutyLifespan: 3,
  };
  const baseDistribution = distributeVehicles(params, 15, "immediate");
  const enhanced = applyVehicleLifecycle(baseDistribution, params, 15);
  const replacementYears = enhanced
    .map((year, index) => ((year.lightReplacements || 0) > 0 ? index + 1 : 0))
    .filter(Boolean);

  assert.deepEqual(replacementYears, [4, 7, 10, 13]);
}

function testDieselConversionFactorAffectsSavings() {
  const params: VehicleParameters = {
    ...baseVehicleParameters,
    mediumDutyCount: 10,
  };
  const baseDistribution = distributeVehicles(params, 10, "immediate");
  const enhanced = applyVehicleLifecycle(baseDistribution, params, 10);

  const lowerFactor = calculateROI(
    params,
    turnkeyStation,
    { ...baseFuelPrices, dieselToCngConversionFactor: 1 },
    10,
    "immediate",
    enhanced
  );
  const defaultFactor = calculateROI(
    params,
    turnkeyStation,
    baseFuelPrices,
    10,
    "immediate",
    enhanced
  );

  assert.notEqual(lowerFactor.annualFuelSavings, defaultFactor.annualFuelSavings);
  assert.ok(defaultFactor.annualFuelSavings < lowerFactor.annualFuelSavings);
}

function testNonTurnkeyIgnoresPremiumButKeepsTariff() {
  const params: VehicleParameters = {
    ...baseVehicleParameters,
    mediumDutyCount: 44,
  };
  const stationWithMarkup: StationConfig = {
    ...turnkeyStation,
    stationOption: "tariff",
    stationMarkup: 50,
  };
  const stationWithoutMarkup: StationConfig = {
    ...stationWithMarkup,
    stationMarkup: 0,
  };

  const baseDistribution = distributeVehicles(params, 10, "immediate");
  const enhanced = applyVehicleLifecycle(baseDistribution, params, 10);
  const withMarkup = calculateROI(
    params,
    stationWithMarkup,
    baseFuelPrices,
    10,
    "immediate",
    enhanced
  );
  const withoutMarkup = calculateROI(
    params,
    stationWithoutMarkup,
    baseFuelPrices,
    10,
    "immediate",
    enhanced
  );

  assert.equal(withMarkup.stationCost, withoutMarkup.stationCost);
  // Tariff option: totalInvestment = vehicles + lifetime tariff payments.
  assert.equal(
    withMarkup.totalInvestment,
    withMarkup.totalVehicleInvestment + withMarkup.totalStationInvestment
  );
  assert.equal(
    withMarkup.totalStationInvestment,
    withMarkup.stationCost * 0.18 * 10
  );
  assert.equal(withMarkup.yearlyTariffFees[0], Math.round(withMarkup.stationCost * 0.18));

  const cgcResults = calculateROI(
    params,
    {
      ...stationWithoutMarkup,
      businessType: "cgc",
    },
    baseFuelPrices,
    10,
    "immediate",
    enhanced
  );
  const vngResults = calculateROI(
    params,
    {
      ...stationWithoutMarkup,
      businessType: "vng",
    },
    baseFuelPrices,
    10,
    "immediate",
    enhanced
  );

  assert.equal(cgcResults.yearlyTariffFees[0], Math.round(cgcResults.stationCost * 0.192));
  assert.equal(vngResults.yearlyTariffFees[0], Math.round(vngResults.stationCost * 0.18));
}

function testZeroAndEmptyStyleInputsStayFinite() {
  const params: VehicleParameters = {
    ...baseVehicleParameters,
    lightDutyCount: 1,
    lightDutyCost: 0,
    lightDutyMPG: 0,
    lightDutyCngEfficiencyLoss: 1000,
    lightDutyAnnualMiles: 0,
  };
  const fuelPrices: FuelPrices = {
    ...baseFuelPrices,
    gasolinePrice: 0,
    cngPrice: 0,
  };
  const station: StationConfig = {
    ...turnkeyStation,
    stationType: "fast",
  };

  const distribution = applyVehicleLifecycle(distributeVehicles(params, 10, "immediate"), params, 10);
  const results = calculateROI(params, station, fuelPrices, 10, "immediate", distribution);

  const valuesToCheck = [
    results.totalInvestment,
    results.annualFuelSavings,
    results.paybackPeriod,
    results.roi,
    results.annualRateOfReturn,
    results.netCashFlow,
    results.costPerMileGasoline,
    results.costPerMileCNG,
    results.costReduction,
  ];

  valuesToCheck.forEach((value) => {
    assert.ok(Number.isFinite(value), `Expected finite value, received ${value}`);
  });
}

function testPaybackUsesInitialProjectBreakeven() {
  const params: VehicleParameters = {
    ...baseVehicleParameters,
    lightDutyCount: 20,
    mediumDutyCount: 20,
    heavyDutyCount: 20,
  };
  const station: StationConfig = {
    stationType: "fast",
    businessType: "aglc",
    stationOption: "tariff",
    sizingMethod: "peak",
    stationMarkup: 20,
  };
  const fuelPrices: FuelPrices = {
    ...baseFuelPrices,
    gasolinePrice: 3.38,
    dieselPrice: 3.38,
    cngPrice: 0.5,
  };

  const baseDistribution = distributeVehicles(params, 10, "immediate");
  const enhanced = applyVehicleLifecycle(baseDistribution, params, 10);
  const results = calculateROI(
    params,
    station,
    fuelPrices,
    10,
    "immediate",
    enhanced
  );

  // Tariff option: cumulative investment = vehicles upfront + accumulating annual tariff payments.
  // The calculator accumulates the unrounded tariff and rounds at the end of each year.
  const annualTariff = results.stationCost * 0.18;
  assert.equal(results.cumulativeInvestment[0], Math.round(1600000 + annualTariff));
  assert.equal(results.cumulativeInvestment[7], Math.round(1600000 + annualTariff * 8));
  assert.ok(results.paybackPeriod > 0);
}

function testRoiUsesLifecycleCapexIncludingReplacements() {
  const params: VehicleParameters = {
    ...baseVehicleParameters,
    lightDutyCount: 1,
    lightDutyLifespan: 3,
  };

  const baseDistribution = distributeVehicles(params, 10, "immediate");
  const enhanced = applyVehicleLifecycle(baseDistribution, params, 10);
  const results = calculateROI(
    params,
    {
      ...turnkeyStation,
      stationOption: "tariff",
    },
    {
      ...baseFuelPrices,
      gasolinePrice: 1.5,
      cngPrice: 0.5,
    },
    10,
    "immediate",
    enhanced
  );

  const expectedLifecycleVehicleCapex = 4 * params.lightDutyCost;

  assert.equal(results.totalVehicleInvestment, expectedLifecycleVehicleCapex);
  // Tariff option: totalInvestment now includes lifetime tariff payments.
  assert.equal(
    results.totalInvestment,
    expectedLifecycleVehicleCapex + results.totalStationInvestment
  );
  assert.equal(results.netCashFlow, results.cumulativeSavings[9] - results.totalInvestment);
}

function main() {
  testRecurringLifecycleReplacements();
  testDieselConversionFactorAffectsSavings();
  testNonTurnkeyIgnoresPremiumButKeepsTariff();
  testZeroAndEmptyStyleInputsStayFinite();
  testPaybackUsesInitialProjectBreakeven();
  testRoiUsesLifecycleCapexIncludingReplacements();
  console.log("calculator regression checks passed");
}

main();
