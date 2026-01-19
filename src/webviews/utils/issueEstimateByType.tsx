export const issueEstimationByType = {
  notUsed: [],
  exponential: [1, 2, 4, 8, 16, 32, 64],
  fibonacci: [1, 2, 3, 5, 8, 13, 21],
  linear: [1, 2, 3, 4, 5, 6, 7],
  tShirt: ["XS", "S", "M", "L", "XL", "XXL", "XXXL"],
} as const;

export type EstimateDataItem = {
  label: number | "No estimate";
  value: number | "no-estimate";
  inlineValue:
    | (typeof issueEstimationByType)[keyof typeof issueEstimationByType][number]
    | null;
};

export function createEstimateDataItems(
  issueEstimationType: keyof typeof issueEstimationByType
): EstimateDataItem[] {
  return issueEstimationByType[issueEstimationType].map((label, index) => {
    const value = typeof label === "string" ? index + 1 : label;

    return {
      label: value,
      value: value,
      inlineValue: label,
    };
  });
}
