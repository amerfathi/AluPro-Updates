import type { EstimatorInput } from "@/lib/validations/forms";

export type EstimateResult = {
  materialEstimate: number;
  laborEstimate: number;
  subtotal: number;
  marginAmount: number;
  total: number;
};

export function calculateEstimate(input: EstimatorInput): EstimateResult {
  const materialEstimate = input.areaM2 * input.materialCostPerM2 + input.accessoriesCost;
  const laborEstimate = input.areaM2 * input.laborCostPerM2 + input.overheadCost;
  const subtotal = materialEstimate + laborEstimate;
  const marginAmount = subtotal * (input.marginPercent / 100);
  const total = subtotal + marginAmount;

  return {
    materialEstimate,
    laborEstimate,
    subtotal,
    marginAmount,
    total,
  };
}


