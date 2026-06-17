# 🌱 EcoSphere | Interactive Carbon Footprint Tracker & Reduction Platform

> **Track what you emit. Restore what you can.**
> EcoSphere is a premium, fully responsive, and highly interactive web application designed to help individuals calculate, analyze, and offset their personal carbon footprint. Built with pure HTML, CSS, and Vanilla JavaScript.

---

## 🚀 Key Features

### 1. 🧮 Interactive 4-Step Lifestyle Questionnaire
A multi-step survey questionnaire guiding users through their lifestyle sectors:
* **Transportation**: Private vehicle fuel types (petrol, diesel, hybrid, electric), weekly commutes, and annual short/long-haul flight counts.
* **Home Energy**: Localized grid region mapping, monthly utility bill estimations, renewable energy tariff adjustments, and space heating fuel types.
* **Diet & Food**: Lifestyle diets (Meat Lover, Balanced, Vegetarian, Vegan) and food waste level adjustments.
* **Waste & Consumerism**: Purchasing frequencies and active materials recycling credits (Paper, Plastic, Glass, Metal, Compost).

### 2. 🗺️ Regional Grid Intensity Customization
To ensure scientific accuracy, calculations dynamically map local grid fuel mixes (e.g. coal vs. renewables):
* **India (Coal-Intensive)**: `0.82 kg CO₂/kWh`
* **United States (Standard Grid)**: `0.40 kg CO₂/kWh`
* **European Union (Mixed Grid)**: `0.35 kg CO₂/kWh`
* **Sweden (Clean Hydro/Nuclear)**: `0.02 kg CO₂/kWh`

### 3. 📊 Interactive Double SVG Analytics Grid
* **Emissions Breakdown (Donut Chart)**: A programmatic SVG segment drawing that responds in real-time. Features bi-directional hover highlights between segments and card legends.
* **Monthly Trajectory (Line Chart)**: Plots a 6-month historical curve showing how your footprint decreases dynamically when you commit to active pledges.

### 4. 🧠 AI Sustainability Advisor
A standard EPA & DEFRA-backed rules engine that acts as an "AI Consultant."
* Evaluates your highest emission categories.
* Compiles personalized reduction recommendations (e.g., cutting AC use, commuting actively, upgrading lightbulbs).
* Computes exact monthly CO₂ savings (in kg) and types out results progressively in a mock terminal console.

### 5. 🏆 Gamified Leveling & Pledges Board
* Commit to high-yield pledges (e.g. Vegetarian transition, EV swap, Single-use plastic ban) to earn **Impact XP**.
* Advance through levels 1–4: **Seedling** ➔ **Green Advocate** ➔ **Earth Guardian** ➔ **Climate Champion**.
* Pledges directly subtract potential carbon emissions from your active dashboard stats in real-time.

### 6. 🔗 LinkedIn Validation & Social Certification
* Compiles your certified Eco-Report Card with editable participant name, grade bounds (A+ to D), and badges earned.
* Generates structured text copy templates and automatic LinkedIn share buttons.

---

## 🛠️ Testing & Standards Compliance

### 1. Unit Testing
The platform contains a dedicated Jest-based unit testing suite in `tests/carbon-footprint.test.js` validating the calculations engine:
```bash
# From root workspace directory
npm install
npm test
```
*Tests verify: factors database integrity, boundary input validation constraints, vehicle commutes, clean tariffs, diet offsets, recycling floors, and ecological grade boundaries.*

### 2. WCAG 2.1 Accessibility
* Programmatic section landmark structures (`role="region"` / `<main id="content">`).
* Inputs explicitly bound to `<label>` tags with custom slider updates.
* **Modal Accessibility**: Results modal contains a keyboard focus trap (preventing Tab exit) and fully supports closing with the `Escape` key.
* Dynamic metric updates announced via `aria-live="polite"` elements.

### 3. XSS Security Prevention
Built with **zero** `innerHTML` or `eval` calls. All programmatic HTML additions, SVGs, badges, and AI typewriter console prints are handled via secure DOM node constructors (`createElementNS`, `textContent`, `appendChild`) to eliminate vulnerability flags.
