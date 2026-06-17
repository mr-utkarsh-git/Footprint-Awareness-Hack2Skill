const { carbonMath, FACTORS } = require('../script.js');

describe('EcoSphere Carbon Tracker Mathematics Unit Tests', () => {
  
  test('1. Emission Factors Database Integrity', () => {
    // Transport factors
    expect(FACTORS.vehicle.none).toBe(0);
    expect(FACTORS.vehicle.petrol).toBe(0.18);
    expect(FACTORS.vehicle.diesel).toBe(0.17);
    expect(FACTORS.vehicle.hybrid).toBe(0.10);
    expect(FACTORS.vehicle.electric).toBe(0.05);
    expect(FACTORS.publicTransit).toBe(0.04);
    expect(FACTORS.flightShort).toBe(150);
    expect(FACTORS.flightLong).toBe(600);

    // Energy factors
    expect(FACTORS.kwhPrice).toBe(0.15);
    expect(FACTORS.gridIntensity.india).toBe(0.82);
    expect(FACTORS.gridIntensity.us).toBe(0.40);
    expect(FACTORS.gridIntensity.eu).toBe(0.35);
    expect(FACTORS.gridIntensity.sweden).toBe(0.02);

    // Heating factors
    expect(FACTORS.heating.electric).toBe(200);
    expect(FACTORS.heating.gas).toBe(1200);
    expect(FACTORS.heating.oil).toBe(2000);
    expect(FACTORS.heating.none).toBe(100);

    // Diet factors
    expect(FACTORS.diet['heavy-meat']).toBe(2.5);
    expect(FACTORS.diet['average-meat']).toBe(1.7);
    expect(FACTORS.diet.vegetarian).toBe(1.2);
    expect(FACTORS.diet.vegan).toBe(0.8);

    // Food waste adjustments
    expect(FACTORS.foodWaste[1]).toBe(-0.1);
    expect(FACTORS.foodWaste[2]).toBe(0.0);
    expect(FACTORS.foodWaste[3]).toBe(0.3);

    // Waste factors
    expect(FACTORS.wasteBase).toBe(0.6);
    expect(FACTORS.recycleOffset).toBe(-0.08);
    expect(FACTORS.shopping[1]).toBe(-0.15);
    expect(FACTORS.shopping[2]).toBe(0.0);
    expect(FACTORS.shopping[3]).toBe(0.35);
  });

  test('2. Input Validation Logic', () => {
    const validateInputs = (inputs) => {
      if (inputs.vehicleDistance < 0) return false;
      if (inputs.publicTransit < 0) return false;
      if (inputs.flightsShort < 0) return false;
      if (inputs.flightsLong < 0) return false;
      if (inputs.electricBill < 0) return false;
      if (inputs.renewablePct < 0 || inputs.renewablePct > 100) return false;
      return true;
    };

    // Positive case
    expect(validateInputs({
      vehicleDistance: 250,
      publicTransit: 100,
      flightsShort: 4,
      flightsLong: 2,
      electricBill: 120,
      renewablePct: 40
    })).toBe(true);

    // Negative cases
    expect(validateInputs({ vehicleDistance: -10 })).toBe(false);
    expect(validateInputs({ publicTransit: -5 })).toBe(false);
    expect(validateInputs({ flightsShort: -1 })).toBe(false);
    expect(validateInputs({ flightsLong: -2 })).toBe(false);
    expect(validateInputs({ electricBill: -50 })).toBe(false);
    expect(validateInputs({ renewablePct: -1 })).toBe(false);
    expect(validateInputs({ renewablePct: 101 })).toBe(false);
  });

  test('3. Transportation Math Calculations', () => {
    // Case A: Zero commute
    const tA = carbonMath.calculateTransport({
      vehicleType: 'none',
      vehicleDistance: 0,
      publicTransit: 0,
      flightsShort: 0,
      flightsLong: 0
    });
    expect(tA).toBeCloseTo(0.0, 4);

    // Case B: Petrol Car commute only
    const tB = carbonMath.calculateTransport({
      vehicleType: 'petrol',
      vehicleDistance: 300,
      publicTransit: 0,
      flightsShort: 0,
      flightsLong: 0
    });
    // formula: (300 * 0.18 * 52) / 1000 = 2.808 tons
    expect(tB).toBeCloseTo(2.808, 4);

    // Case C: Transit commute only
    const tC = carbonMath.calculateTransport({
      vehicleType: 'none',
      vehicleDistance: 0,
      publicTransit: 150,
      flightsShort: 0,
      flightsLong: 0
    });
    // formula: (150 * 0.04 * 52) / 1000 = 0.312 tons
    expect(tC).toBeCloseTo(0.312, 4);

    // Case D: Mixed commute and aviation
    const tD = carbonMath.calculateTransport({
      vehicleType: 'electric',
      vehicleDistance: 200,
      publicTransit: 50,
      flightsShort: 4,
      flightsLong: 2
    });
    // formula: (200 * 0.05 * 52 + 50 * 0.04 * 52 + 4 * 150 + 2 * 600) / 1000
    // = (520 + 104 + 600 + 1200) / 1000 = 2.424 tons
    expect(tD).toBeCloseTo(2.424, 4);
  });

  test('4. Home Energy Math Calculations', () => {
    // Case A: India grid, gas heating, 0% clean tariff
    const eA = carbonMath.calculateEnergy({
      electricBill: 150,
      utilityRegion: 'india',
      renewablePct: 0,
      heatingSource: 'gas'
    });
    // kWh = 150 / 0.15 = 1000 kWh monthly
    // electric = 1000 * 0.82 * 12 = 9840 kg
    // heating = 1200 kg
    // total = (9840 + 1200) / 1000 = 11.04 tons
    expect(eA).toBeCloseTo(11.040, 4);

    // Case B: US grid, oil heating, 100% clean tariff
    const eB = carbonMath.calculateEnergy({
      electricBill: 200,
      utilityRegion: 'us',
      renewablePct: 100,
      heatingSource: 'oil'
    });
    // electric = 0 (due to 100% clean discount)
    // heating = 2000 kg
    // total = 2000 / 1000 = 2.0 tons
    expect(eB).toBeCloseTo(2.0, 4);

    // Case C: Sweden clean grid, heat pump heating, 50% clean tariff
    const eC = carbonMath.calculateEnergy({
      electricBill: 150,
      utilityRegion: 'sweden',
      renewablePct: 50,
      heatingSource: 'electric'
    });
    // kWh = 1000 kWh
    // electric = 1000 * 0.02 * 12 = 240 kg
    // after 50% discount = 120 kg
    // heating = 200 kg
    // total = (120 + 200) / 1000 = 0.32 tons
    expect(eC).toBeCloseTo(0.320, 4);
  });

  test('5. Diet & Food Math Calculations', () => {
    // Average Meat + Moderate waste
    const fA = carbonMath.calculateFood({ dietType: 'average-meat', foodWaste: 2 });
    expect(fA).toBeCloseTo(1.7, 4);

    // Heavy Meat + High waste
    const fB = carbonMath.calculateFood({ dietType: 'heavy-meat', foodWaste: 3 });
    expect(fB).toBeCloseTo(2.8, 4);

    // Vegan + Low waste
    const fC = carbonMath.calculateFood({ dietType: 'vegan', foodWaste: 1 });
    expect(fC).toBeCloseTo(0.7, 4);
  });

  test('6. Waste & Recycling Math Calculations', () => {
    // Average shopper, no recycling
    const wA = carbonMath.calculateWaste({
      shoppingFrequency: 2,
      recyclePaper: false, recyclePlastic: false, recycleGlass: false, recycleMetal: false, recycleCompost: false
    });
    expect(wA).toBeCloseTo(0.6, 4);

    // Minimalist shopper, partial recycling
    const wB = carbonMath.calculateWaste({
      shoppingFrequency: 1,
      recyclePaper: true, recyclePlastic: true, recycleGlass: false, recycleMetal: false, recycleCompost: false
    });
    // base = 0.6, shopping = -0.15, recycling offset = 2 * -0.08 = -0.16
    // total = 0.6 - 0.15 - 0.16 = 0.29 tons
    expect(wB).toBeCloseTo(0.29, 4);

    // Heavy shopper, full recycling (checks floor limit of 0.1 tons)
    const wC = carbonMath.calculateWaste({
      shoppingFrequency: 1,
      recyclePaper: true, recyclePlastic: true, recycleGlass: true, recycleMetal: true, recycleCompost: true
    });
    // base = 0.6, shopping = -0.15, offset = 5 * -0.08 = -0.40
    // sum = 0.05. floor = 0.1
    expect(wC).toBeCloseTo(0.1, 4);
  });

  test('7. Pledge Reductions & Ecological Grade Thresholds', () => {
    // Net footprint with pledges
    const originalFootprint = 10.0;
    // transit-twice (0.40) + ev-switch (1.50) + green-tariff (0.80) = 2.70 savings
    const netFootprint = carbonMath.calculateTotalNet(originalFootprint, ['transit-twice', 'ev-switch', 'green-tariff']);
    expect(netFootprint).toBeCloseTo(7.30, 4);

    // Floor net footprint check (must be at least 0.1 tons)
    const netFloor = carbonMath.calculateTotalNet(0.5, ['ev-switch']);
    expect(netFloor).toBeCloseTo(0.1, 4);

    // Grade A+ (<= 2.0)
    expect(carbonMath.calculateEcologicalGrade(1.5).grade).toBe('A+');
    expect(carbonMath.calculateEcologicalGrade(2.0).grade).toBe('A+');

    // Grade A (<= 3.5)
    expect(carbonMath.calculateEcologicalGrade(2.5).grade).toBe('A');
    expect(carbonMath.calculateEcologicalGrade(3.5).grade).toBe('A');

    // Grade B (<= 5.5)
    expect(carbonMath.calculateEcologicalGrade(4.2).grade).toBe('B');
    expect(carbonMath.calculateEcologicalGrade(5.5).grade).toBe('B');

    // Grade C (<= 9.0)
    expect(carbonMath.calculateEcologicalGrade(6.8).grade).toBe('C');
    expect(carbonMath.calculateEcologicalGrade(9.0).grade).toBe('C');

    // Grade D (> 9.0)
    expect(carbonMath.calculateEcologicalGrade(9.5).grade).toBe('D');
  });
});
