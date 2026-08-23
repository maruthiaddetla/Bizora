export const ONBOARDING_INTENTS = [
  { id: "buy_business", label: "Buy a Business" },
  { id: "sell_business", label: "Sell a Business" },
  { id: "find_commercial_space", label: "Find Commercial Space" },
  { id: "list_commercial_space", label: "List Commercial Space" },
] as const;

export type OnboardingIntentId = (typeof ONBOARDING_INTENTS)[number]["id"];

export function isOnboardingIntent(value: string): value is OnboardingIntentId {
  return ONBOARDING_INTENTS.some((item) => item.id === value);
}
