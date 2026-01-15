import { ReactNode } from "react";
import { Estimate } from "../components/EstimatePicker/Estimate";

export const issueEstimationByType = {
  notUsed: [],
  exponential: [1, 2, 4, 8, 16, 32, 64],
  fibonacci: [1, 2, 3, 5, 8, 13, 21],
  linear: [1, 2, 3, 4, 5, 6, 7],
  tShirt: ["XS", "S", "M", "L", "XL", "XXL", "XXXL"],
} as const;

export type EstimateDataItem = {
  label: ReactNode;
  value: number | null;
  inlineValue:
    | (typeof issueEstimationByType)[keyof typeof issueEstimationByType][number]
    | null;
};

export function createEstimateDataItems(
  issueEstimationType: keyof typeof issueEstimationByType
): EstimateDataItem[] {
  return [
    { label: <Estimate estimate={null} />, value: null, inlineValue: null },
    ...issueEstimationByType[issueEstimationType].map((label, index) => {
      const value =
        typeof issueEstimationByType[issueEstimationType][index] === "string"
          ? index + 1
          : issueEstimationByType[issueEstimationType][index];

      const inlineValue = issueEstimationByType[issueEstimationType][index];

      return {
        label: <Estimate estimate={{ label, value, inlineValue }} />,
        value: value,
        inlineValue,
      };
    }),
  ];
}
