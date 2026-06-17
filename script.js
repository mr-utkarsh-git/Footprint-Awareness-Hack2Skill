// Mock browser environment for Node.js runtime (avoids ReferenceErrors during unit test importing)
if (typeof window === 'undefined') {
  const noop = () => {};
  const mockElement = {
    addEventListener: noop,
    removeEventListener: noop,
    setAttribute: noop,
    getAttribute: () => '',
    classList: { add: noop, remove: noop, contains: () => false, toggle: noop },
    style: {},
    appendChild: noop,
    removeChild: noop,
    querySelectorAll: () => [],
    querySelector: () => null,
    focus: noop,
    blur: noop
  };
  global.window = {
    addEventListener: noop,
    removeEventListener: noop
  };
  global.document = {
    documentElement: mockElement,
    getElementById: () => mockElement,
    querySelectorAll: () => [],
    querySelector: () => mockElement,
    createElement: () => mockElement,
    createElementNS: () => mockElement
  };
}

// --- App State Management ---
const state = {
  theme: 'dark',
  currentStep: 1,
  calculatorCompleted: false,
  userName: 'Utkarsh Raj',
  
  // Inputs from form
  inputs: {
    vehicleType: 'none',
    vehicleDistance: 0,
    publicTransit: 50,
    flightsShort: 2,
    flightsLong: 0,
    utilityRegion: 'us',
    electricBill: 80,
    renewablePct: 0,
    heatingSource: 'electric',
    dietType: 'average-meat',
    foodWaste: 2,
    recyclePaper: true,
    recyclePlastic: true,
    recycleGlass: false,
    recycleMetal: false,
    recycleCompost: false,
    shoppingFrequency: 2
  },

  // Calculations
  results: {
    transport: 0,
    energy: 0,
    food: 0,
    waste: 0,
    totalOriginal: 0,
    totalNet: 0
  },

  // Gamification & Pledges
  committedPledges: [], // array of pledgeIds
  xp: 0,
  level: 1,
  rankTitle: 'Seedling'
};

// --- Emission Coefficients (Scientific Standards) ---
const FACTORS = {
  // Transport (kg CO2e per km)
  vehicle: {
    none: 0,
    petrol: 0.18,
    diesel: 0.17,
    hybrid: 0.10,
    electric: 0.05
  },
  publicTransit: 0.04, // kg CO2e per km
  flightShort: 150,    // kg CO2e per flight (flat estimate for short-haul flight)
  flightLong: 600,     // kg CO2e per flight (flat estimate for long-haul flight)
  
  // Energy
  kwhPrice: 0.15,      // $0.15 average per kWh
  gridIntensity: {
    india: 0.82,
    us: 0.40,
    eu: 0.35,
    sweden: 0.02
  },
  heating: {
    electric: 200,     // efficient heat pump base annual kg CO2e
    gas: 1200,         // gas boiler base annual kg CO2e
    oil: 2000,         // oil burner base annual kg CO2e
    none: 100          // passive/wood/none
  },

  // Diet (Tons CO2e per year base values)
  diet: {
    'heavy-meat': 2.5,
    'average-meat': 1.7,
    'vegetarian': 1.2,
    'vegan': 0.8
  },
  
  // Food Waste multiplier adjustments (Tons CO2e/year)
  foodWaste: {
    1: -0.1,  // Low waste
    2: 0.0,   // Moderate waste
    3: 0.3    // High waste
  },

  // Waste Base (Tons CO2e per year)
  wasteBase: 0.6,
  recycleOffset: -0.08, // Tons CO2e saved per recycled category annually (max 5)
  shopping: {
    1: -0.15, // Minimalist
    2: 0.0,   // Average
    3: 0.35   // Heavy shopper
  }
};

// --- Pledges Configuration Database ---
const PLEDGES = {
  'transit-twice': { title: 'Active Commuting', co2: 0.40, xp: 100 },
  'ev-switch': { title: 'Electric Horizon', co2: 1.50, xp: 300 },
  'skip-flight': { title: 'Aviation Sabbatical', co2: 0.35, xp: 120 },
  'green-tariff': { title: 'Renewable Grid Tariff', co2: 0.80, xp: 150 },
  'led-lightbulbs': { title: 'Luminescent LED Upgrade', co2: 0.12, xp: 50 },
  'unplug-vampire': { title: 'Phantom Killers', co2: 0.06, xp: 40 },
  'meatless-mondays': { title: 'Meatless Mondays', co2: 0.30, xp: 100 },
  'plant-diet': { title: 'Herbivore Transition', co2: 1.10, xp: 250 },
  'compost-remains': { title: 'Compost Collective', co2: 0.20, xp: 80 },
  'ditch-plastic': { title: 'Single-Use Exit', co2: 0.10, xp: 60 },
  'secondhand-first': { title: 'Secondhand Circularity', co2: 0.25, xp: 120 }
};

// --- DOM References ---
const docHtml = document.documentElement;
const themeToggle = document.getElementById('btn-theme-toggle');
const mobileToggle = document.getElementById('mobile-toggle');
const navMenu = document.getElementById('nav-menu');

// Hero Simulator
const simCommuteSelect = document.getElementById('sim-commute-type');
const simDistanceInput = document.getElementById('sim-distance');
const simDistanceVal = document.getElementById('sim-distance-val');
const simCo2Val = document.getElementById('sim-co2-val');
const simNote = document.getElementById('sim-note');

// Form Navigation and inputs
const prevStepBtn = document.getElementById('btn-prev-step');
const nextStepBtn = document.getElementById('btn-next-step');
const submitCalcBtn = document.getElementById('btn-submit-calc');
const wizardForm = document.getElementById('footprint-form');
const wizardPanels = document.querySelectorAll('.wizard-panel');
const stepIndicators = document.querySelectorAll('.step-indicator');

// Form inputs
const inputVehicleType = document.getElementById('vehicle-type');
const inputUtilityRegion = document.getElementById('utility-region');
const inputVehicleDistance = document.getElementById('vehicle-distance');
const inputVehicleDistanceVal = document.getElementById('vehicle-distance-val');
const inputVehicleDistanceGroup = document.getElementById('vehicle-distance-group');
const inputPublicTransit = document.getElementById('public-transit');
const inputPublicTransitVal = document.getElementById('public-transit-val');
const inputFlightsShort = document.getElementById('flights-short');
const inputFlightsLong = document.getElementById('flights-long');
const inputElectricBill = document.getElementById('electric-bill');
const inputElectricBillVal = document.getElementById('electric-bill-val');
const inputRenewablePct = document.getElementById('renewable-pct');
const inputRenewablePctVal = document.getElementById('renewable-pct-val');
const inputHeatingSource = document.getElementById('heating-source');
const inputFoodWaste = document.getElementById('food-waste');
const inputFoodWasteLbl = document.getElementById('food-waste-lbl');
const inputShopping = document.getElementById('shopping-frequency');
const inputShoppingLbl = document.getElementById('shopping-lbl');

const checkboxPaper = document.getElementById('recycle-paper');
const checkboxPlastic = document.getElementById('recycle-plastic');
const checkboxGlass = document.getElementById('recycle-glass');
const checkboxMetal = document.getElementById('recycle-metal');
const checkboxCompost = document.getElementById('recycle-compost');

// Dashboard Lock
const dashboardSection = document.getElementById('dashboard');
const dashboardLockOverlay = document.getElementById('dashboard-lock-overlay');
const jumpCalcBtn = document.getElementById('btn-jump-calc');

// Dashboard metrics
const dashCo2Total = document.getElementById('dash-co2-total');
const dashComparisonText = document.getElementById('dash-comparison-text');
const dashEcoGrade = document.getElementById('dash-eco-grade');
const dashGradeLabel = document.getElementById('dash-grade-label');
const dashPledgesSavings = document.getElementById('dash-pledges-savings');
const dashPledgesCount = document.getElementById('dash-pledges-count');
const userScalePin = document.getElementById('user-scale-pin');
const pinVal = document.getElementById('pin-val');

// Donut Chart
const donutSegmentsGroup = document.getElementById('donut-segments');
const donutCenterTotal = document.getElementById('donut-center-total');

// Diagnostics
const diagTransportVal = document.getElementById('diag-transport-val');
const diagTransportBadge = document.getElementById('diag-transport-badge');
const diagTransportTip = document.getElementById('diag-transport-tip');

const diagEnergyVal = document.getElementById('diag-energy-val');
const diagEnergyBadge = document.getElementById('diag-energy-badge');
const diagEnergyTip = document.getElementById('diag-energy-tip');

const diagFoodVal = document.getElementById('diag-food-val');
const diagFoodBadge = document.getElementById('diag-food-badge');
const diagFoodTip = document.getElementById('diag-food-tip');

const diagWasteVal = document.getElementById('diag-waste-val');
const diagWasteBadge = document.getElementById('diag-waste-badge');
const diagWasteTip = document.getElementById('diag-waste-tip');

// Report Card
const generateReportBtn = document.getElementById('btn-generate-report');
const reportCardPreviewArea = document.getElementById('report-card-preview-area');
const reportUserName = document.getElementById('report-user-name');
const reportCo2Val = document.getElementById('report-co2-val');
const reportGradeVal = document.getElementById('report-grade-val');
const reportPledgesCount = document.getElementById('report-pledges-count');
const reportBadgesList = document.getElementById('report-badges-list');
const reportDateStr = document.getElementById('report-date-str');
const shareTextContent = document.getElementById('share-text-content');
const copyShareBtn = document.getElementById('btn-copy-share');
const linkedinShareBtn = document.getElementById('btn-linkedin-share');

// Pledges
const userEcoRank = document.getElementById('user-eco-rank');
const userXpDisplay = document.getElementById('user-xp-display');
const userXpBar = document.getElementById('user-xp-bar');
const pledgesReductionHeader = document.getElementById('pledges-reduction-header');

// Resources FAQ Accordion
const accordionItems = document.querySelectorAll('.accordion-item');

// AI Advisor bindings
const aiAdvisorStatus = document.getElementById('ai-advisor-status');
const aiConsoleOutput = document.getElementById('ai-console-output');
const btnRunAiConsult = document.getElementById('btn-run-ai-consult');

// Trend Line Chart bindings
const trendLinePath = document.getElementById('trend-line-path');
const trendAreaPath = document.getElementById('trend-area-path');
const trendPointsGroup = document.getElementById('trend-points');

// Results Modal bindings
const resultsModal = document.getElementById('results-modal');
const btnCloseResultsModal = document.getElementById('btn-close-results-modal');
const btnModalToDashboard = document.getElementById('btn-modal-to-dashboard');
const modalCo2Val = document.getElementById('modal-co2-val');
const modalStatusVal = document.getElementById('modal-status-val');
const modalAiTip = document.getElementById('modal-ai-tip');

// --- Initialization & Local Storage ---
window.addEventListener('DOMContentLoaded', () => {
  loadSavedState();
  initTheme();
  initListeners();
  runHeroSimulator();
  renderWizardStep();
  
  if (state.calculatorCompleted) {
    unlockDashboard();
    calculateFootprint();
  }
});

function loadSavedState() {
  const savedState = localStorage.getItem('ecosphere_state');
  if (savedState) {
    try {
      const parsed = JSON.parse(savedState);
      Object.assign(state, parsed);
      
      // Load inputs to DOM
      inputVehicleType.value = state.inputs.vehicleType;
      inputVehicleDistance.value = state.inputs.vehicleDistance;
      inputPublicTransit.value = state.inputs.publicTransit;
      inputFlightsShort.value = state.inputs.flightsShort;
      inputFlightsLong.value = state.inputs.flightsLong;
      state.inputs.utilityRegion = state.inputs.utilityRegion || 'us';
      inputUtilityRegion.value = state.inputs.utilityRegion;
      inputElectricBill.value = state.inputs.electricBill;
      inputRenewablePct.value = state.inputs.renewablePct;
      inputHeatingSource.value = state.inputs.heatingSource;
      inputFoodWaste.value = state.inputs.foodWaste;
      inputShopping.value = state.inputs.shoppingFrequency;

      checkboxPaper.checked = state.inputs.recyclePaper;
      checkboxPlastic.checked = state.inputs.recyclePlastic;
      checkboxGlass.checked = state.inputs.recycleGlass;
      checkboxMetal.checked = state.inputs.recycleMetal;
      checkboxCompost.checked = state.inputs.recycleCompost;

      // Update slider value texts
      inputVehicleDistanceVal.textContent = state.inputs.vehicleDistance;
      inputPublicTransitVal.textContent = state.inputs.publicTransit;
      inputElectricBillVal.textContent = state.inputs.electricBill;
      inputRenewablePctVal.textContent = state.inputs.renewablePct;
      updateFoodWasteLabel(state.inputs.foodWaste);
      updateShoppingLabel(state.inputs.shoppingFrequency);
      
      toggleVehicleDistanceVisibility(state.inputs.vehicleType);
      
      // Highlight diet button
      const dietBtns = document.querySelectorAll('#diet-group-btns button');
      dietBtns.forEach(btn => {
        if (btn.dataset.diet === state.inputs.dietType) {
          btn.classList.add('active');
        } else {
          btn.classList.remove('active');
        }
      });
      
      // Restore committed pledges in DOM
      state.committedPledges.forEach(pledgeId => {
        const pledgeCard = document.querySelector(`.pledge-card[data-pledge-id="${pledgeId}"]`);
        if (pledgeCard) {
          pledgeCard.classList.add('committed');
          const btn = pledgeCard.querySelector('.btn-pledge-action');
          if (btn) btn.textContent = 'Committed';
        }
      });
      
    } catch (e) {
      console.error('Error loading local storage state:', e);
    }
  }
  
  // Always update dates
  const now = new Date();
  const options = { month: 'long', year: 'numeric' };
  reportDateStr.textContent = now.toLocaleDateString('en-US', options);
}

function saveState() {
  localStorage.setItem('ecosphere_state', JSON.stringify(state));
}

// --- Theme Switching ---
function initTheme() {
  const localTheme = localStorage.getItem('ecosphere_theme');
  if (localTheme) {
    state.theme = localTheme;
  }
  applyTheme();
}

function applyTheme() {
  docHtml.setAttribute('data-theme', state.theme);
  localStorage.setItem('ecosphere_theme', state.theme);
  
  const sunIcon = themeToggle.querySelector('.sun-icon');
  const moonIcon = themeToggle.querySelector('.moon-icon');
  
  if (state.theme === 'light') {
    sunIcon.classList.add('hidden');
    moonIcon.classList.remove('hidden');
  } else {
    sunIcon.classList.remove('hidden');
    moonIcon.classList.add('hidden');
  }
}

// --- Event Listeners Setup ---
function initListeners() {
  // Theme Toggle Click
  themeToggle.addEventListener('click', () => {
    state.theme = state.theme === 'dark' ? 'light' : 'dark';
    applyTheme();
  });

  // Mobile Toggle menu Click
  mobileToggle.addEventListener('click', () => {
    navMenu.classList.toggle('mobile-active');
  });

  // Close Mobile Menu on link clicks
  const navLinks = document.querySelectorAll('.nav-links a');
  navLinks.forEach(link => {
    link.addEventListener('click', () => {
      navMenu.classList.remove('mobile-active');
    });
  });

  // Quick commute estimator listeners
  simCommuteSelect.addEventListener('change', runHeroSimulator);
  simDistanceInput.addEventListener('input', (e) => {
    simDistanceVal.textContent = e.target.value;
    runHeroSimulator();
  });

  // Wizard input value syncer listeners
  inputVehicleType.addEventListener('change', (e) => {
    state.inputs.vehicleType = e.target.value;
    toggleVehicleDistanceVisibility(e.target.value);
    saveState();
  });

  inputUtilityRegion.addEventListener('change', (e) => {
    state.inputs.utilityRegion = e.target.value;
    saveState();
  });

  inputVehicleDistance.addEventListener('input', (e) => {
    inputVehicleDistanceVal.textContent = e.target.value;
    state.inputs.vehicleDistance = parseInt(e.target.value) || 0;
    saveState();
  });

  inputPublicTransit.addEventListener('input', (e) => {
    inputPublicTransitVal.textContent = e.target.value;
    state.inputs.publicTransit = parseInt(e.target.value) || 0;
    saveState();
  });

  inputFlightsShort.addEventListener('change', (e) => {
    state.inputs.flightsShort = Math.max(0, parseInt(e.target.value) || 0);
    saveState();
  });

  inputFlightsLong.addEventListener('change', (e) => {
    state.inputs.flightsLong = Math.max(0, parseInt(e.target.value) || 0);
    saveState();
  });

  inputElectricBill.addEventListener('input', (e) => {
    inputElectricBillVal.textContent = e.target.value;
    state.inputs.electricBill = parseInt(e.target.value) || 0;
    saveState();
  });

  inputRenewablePct.addEventListener('input', (e) => {
    inputRenewablePctVal.textContent = e.target.value;
    state.inputs.renewablePct = parseInt(e.target.value) || 0;
    saveState();
  });

  inputHeatingSource.addEventListener('change', (e) => {
    state.inputs.heatingSource = e.target.value;
    saveState();
  });

  inputFoodWaste.addEventListener('input', (e) => {
    const val = parseInt(e.target.value);
    updateFoodWasteLabel(val);
    state.inputs.foodWaste = val;
    saveState();
  });

  inputShopping.addEventListener('input', (e) => {
    const val = parseInt(e.target.value);
    updateShoppingLabel(val);
    state.inputs.shoppingFrequency = val;
    saveState();
  });

  // Checkboxes
  const checkboxes = [
    { el: checkboxPaper, key: 'recyclePaper' },
    { el: checkboxPlastic, key: 'recyclePlastic' },
    { el: checkboxGlass, key: 'recycleGlass' },
    { el: checkboxMetal, key: 'recycleMetal' },
    { el: checkboxCompost, key: 'recycleCompost' }
  ];

  checkboxes.forEach(chk => {
    chk.el.addEventListener('change', (e) => {
      state.inputs[chk.key] = e.target.checked;
      saveState();
    });
  });

  // Diet select buttons
  const dietBtns = document.querySelectorAll('#diet-group-btns button');
  dietBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      dietBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.inputs.dietType = btn.dataset.diet;
      saveState();
    });
  });

  // Wizard Step Buttons
  prevStepBtn.addEventListener('click', handlePrevStep);
  nextStepBtn.addEventListener('click', handleNextStep);
  wizardForm.addEventListener('submit', handleFormSubmit);

  // Jump to calculator from lock screen
  jumpCalcBtn.addEventListener('click', () => {
    document.getElementById('calculator').scrollIntoView({ behavior: 'smooth' });
  });

  // Pledges cards commitment click toggle
  const pledgeCards = document.querySelectorAll('.pledge-card');
  pledgeCards.forEach(card => {
    const btn = card.querySelector('.btn-pledge-action');
    const pledgeId = card.dataset.pledgeId;
    if (btn && PLEDGES[pledgeId]) {
      const isCommitted = state.committedPledges.includes(pledgeId);
      btn.setAttribute('aria-label', `${isCommitted ? 'Committed to' : 'Commit to'} ${PLEDGES[pledgeId].title}`);
    }

    btn.addEventListener('click', () => {
      togglePledge(pledgeId, card, btn);
    });
  });

  // Report Card Compilation click
  generateReportBtn.addEventListener('click', compileReportCard);

  // Copy shareable text
  copyShareBtn.addEventListener('click', () => {
    shareTextContent.select();
    navigator.clipboard.writeText(shareTextContent.value).then(() => {
      const origText = copyShareBtn.textContent;
      copyShareBtn.textContent = '✓ Copied!';
      setTimeout(() => {
        copyShareBtn.textContent = origText;
      }, 2000);
    });
  });

  // Resources Accordion click handlers
  accordionItems.forEach(item => {
    const trigger = item.querySelector('.accordion-trigger');
    const panel = item.querySelector('.accordion-panel');
    
    trigger.addEventListener('click', () => {
      const isExpanded = trigger.getAttribute('aria-expanded') === 'true';
      
      // Close all other panels
      accordionItems.forEach(otherItem => {
        if (otherItem !== item) {
          otherItem.classList.remove('active');
          otherItem.querySelector('.accordion-trigger').setAttribute('aria-expanded', 'false');
          otherItem.querySelector('.accordion-panel').style.maxHeight = null;
        }
      });
      
      // Toggle current panel
      item.classList.toggle('active');
      trigger.setAttribute('aria-expanded', !isExpanded);
      
      if (!isExpanded) {
        panel.style.maxHeight = panel.scrollHeight + 'px';
      } else {
        panel.style.maxHeight = null;
      }
    });
  });

  // Editable report name updates state
  reportUserName.addEventListener('blur', () => {
    const text = reportUserName.textContent.trim();
    if (text) {
      state.userName = text;
      saveState();
      updateShareTextBox();
    }
  });
  reportUserName.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      reportUserName.blur();
    }
  });

  // AI Consult Button click
  btnRunAiConsult.addEventListener('click', runAiSustainabilityConsultation);

  // Close Results Modal listeners
  btnCloseResultsModal.addEventListener('click', closeModal);
  btnModalToDashboard.addEventListener('click', closeModal);
}

// --- Dynamic Commute Estimator Logic ---
function runHeroSimulator() {
  const mode = simCommuteSelect.value;
  const distance = parseFloat(simDistanceInput.value) || 0;
  
  const factor = FACTORS.vehicle[mode] !== undefined ? FACTORS.vehicle[mode] : FACTORS.publicTransit;
  
  // emissions per year in metric tons
  const emissions = (distance * factor * 52) / 1000;
  simCo2Val.textContent = emissions.toFixed(2);
  
  // Trees equivalent
  const trees = Math.round((emissions * 1000) / 22);
  if (emissions === 0) {
    simNote.textContent = 'Zero carbon commute. Excellent choice!';
  } else {
    simNote.textContent = `Absorbing this carbon requires planting ${trees} trees annually.`;
  }
}

function toggleVehicleDistanceVisibility(mode) {
  if (mode === 'none') {
    inputVehicleDistanceGroup.classList.add('hidden');
  } else {
    inputVehicleDistanceGroup.classList.remove('hidden');
  }
}

function updateFoodWasteLabel(val) {
  if (val === 1) {
    inputFoodWasteLbl.textContent = 'Low (Eat all leftovers, compost remains)';
  } else if (val === 2) {
    inputFoodWasteLbl.textContent = 'Moderate (Some leftovers tossed)';
  } else {
    inputFoodWasteLbl.textContent = 'High (Food expires, regular discarding)';
  }
}

function updateShoppingLabel(val) {
  if (val === 1) {
    inputShoppingLbl.textContent = 'Minimalist (Rare non-essential items)';
  } else if (val === 2) {
    inputShoppingLbl.textContent = 'Average Consumer (Standard clothing/tech)';
  } else {
    inputShoppingLbl.textContent = 'Heavy Shopper (Frequent monthly parcels)';
  }
}

// --- Wizard Form Navigation ---
function renderWizardStep() {
  // Hide all panels
  wizardPanels.forEach(panel => panel.classList.remove('active'));
  stepIndicators.forEach(ind => {
    ind.classList.remove('active');
    const step = parseInt(ind.dataset.step);
    if (step < state.currentStep) {
      ind.classList.add('completed');
    } else {
      ind.classList.remove('completed');
    }
  });
  
  // Show active panel
  const activePanel = document.querySelector(`.wizard-panel[data-panel="${state.currentStep}"]`);
  if (activePanel) activePanel.classList.add('active');
  
  const activeIndicator = document.querySelector(`.step-indicator[data-step="${state.currentStep}"]`);
  if (activeIndicator) activeIndicator.classList.add('active');
  
  // Toggle footer buttons
  prevStepBtn.disabled = state.currentStep === 1;
  
  if (state.currentStep === 4) {
    nextStepBtn.classList.add('hidden');
    submitCalcBtn.classList.remove('hidden');
  } else {
    nextStepBtn.classList.remove('hidden');
    submitCalcBtn.classList.add('hidden');
  }
}

function handleNextStep() {
  if (state.currentStep < 4) {
    state.currentStep++;
    renderWizardStep();
    saveState();
  }
}

function handlePrevStep() {
  if (state.currentStep > 1) {
    state.currentStep--;
    renderWizardStep();
    saveState();
  }
}

function handleFormSubmit(e) {
  e.preventDefault();
  state.calculatorCompleted = true;
  saveState();
  
  unlockDashboard();
  calculateFootprint();
  showResultsModal();
  
  // Scroll to dashboard
  setTimeout(() => {
    dashboardSection.scrollIntoView({ behavior: 'smooth' });
  }, 100);
}

function unlockDashboard() {
  dashboardSection.classList.remove('section-locked');
  dashboardLockOverlay.classList.add('hidden');
  btnRunAiConsult.removeAttribute('disabled');
  btnRunAiConsult.textContent = 'Ask AI Advisor for Actions';
}

// --- Main Carbon Calculations ---
// Calculates carbon emissions based on user lifestyle inputs
/**
 * Calculates carbon emissions based on user lifestyle inputs and updates state and dashboard.
 */
function calculateFootprint() {
  state.results.transport = carbonMath.calculateTransport(state.inputs);
  state.results.energy = carbonMath.calculateEnergy(state.inputs);
  state.results.food = carbonMath.calculateFood(state.inputs);
  state.results.waste = carbonMath.calculateWaste(state.inputs);

  // Totals
  state.results.totalOriginal = carbonMath.calculateTotalOriginal(state.inputs);
  
  updateDashboardResults();
}

/**
 * Updates the dashboard metrics, compares scores, and runs diagnostics.
 */
function updateDashboardResults() {
  // Calculate Pledges Reduction Net Savings
  let pledgeSavings = 0;
  let pledgeXp = 0;
  
  state.committedPledges.forEach(pledgeId => {
    if (PLEDGES[pledgeId]) {
      pledgeSavings += PLEDGES[pledgeId].co2;
      pledgeXp += PLEDGES[pledgeId].xp;
    }
  });

  const netFootprint = carbonMath.calculateTotalNet(state.results.totalOriginal, state.committedPledges);
  state.results.totalNet = netFootprint;
  state.xp = pledgeXp;

  // Update DOM metrics
  dashCo2Total.textContent = state.results.totalOriginal.toFixed(2);
  dashPledgesSavings.textContent = pledgeSavings.toFixed(2);
  dashPledgesCount.textContent = `${state.committedPledges.length} Pledges Active`;

  // Scale pins
  const maxMeterValue = 18.0; // 18 tons maxes the bar
  const pinPercentage = Math.min(100, (netFootprint / maxMeterValue) * 100);
  userScalePin.style.left = `${pinPercentage}%`;
  pinVal.textContent = netFootprint.toFixed(1);

  // Grade & Global comparison texts
  const gradeData = carbonMath.calculateEcologicalGrade(netFootprint);
  dashEcoGrade.textContent = gradeData.grade;
  dashEcoGrade.className = `metric-value grade-value grade-${gradeData.grade.replace('+', 'plus')}`;
  dashGradeLabel.textContent = gradeData.label;

  let comparisonText = '';
  if (netFootprint < 2.0) {
    comparisonText = '🎉 Within the 1.5°C Global warming target!';
  } else if (netFootprint < 4.0) {
    comparisonText = '🍀 Lower than the Global Average (4.0t)';
  } else if (netFootprint < 7.0) {
    comparisonText = '⚠️ Higher than Global Average. Shift commitments!';
  } else if (netFootprint < 16.0) {
    comparisonText = '📈 Higher than EU Average. Substantial adjustments needed.';
  } else {
    comparisonText = '🚨 Carbon Heavyweight. Double your energy reduction!';
  }
  dashComparisonText.textContent = comparisonText;

  // Level Up progress
  updateXPBadgeLevels(pledgeXp);

  // Render SVG chart
  renderDonutChart(state.results.transport, state.results.energy, state.results.food, state.results.waste);

  // Diagnostics card specifics
  updateDiagnosticCard('card-transport', state.results.transport, 'Transport', [
    { limit: 1.0, badge: 'Eco', class: 'badge-green', tip: 'Your travel footprint is minimal. Walking, cycling, or clean transits work wonders!' },
    { limit: 3.5, badge: 'Moderate', class: 'badge-yellow', tip: 'Commuting creates mid-range emissions. Consider carpooling or switching to hybrid models.' },
    { limit: 99.0, badge: 'High Impact', class: 'badge-red', tip: 'High flight count or long single commutes. Prioritize public transits or limit air travel.' }
  ], diagTransportVal, diagTransportBadge, diagTransportTip);

  updateDiagnosticCard('card-energy', state.results.energy, 'Energy', [
    { limit: 0.8, badge: 'Eco', class: 'badge-green', tip: 'Your utilities are highly carbon optimized. Good green solar/grid selections!' },
    { limit: 2.5, badge: 'Moderate', class: 'badge-yellow', tip: 'Standard gas boilers and grid electricity. Transition to LEDs or renewable grid packages.' },
    { limit: 99.0, badge: 'High Impact', class: 'badge-red', tip: 'High monthly bill or fuel heating oil. Consider upgrading to electric heat pumps.' }
  ], diagEnergyVal, diagEnergyBadge, diagEnergyTip);

  updateDiagnosticCard('card-food', state.results.food, 'Food', [
    { limit: 1.1, badge: 'Eco', class: 'badge-green', tip: 'Vegan or plant-forward style keeps methane agricultural footprints minimal. Outstanding!' },
    { limit: 2.0, badge: 'Moderate', class: 'badge-yellow', tip: 'Average balanced diets are okay, but limiting dairy and red meats adds quick savings.' },
    { limit: 99.0, badge: 'High Impact', class: 'badge-red', tip: 'Heavy red meat consumption. Shift diets and commit to Meatless Mondays.' }
  ], diagFoodVal, diagFoodBadge, diagFoodTip);

  updateDiagnosticCard('card-waste', state.results.waste, 'Waste', [
    { limit: 0.3, badge: 'Eco', class: 'badge-green', tip: 'Active recycling and minimal purchases keep landfills clean. Excellent circular habits.' },
    { limit: 0.6, badge: 'Moderate', class: 'badge-yellow', tip: 'Average household waste. Try to eliminate plastics and reuse/buy secondhand.' },
    { limit: 99.0, badge: 'High Impact', class: 'badge-red', tip: 'Low recycling or high shopper habits. Minimize plastic items and utilize local composts.' }
  ], diagWasteVal, diagWasteBadge, diagWasteTip);

  // Update potential savings header card in pledges section
  pledgesReductionHeader.textContent = `-${pledgeSavings.toFixed(2)} t CO₂e`;

  // Draw Monthly Trend Line Chart
  renderTrendLineChart();

  saveState();
}

/**
 * Calculates the ecological grade based on net carbon footprint.
 * Delegates to carbonMath for modular testing.
 * @param {number} netFootprint - The net carbon footprint.
 * @returns {Object} The ecological grade and label.
 */
function calculateEcologicalGrade(netFootprint) {
  return carbonMath.calculateEcologicalGrade(netFootprint);
}

function updateXPBadgeLevels(xp) {
  // Levels thresholds:
  // Lvl 1: Seedling (0-150 XP)
  // Lvl 2: Green Advocate (151 - 350 XP)
  // Lvl 3: Earth Guardian (351 - 650 XP)
  // Lvl 4: Climate Champion (651+ XP)
  let level = 1;
  let rank = 'Seedling';
  let nextThreshold = 150;
  let prevThreshold = 0;

  if (xp <= 150) {
    level = 1;
    rank = 'Seedling';
    prevThreshold = 0;
    nextThreshold = 150;
  } else if (xp <= 350) {
    level = 2;
    rank = 'Green Advocate';
    prevThreshold = 150;
    nextThreshold = 350;
  } else if (xp <= 650) {
    level = 3;
    rank = 'Earth Guardian';
    prevThreshold = 350;
    nextThreshold = 650;
  } else {
    level = 4;
    rank = 'Climate Champion';
    prevThreshold = 650;
    nextThreshold = 1000; // soft cap
  }

  state.level = level;
  state.rankTitle = rank;

  userEcoRank.textContent = `${rank} (Level ${level})`;
  
  // Calculate percentage
  let progressPct = 0;
  if (xp >= 1000) {
    progressPct = 100;
    userXpDisplay.textContent = `${xp} XP (Max Rank)`;
  } else {
    progressPct = ((xp - prevThreshold) / (nextThreshold - prevThreshold)) * 100;
    userXpDisplay.textContent = `${xp} / ${nextThreshold} XP`;
  }
  userXpBar.style.width = `${progressPct}%`;
}

function updateDiagnosticCard(cardId, score, title, levels, scoreEl, badgeEl, tipEl) {
  scoreEl.textContent = score.toFixed(2);
  
  let match = levels[2]; // default high
  for (let lvl of levels) {
    if (score <= lvl.limit) {
      match = lvl;
      break;
    }
  }
  
  badgeEl.textContent = match.badge;
  badgeEl.className = `diagnose-badge ${match.class}`;
  tipEl.textContent = match.tip;
}

// --- Render SVG Donut Chart ---
/**
 * Renders the donut breakdown chart using safe SVG DOM manipulation.
 * @param {number} transport - Transport emissions.
 * @param {number} energy - Energy emissions.
 * @param {number} food - Food emissions.
 * @param {number} waste - Waste emissions.
 */
function renderDonutChart(transport, energy, food, waste) {
  const total = transport + energy + food + waste;
  donutCenterTotal.textContent = total.toFixed(1);
  
  // Clear previous segments safely
  while (donutSegmentsGroup.firstChild) {
    donutSegmentsGroup.removeChild(donutSegmentsGroup.firstChild);
  }

  if (total === 0) {
    return;
  }

  const data = [
    { name: 'Transport', val: transport, color: 'var(--color-transport)', category: 'transport' },
    { name: 'Energy', val: energy, color: 'var(--color-energy)', category: 'energy' },
    { name: 'Food', val: food, color: 'var(--color-food)', category: 'food' },
    { name: 'Waste', val: waste, color: 'var(--color-waste)', category: 'waste' }
  ];

  const radius = 40;
  const circumference = 2 * Math.PI * radius; // ~251.327
  let accumulatedPercent = 0;

  data.forEach(item => {
    const percent = item.val / total;
    if (percent === 0) return;

    const strokeDasharray = `${(percent * circumference).toFixed(2)} ${circumference.toFixed(2)}`;
    // Rotate offset is negative so it moves clockwise from 12 o'clock (standard starting position after rotation)
    const strokeDashoffset = -accumulatedPercent * circumference;
    
    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    circle.setAttribute('cx', '50');
    circle.setAttribute('cy', '50');
    circle.setAttribute('r', radius.toString());
    circle.setAttribute('class', 'donut-segment');
    circle.setAttribute('stroke', item.color);
    circle.setAttribute('stroke-dasharray', strokeDasharray);
    circle.setAttribute('stroke-dashoffset', strokeDashoffset.toFixed(2));
    circle.setAttribute('data-category', item.category);

    donutSegmentsGroup.appendChild(circle);
    
    accumulatedPercent += percent;

    // Update legend UI texts
    const legendValEl = document.getElementById(`legend-${item.category}-val`);
    if (legendValEl) {
      legendValEl.textContent = `${item.val.toFixed(1)}t (${Math.round(percent * 100)}%)`;
    }
  });

  // Add Chart Interactions
  const segments = donutSegmentsGroup.querySelectorAll('.donut-segment');
  const legendItems = document.querySelectorAll('.legend-item');

  segments.forEach(seg => {
    seg.addEventListener('mouseenter', () => highlightCategory(seg.dataset.category));
    seg.addEventListener('mouseleave', () => resetHighlights());
  });

  legendItems.forEach(item => {
    item.addEventListener('mouseenter', () => highlightCategory(item.dataset.category));
    item.addEventListener('mouseleave', () => resetHighlights());
  });
}

function highlightCategory(category) {
  // Dim other elements
  const segments = donutSegmentsGroup.querySelectorAll('.donut-segment');
  const legendItems = document.querySelectorAll('.legend-item');
  const cards = document.querySelectorAll('.segment-diagnostic-card');

  segments.forEach(seg => {
    if (seg.dataset.category !== category) {
      seg.style.opacity = '0.3';
    } else {
      seg.style.transform = 'scale(1.02)';
      seg.style.transformOrigin = '50% 50%';
    }
  });

  legendItems.forEach(item => {
    if (item.dataset.category !== category) {
      item.style.opacity = '0.4';
    } else {
      item.style.background = 'var(--bg-input)';
    }
  });

  cards.forEach(card => {
    if (card.id !== `card-${category}`) {
      card.style.opacity = '0.3';
    } else {
      card.style.borderColor = 'var(--accent-emerald)';
      card.style.transform = 'scale(1.02)';
    }
  });
}

function resetHighlights() {
  const segments = donutSegmentsGroup.querySelectorAll('.donut-segment');
  const legendItems = document.querySelectorAll('.legend-item');
  const cards = document.querySelectorAll('.segment-diagnostic-card');

  segments.forEach(seg => {
    seg.style.opacity = '1';
    seg.style.transform = 'none';
  });

  legendItems.forEach(item => {
    item.style.opacity = '1';
    item.style.background = 'transparent';
  });

  cards.forEach(card => {
    card.style.opacity = '1';
    card.style.borderColor = 'var(--border-color)';
    card.style.transform = 'none';
  });
}

// --- Pledges Commitment System ---
/**
 * Toggles a sustainability pledge commitment on and off.
 * @param {string} pledgeId - The unique identifier of the pledge.
 * @param {HTMLElement} card - The DOM card element for the pledge.
 * @param {HTMLElement} btn - The pledge trigger button.
 */
function togglePledge(pledgeId, card, btn) {
  const idx = state.committedPledges.indexOf(pledgeId);
  
  if (idx === -1) {
    // Commit to pledge
    state.committedPledges.push(pledgeId);
    card.classList.add('committed');
    btn.textContent = 'Committed';
    if (PLEDGES[pledgeId]) {
      btn.setAttribute('aria-label', `Committed to ${PLEDGES[pledgeId].title}`);
    }
  } else {
    // Withdraw pledge
    state.committedPledges.splice(idx, 1);
    card.classList.remove('committed');
    btn.textContent = 'Commit';
    if (PLEDGES[pledgeId]) {
      btn.setAttribute('aria-label', `Commit to ${PLEDGES[pledgeId].title}`);
    }
  }

  saveState();
  
  // Re-run calculations to update dashboard totals live
  if (state.calculatorCompleted) {
    calculateFootprint();
  }
}

// --- Share Report Card Generation ---
/**
 * Compiles and renders the ecological report card with dynamic badges.
 */
function compileReportCard() {
  const gradeData = carbonMath.calculateEcologicalGrade(state.results.totalNet);
  
  reportUserName.textContent = state.userName;
  reportCo2Val.textContent = state.results.totalNet.toFixed(1);
  reportGradeVal.textContent = gradeData.grade;
  reportPledgesCount.textContent = `${state.committedPledges.length} Pledges`;

  // Compile badges dynamically
  let badges = [];
  
  // Badges based on footprint
  if (state.results.totalNet <= 2.0) {
    badges.push('🛡️ Earth Guardian');
  } else if (state.results.totalNet <= 4.0) {
    badges.push('🌳 Canopy Custodian');
  }
  
  // Badges based on inputs/actions
  if (state.inputs.dietType === 'vegan') {
    badges.push('🌱 Plant-Based Pioneer');
  } else if (state.inputs.dietType === 'vegetarian') {
    badges.push('🍳 Vegetarian Steward');
  }
  
  if (state.inputs.vehicleType === 'none' || state.inputs.vehicleDistance === 0) {
    badges.push('🚲 Zero-Emission Commuter');
  } else if (state.inputs.vehicleType === 'electric') {
    badges.push('⚡ Electric Voyager');
  }

  if (state.inputs.renewablePct >= 80) {
    badges.push('☀️ Solar Sovereign');
  }
  
  if (state.committedPledges.length >= 5) {
    badges.push('🏆 Carbon Gladiator');
  }

  // Default badge if none
  if (badges.length === 0) {
    badges.push('👣 Eco Seeker');
  }

  // Clear previous badges safely
  while (reportBadgesList.firstChild) {
    reportBadgesList.removeChild(reportBadgesList.firstChild);
  }
  
  badges.forEach(b => {
    const span = document.createElement('span');
    span.className = 'eco-badge';
    span.textContent = b;
    reportBadgesList.appendChild(span);
  });

  // Reveal preview container
  reportCardPreviewArea.classList.remove('hidden');
  
  // Assemble template text in social box
  updateShareTextBox();
  
  // Auto-scroll to report card
  setTimeout(() => {
    reportCardPreviewArea.scrollIntoView({ behavior: 'smooth' });
  }, 100);
}

function updateShareTextBox() {
  const gradeData = calculateEcologicalGrade(state.results.totalNet);
  
  let activePledgeList = '';
  state.committedPledges.forEach(pledgeId => {
    if (PLEDGES[pledgeId]) {
      activePledgeList += `\n- ${PLEDGES[pledgeId].title} (-${PLEDGES[pledgeId].co2.toFixed(2)}t CO₂e)`;
    }
  });

  if (!activePledgeList) {
    activePledgeList = '\n- Exploring carbon reduction strategies.';
  }

  const shareText = `🌱 My Ecological Report Card | EcoSphere

Footprint Score: ${state.results.totalNet.toFixed(2)} Tons CO₂e / Year
Ecological Grade: ${gradeData.grade} (${gradeData.label})
EcoSphere Rank: ${state.rankTitle} (Level ${state.level})
Pledges Committed: ${state.committedPledges.length} Active

Pledged Actions Committed:${activePledgeList}

Try the interactive tracker yourself & join the transition!
👉 Built & verified for PromptWars Virtual.

#EcoSphere #Sustainability #CarbonFootprint #PromptWars #Hack2Skill`;

  shareTextContent.value = shareText;

  // Update LinkedIn Share URL
  // Encode details
  const linkedinUrl = `https://www.linkedin.com/feed/?shareActive=true&text=${encodeURIComponent(shareText)}`;
  linkedinShareBtn.href = linkedinUrl;
}

// --- SVG Historical Line Chart Ploter ---
/**
 * Renders the monthly trajectory line chart using safe SVG DOM manipulation.
 */
function renderTrendLineChart() {
  const originalMonthly = state.results.totalOriginal / 12;
  const netMonthly = state.results.totalNet / 12;

  // Simulate a historical downward trajectory leading to the current month's net score
  const pointsData = [
    { label: 'Jan', val: originalMonthly * 1.15 },
    { label: 'Feb', val: originalMonthly * 1.10 },
    { label: 'Mar', val: originalMonthly * 1.08 },
    { label: 'Apr', val: originalMonthly * 1.05 },
    { label: 'May', val: originalMonthly * 1.02 },
    { label: 'Jun', val: netMonthly }
  ];

  const xCoords = [35, 71, 107, 143, 179, 215];
  const maxYVal = Math.max(1.5, originalMonthly * 1.35); // scale charts dynamically

  const coords = pointsData.map((pt, idx) => {
    const x = xCoords[idx];
    const y = 100 - (pt.val / maxYVal) * 80; // keep coordinate bounds [20, 100]
    return { x, y, val: pt.val };
  });

  // Plot line stroke path
  let linePathD = `M ${coords[0].x} ${coords[0].y}`;
  for (let i = 1; i < coords.length; i++) {
    linePathD += ` L ${coords[i].x} ${coords[i].y}`;
  }
  trendLinePath.setAttribute('d', linePathD);

  // Plot shaded gradient area path
  const areaPathD = `${linePathD} L ${coords[coords.length - 1].x} 100 L ${coords[0].x} 100 Z`;
  trendAreaPath.setAttribute('d', areaPathD);

  // Plot circular node points on grid safely
  while (trendPointsGroup.firstChild) {
    trendPointsGroup.removeChild(trendPointsGroup.firstChild);
  }
  
  coords.forEach((coord, idx) => {
    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    circle.setAttribute('class', 'chart-point');
    circle.setAttribute('cx', coord.x.toString());
    circle.setAttribute('cy', coord.y.toString());
    circle.setAttribute('r', '4.5');
    circle.setAttribute('data-month', pointsData[idx].label);
    circle.setAttribute('data-val', (coord.val * 12).toFixed(1));

    const title = document.createElementNS('http://www.w3.org/2000/svg', 'title');
    title.textContent = `${pointsData[idx].label}: ${(coord.val * 12).toFixed(1)}t CO₂e (Annualized)`;
    circle.appendChild(title);

    trendPointsGroup.appendChild(circle);
  });
}

// --- AI Sustainability Consultation Engine ---
/**
 * Triggers the AI Sustainable action diagnostic scan.
 */
function runAiSustainabilityConsultation() {
  btnRunAiConsult.disabled = true;
  aiAdvisorStatus.textContent = 'Status: Processing...';
  
  // Set terminal window diagnostics logs safely
  while (aiConsoleOutput.firstChild) {
    aiConsoleOutput.removeChild(aiConsoleOutput.firstChild);
  }
  const initP = document.createElement('p');
  initP.className = 'console-muted';
  initP.textContent = '// Initializing EcoSphere AI Consultation Core...';
  aiConsoleOutput.appendChild(initP);

  const promptDiv = document.createElement('div');
  promptDiv.className = 'console-prompt-line';
  
  const charSpan = document.createElement('span');
  charSpan.className = 'console-prompt-char';
  charSpan.textContent = '>';
  
  const cmdSpan = document.createElement('span');
  cmdSpan.textContent = 'run diagnostic_consultation --profile=current';
  
  promptDiv.appendChild(charSpan);
  promptDiv.appendChild(cmdSpan);
  aiConsoleOutput.appendChild(promptDiv);

  // Compiling dynamic heuristics
  const recs = [];

  // Transit logic
  const transportAnn = state.results.transport;
  const transportMonthlyKg = (transportAnn * 1000) / 12;
  
  if (state.inputs.vehicleType !== 'none' && state.inputs.vehicleDistance > 0) {
    const modeName = state.inputs.vehicleType === 'petrol' ? 'Petrol Car' : (state.inputs.vehicleType === 'diesel' ? 'Diesel Car' : 'Hybrid');
    const vehicleFactor = FACTORS.vehicle[state.inputs.vehicleType] || 0;
    const walkSavingKg = (state.inputs.vehicleDistance * 0.4 * vehicleFactor * 52) / 12; // save 40%
    recs.push({
      title: 'Optimize commute modes',
      detail: `Your ${modeName} commuting emits ${transportMonthlyKg.toFixed(0)}kg CO₂ monthly. Swapping transit/active modes 2 days/week saves approx ${walkSavingKg.toFixed(0)}kg CO₂.`
    });
  }

  // Energy logic
  const monthlyKwh = state.inputs.electricBill / FACTORS.kwhPrice;
  const energyMonthlyKg = (state.results.energy * 1000) / 12;
  
  if (state.inputs.electricBill > 50) {
    const acSavingKg = energyMonthlyKg * 0.12; 
    recs.push({
      title: 'Optimize heating and climate control',
      detail: `Your monthly utility footprint is ${energyMonthlyKg.toFixed(0)}kg CO₂ (~${monthlyKwh.toFixed(0)} kWh). Reducing heater or AC runtimes by 2 hours daily saves approx ${acSavingKg.toFixed(0)}kg CO₂.`
    });
  }

  if (state.inputs.renewablePct < 100) {
    const region = state.inputs.utilityRegion || 'us';
    const intensity = FACTORS.gridIntensity[region] !== undefined ? FACTORS.gridIntensity[region] : 0.40;
    const greenSavingKg = (monthlyKwh * intensity * 12 * (1 - state.inputs.renewablePct / 100)) / 12;
    recs.push({
      title: 'Switch to renewable grid plan',
      detail: `Transitioning your remaining grid balance to a 100% clean green tariff offsets your monthly electricity carbon output by ${greenSavingKg.toFixed(0)}kg CO₂.`
    });
  }

  // Diet logic
  const dietAnn = state.results.food;
  const dietMonthlyKg = (dietAnn * 1000) / 12;
  
  if (state.inputs.dietType === 'heavy-meat' || state.inputs.dietType === 'average-meat') {
    const dietSavingKg = dietMonthlyKg * 0.25; 
    recs.push({
      title: 'Integrate plant-based meals',
      detail: `Your diet style produces ${dietMonthlyKg.toFixed(0)}kg CO₂ monthly. Swapping red meat for plant-forward choices on Mondays and Wednesdays saves approx ${dietSavingKg.toFixed(0)}kg CO₂.`
    });
  }

  // Fallback
  if (recs.length === 0) {
    recs.push({
      title: 'Maintain zero-emissions habits',
      detail: 'Your current footprint is outstanding! Prioritize composting remaining waste and advocate for community-level green tariffs.'
    });
  }

  // Console typing stream
  const consoleLines = [
    { type: 'log', text: 'Initializing environmental diagnostic scan...' },
    { type: 'log', text: `Analyzing category weights: T: ${state.results.transport.toFixed(1)}t, E: ${state.results.energy.toFixed(1)}t, F: ${state.results.food.toFixed(1)}t, W: ${state.results.waste.toFixed(1)}t` },
    { type: 'log', text: 'Compiling emissions factors against global averages...' },
    { type: 'log', text: 'AI reasoning completed. Formatting action guidelines...' },
    { type: 'recommendations', data: recs }
  ];

  animateConsoleTyping(consoleLines, () => {
    btnRunAiConsult.disabled = false;
    btnRunAiConsult.textContent = 'Re-Run AI Consultation';
    aiAdvisorStatus.textContent = 'Status: Live Insights Ready';
  });
}

/**
 * Animates terminal console typing safely.
 * @param {Array} lines - The lines to type.
 * @param {Function} callback - Callback on completion.
 */
function animateConsoleTyping(lines, callback) {
  let lineIdx = 0;
  
  function printNextLine() {
    if (lineIdx >= lines.length) {
      if (callback) callback();
      return;
    }
    
    const line = lines[lineIdx];
    lineIdx++;

    if (line.type === 'log') {
      const p = document.createElement('p');
      p.className = 'console-muted';
      p.textContent = `[info] ${line.text}`;
      aiConsoleOutput.appendChild(p);
      aiConsoleOutput.scrollTop = aiConsoleOutput.scrollHeight;
      
      // Delay before next line
      setTimeout(printNextLine, 800);
    } else if (line.type === 'recommendations') {
      const div = document.createElement('div');
      div.className = 'console-recs-block';
      
      const tagP = document.createElement('p');
      tagP.className = 'console-ai-tag';
      tagP.textContent = '// AI Sustainable Action Plan (Targeted suggestions):';
      div.appendChild(tagP);

      line.data.forEach((rec, idx) => {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'ai-recommendation-item';

        const titleSpan = document.createElement('span');
        titleSpan.className = 'ai-rec-title';
        titleSpan.textContent = `💡 suggestion #${idx+1}: ${rec.title}`;

        const detailSpan = document.createElement('span');
        detailSpan.className = 'ai-rec-detail';
        detailSpan.textContent = rec.detail;

        itemDiv.appendChild(titleSpan);
        itemDiv.appendChild(detailSpan);
        div.appendChild(itemDiv);
      });
      
      aiConsoleOutput.appendChild(div);
      aiConsoleOutput.scrollTop = aiConsoleOutput.scrollHeight;
      
      setTimeout(printNextLine, 1000);
    }
  }

  setTimeout(printNextLine, 1200);
}

// --- Results Highlight Summary Modal ---
let previousActiveElement = null;

/**
 * Closes the results summary modal and returns focus to the trigger.
 */
function closeModal() {
  resultsModal.classList.add('hidden');
  if (previousActiveElement && typeof previousActiveElement.focus === 'function') {
    previousActiveElement.focus();
  } else {
    submitCalcBtn.focus();
  }
}

/**
 * Displays the modal with summary metrics and AI quick recommendations.
 */
function showResultsModal() {
  const monthlyKg = (state.results.totalOriginal * 1000) / 12;
  modalCo2Val.textContent = monthlyKg.toFixed(0);
  
  // Determine Status Text and Class
  const netFootprint = state.results.totalNet;
  const gradeData = carbonMath.calculateEcologicalGrade(netFootprint);
  let statusText = 'Moderate';
  let badgeClass = 'badge-yellow';
  
  if (gradeData.grade.startsWith('A')) {
    statusText = 'Eco-Friendly';
    badgeClass = 'badge-green';
  } else if (gradeData.grade === 'B') {
    statusText = 'Moderate';
    badgeClass = 'badge-yellow';
  } else {
    statusText = 'High Emitter';
    badgeClass = 'badge-red';
  }
  
  modalStatusVal.textContent = statusText;
  modalStatusVal.className = `status-badge ${badgeClass}`;

  // Find the highest emissions category to yield a smart quick suggestion
  const categories = [
    { name: 'transport', val: state.results.transport, tip: 'Use public transport twice a week to reduce 20kg CO₂' },
    { name: 'energy', val: state.results.energy, tip: 'Reduce AC/heating runtimes by 2 hours daily to save approx 15kg CO₂' },
    { name: 'food', val: state.results.food, tip: 'Substitute meat for plant-forward options on Mondays to save 25kg CO₂' },
    { name: 'waste', val: state.results.waste, tip: 'Buy secondhand items first and recycle plastics to save 10kg CO₂' }
  ];
  
  categories.sort((a, b) => b.val - a.val);
  const highestCategory = categories[0];
  modalAiTip.textContent = highestCategory.tip;

  // Save the current active element so we can return focus to it later
  previousActiveElement = document.activeElement;

  // Reveal modal
  resultsModal.classList.remove('hidden');
  
  // Shift focus to results modal close button
  btnCloseResultsModal.focus();
}

// Trap focus inside results modal when open
resultsModal.addEventListener('keydown', (e) => {
  if (e.key === 'Tab') {
    const focusableSelectors = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
    const focusableElements = resultsModal.querySelectorAll(focusableSelectors);
    
    if (focusableElements.length === 0) return;
    
    const firstFocusable = focusableElements[0];
    const lastFocusable = focusableElements[focusableElements.length - 1];
    
    if (e.shiftKey) {
      if (document.activeElement === firstFocusable) {
        lastFocusable.focus();
        e.preventDefault();
      }
    } else {
      if (document.activeElement === lastFocusable) {
        firstFocusable.focus();
        e.preventDefault();
      }
    }
  }
});

// Close modal on escape key globally when modal is open
window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && !resultsModal.classList.contains('hidden')) {
    closeModal();
  }
});

// --- Pure Mathematical Calculations Engine (carbonMath) ---
/**
 * Standalone calculation engine for carbon emissions tracking.
 * @namespace
 */
const carbonMath = {
  /**
   * Calculates the annualized transportation carbon emissions.
   * @param {Object} inputs - User transport inputs.
   * @returns {number} Transport carbon footprint in metric tons CO2e/year.
   */
  calculateTransport: function(inputs) {
    const vehicleFactor = FACTORS.vehicle[inputs.vehicleType] || 0;
    const carAnnualCo2Kg = inputs.vehicleDistance * vehicleFactor * 52;
    const transitAnnualCo2Kg = inputs.publicTransit * FACTORS.publicTransit * 52;
    const flightShortAnnualCo2Kg = inputs.flightsShort * FACTORS.flightShort;
    const flightLongAnnualCo2Kg = inputs.flightsLong * FACTORS.flightLong;
    return (carAnnualCo2Kg + transitAnnualCo2Kg + flightShortAnnualCo2Kg + flightLongAnnualCo2Kg) / 1000;
  },

  /**
   * Calculates the annualized home energy carbon emissions.
   * @param {Object} inputs - User energy inputs.
   * @returns {number} Energy carbon footprint in metric tons CO2e/year.
   */
  calculateEnergy: function(inputs) {
    const monthlyKwh = inputs.electricBill / FACTORS.kwhPrice;
    const region = inputs.utilityRegion || 'us';
    const intensity = FACTORS.gridIntensity[region] !== undefined ? FACTORS.gridIntensity[region] : 0.40;
    const electricAnnualCo2Kg = monthlyKwh * intensity * 12;
    const electricNetAnnualCo2Kg = electricAnnualCo2Kg * (1 - inputs.renewablePct / 100);
    const heatingAnnualCo2Kg = FACTORS.heating[inputs.heatingSource] || 0;
    return (electricNetAnnualCo2Kg + heatingAnnualCo2Kg) / 1000;
  },

  /**
   * Calculates the diet carbon footprint.
   * @param {Object} inputs - User diet inputs.
   * @returns {number} Food carbon footprint in metric tons CO2e/year.
   */
  calculateFood: function(inputs) {
    const dietBaseTons = FACTORS.diet[inputs.dietType] || 1.7;
    const foodWasteAdj = FACTORS.foodWaste[inputs.foodWaste] || 0.0;
    return dietBaseTons + foodWasteAdj;
  },

  /**
   * Calculates the waste carbon footprint.
   * @param {Object} inputs - User waste inputs.
   * @returns {number} Waste carbon footprint in metric tons CO2e/year.
   */
  calculateWaste: function(inputs) {
    let recycleCount = 0;
    if (inputs.recyclePaper) recycleCount++;
    if (inputs.recyclePlastic) recycleCount++;
    if (inputs.recycleGlass) recycleCount++;
    if (inputs.recycleMetal) recycleCount++;
    if (inputs.recycleCompost) recycleCount++;
    
    const recycleOffsetTons = recycleCount * FACTORS.recycleOffset;
    const shoppingAdjTons = FACTORS.shopping[inputs.shoppingFrequency] || 0;
    return Math.max(0.1, FACTORS.wasteBase + shoppingAdjTons + recycleOffsetTons);
  },

  /**
   * Calculates the total base carbon footprint before pledges.
   * @param {Object} inputs - All user inputs.
   * @returns {number} Total footprint in metric tons CO2e/year.
   */
  calculateTotalOriginal: function(inputs) {
    return this.calculateTransport(inputs) +
           this.calculateEnergy(inputs) +
           this.calculateFood(inputs) +
           this.calculateWaste(inputs);
  },

  /**
   * Calculates the net carbon footprint after active pledges.
   * @param {number} totalOriginal - The base carbon footprint.
   * @param {Array} committedPledges - Array of active pledge IDs.
   * @returns {number} Net carbon footprint in metric tons CO2e/year.
   */
  calculateTotalNet: function(totalOriginal, committedPledges) {
    let pledgeSavings = 0;
    committedPledges.forEach(pledgeId => {
      if (PLEDGES[pledgeId]) {
        pledgeSavings += PLEDGES[pledgeId].co2;
      }
    });
    return Math.max(0.1, totalOriginal - pledgeSavings);
  },

  /**
   * Computes the ecological grade and title label.
   * @param {number} netFootprint - Net carbon footprint.
   * @returns {Object} Containing grade string and user-facing status label.
   */
  calculateEcologicalGrade: function(netFootprint) {
    if (netFootprint <= 2.0) return { grade: 'A+', label: 'Climate Champion' };
    if (netFootprint <= 3.5) return { grade: 'A', label: 'Eco Protector' };
    if (netFootprint <= 5.5) return { grade: 'B', label: 'Conscious Consumer' };
    if (netFootprint <= 9.0) return { grade: 'C', label: 'Moderate Emitter' };
    return { grade: 'D', label: 'Carbon Heavyweight' };
  }
};

// --- Module Exports for Node.js Testing Environment ---
if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
  module.exports = {
    carbonMath,
    FACTORS,
    PLEDGES
  };
}
