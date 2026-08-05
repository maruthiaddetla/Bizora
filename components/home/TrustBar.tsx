import {
  BadgeCheck,
  FolderLock,
  MessageSquare,
  Shield,
  type LucideIcon,
} from "lucide-react";

const trustItems: { icon: LucideIcon; label: string; detail: string }[] = [
  {
    icon: Shield,
    label: "Verified Listings",
    detail: "Financials reviewed before publish",
  },
  {
    icon: BadgeCheck,
    label: "Serious Enquiries",
    detail: "Vetted buyers only",
  },
  {
    icon: FolderLock,
    label: "Secure Deal Rooms",
    detail: "NDAs & document control",
  },
  {
    icon: MessageSquare,
    label: "Direct Messaging",
    detail: "Talk to decision-makers",
  },
];

export function TrustBar() {
  return (
    <section className="border-y border-border bg-white py-8" aria-label="Platform benefits">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-6 lg:grid-cols-4 lg:gap-8">
          {trustItems.map(({ icon: Icon, label, detail }) => (
            <div key={label} className="flex gap-3 sm:gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary-light text-primary">
                <Icon className="h-5 w-5" aria-hidden />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground sm:text-base">
                  {label}
                </p>
                <p className="mt-0.5 text-xs text-muted sm:text-sm">{detail}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
