type BusinessMapProps = {
  lat: number;
  lng: number;
  address: string;
  title: string;
};

export function BusinessMap({ lat, lng, address, title }: BusinessMapProps) {
  const delta = 0.02;
  const bbox = `${lng - delta},${lat - delta},${lng + delta},${lat + delta}`;
  const embedUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat}%2C${lng}`;
  const mapsLink = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;

  return (
    <div className="overflow-hidden rounded-2xl border border-border">
      <iframe
        title={`Map showing location of ${title}`}
        src={embedUrl}
        className="h-64 w-full border-0 sm:h-80"
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
      />
      <div className="flex items-center justify-between gap-4 border-t border-border bg-surface px-4 py-3">
        <p className="text-sm text-muted">{address}</p>
        <a
          href={mapsLink}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 text-sm font-semibold text-primary transition-colors hover:text-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-sm"
        >
          Open in Maps
        </a>
      </div>
    </div>
  );
}
