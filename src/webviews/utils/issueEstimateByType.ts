export type EstimateDataItem = {
  label:
    | (typeof issueEstimationByType)[keyof typeof issueEstimationByType][number]
    | "No estimate";
  value: number | null;
};

export const issueEstimationByType = {
  notUsed: [],
  exponential: [1, 2, 4, 8, 16, 32, 64],
  fibonacci: [1, 2, 3, 5, 8, 13, 21],
  linear: [1, 2, 3, 4, 5, 6, 7],
  tShirt: ["XS", "S", "M", "L", "XL", "XXL", "XXXL"],
} as const;

export function createEstimateDataItems(
  issueEstimationType: keyof typeof issueEstimationByType
): EstimateDataItem[] {
  return [
    { label: "No estimate", value: null },
    ...issueEstimationByType[issueEstimationType].map((label, index) => ({
      label,
      value: issueEstimationByType[issueEstimationType][index] as number,
    })),
  ];
}
