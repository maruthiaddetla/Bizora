import { BadgeCheck, Clock, MapPin } from "lucide-react";
import Image from "next/image";
import type { SellerInfo } from "@/lib/listings";

type SellerCardProps = {
  seller: SellerInfo;
  address: string;
};

export function SellerCard({ seller, address }: SellerCardProps) {
  return (
    <div className="rounded-2xl border border-border bg-white p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-foreground">Seller information</h3>

      <div className="mt-5 flex items-start gap-4">
        <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-full ring-2 ring-border">
          <Image
            src={seller.avatar}
            alt=""
            fill
            className="object-cover"
            sizes="56px"
          />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-semibold text-foreground">{seller.name}</p>
            {seller.verified && (
              <span className="inline-flex items-center gap-1 rounded-full bg-accent-light px-2 py-0.5 text-xs font-medium text-accent">
                <BadgeCheck className="h-3 w-3" aria-hidden />
                Verified
              </span>
            )}
          </div>
          <p className="text-sm text-muted">
            {seller.role}
            {seller.company ? ` · ${seller.company}` : ""}
          </p>
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" aria-hidden />
              Responds {seller.responseTime.toLowerCase()}
            </span>
            <span>{seller.listingsCount} active listings</span>
          </div>
        </div>
      </div>

      <div className="mt-5 flex items-start gap-2 rounded-xl bg-surface p-4 text-sm text-muted">
        <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
        <address className="not-italic">{address}</address>
      </div>
    </div>
  );
}
