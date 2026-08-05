import { type ReactNode } from "react";

type DetailSectionProps = {
  id?: string;
  title: string;
  children: ReactNode;
  className?: string;
};

export function DetailSection({
  id,
  title,
  children,
  className = "",
}: DetailSectionProps) {
  return (
    <section
      id={id}
      aria-labelledby={id ? `${id}-heading` : undefined}
      className={`scroll-mt-24 ${className}`}
    >
      <h2
        id={id ? `${id}-heading` : undefined}
        className="text-lg font-semibold tracking-tight text-foreground sm:text-xl"
      >
        {title}
      </h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}
