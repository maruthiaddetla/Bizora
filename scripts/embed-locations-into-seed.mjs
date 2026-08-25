import { readFileSync, writeFileSync } from "node:fs";

const mig = readFileSync("supabase/migrations/013_india_wide_locations.sql", "utf8");
const seed = readFileSync("supabase/seed.sql", "utf8");
const nl = seed.includes("\r\n") ? "\r\n" : "\n";

const startRe = /-- -{10,}\r?\n-- Locations[^\r\n]*\r?\n-- -{10,}\r?\n/;
const endRe = /-- -{10,}\r?\n-- Categories \(parent \+ child\)/;

const startMatch = startRe.exec(seed);
const endMatch = endRe.exec(seed);
if (!startMatch || !endMatch || endMatch.index < startMatch.index) {
  throw new Error("seed.sql location section markers not found");
}

const localities = `-- Localities under Hyderabad / Secunderabad (existing IDs — demo listings)
insert into public.localities (id, city_id, name) values
  ('f1000000-0000-4000-8000-000000000001', 'c3000000-0000-4000-8000-000000000001', 'Gachibowli'),
  ('f1000000-0000-4000-8000-000000000002', 'c3000000-0000-4000-8000-000000000001', 'Madhapur'),
  ('f1000000-0000-4000-8000-000000000003', 'c3000000-0000-4000-8000-000000000001', 'Uppal'),
  ('f1000000-0000-4000-8000-000000000004', 'c3000000-0000-4000-8000-000000000001', 'IDA Uppal')
on conflict (id) do update set city_id = excluded.city_id, name = excluded.name;

insert into public.localities (id, city_id, name) values
  ('f1000000-0000-4000-8000-000000000005', 'c3000000-0000-4000-8000-000000000002', 'Begumpet')
on conflict (id) do update set city_id = excluded.city_id, name = excluded.name;

`.replace(/\n/g, nl);

const migBody = mig.trim().replace(/\n/g, nl);

const block = `-- ---------------------------------------------------------------------------${nl}-- Locations (India-wide — same content as migration 013_india_wide_locations.sql)${nl}-- ---------------------------------------------------------------------------${nl}${migBody}${nl}${nl}${localities}`;

const next =
  seed.slice(0, startMatch.index) + block + seed.slice(endMatch.index);
writeFileSync("supabase/seed.sql", next);
console.log("seed.sql updated");
