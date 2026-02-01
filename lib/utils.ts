// ─── BMI CALCULATION ────────────────────────────────────────────
export function calcBMI(
  weight: string,
  weightUnit: string,
  height: string,
  heightUnit: string
): string | null {
  let w = parseFloat(weight);
  let h = parseFloat(height);
  if (!w || !h || w <= 0 || h <= 0) return null;

  // Convert to kg and cm
  if (weightUnit === "lbs") w = w * 0.453592;
  if (heightUnit === "in") h = h * 2.54;

  const hm = h / 100; // cm → meters
  return (w / (hm * hm)).toFixed(1);
}

// ─── BMI CATEGORY ───────────────────────────────────────────────
export function bmiCategory(bmi: string | null): { label: string; color: string } {
  if (!bmi) return { label: "—", color: "#64748b" };
  const v = parseFloat(bmi);
  if (v < 18.5) return { label: "Underweight", color: "#f59e0b" };
  if (v < 25) return { label: "Normal", color: "#22c55e" };
  if (v < 30) return { label: "Overweight", color: "#f97316" };
  return { label: "Obese", color: "#ef4444" };
}

// ─── WAIST CONVERSION ───────────────────────────────────────────
// Converts any waist value to cm for consistent comparison
export function waistToCm(value: string, unit: string): number {
  const v = parseFloat(value);
  if (!v || v <= 0) return 0;
  return unit === "in" ? v * 2.54 : v;
}

// Converts cm back to a target unit for display
export function waistFromCm(cm: number, unit: string): number {
  return unit === "in" ? cm / 2.54 : cm;
}
