"use client";

import Image from "next/image";
import Link from "next/link";

function FooterLinks(props: { title: string; links: (string | { label: string; href: string })[] }) {
  return (
    <div>
      <p className="text-sm font-semibold uppercase tracking-wide text-white">{props.title}</p>
      <ul className="mt-3 space-y-2 text-sm text-zinc-400">
        {props.links.map((item) => {
          const label = typeof item === "string" ? item : item.label;
          const content = typeof item === "string" ? (
            item
          ) : (
            <Link href={item.href} className="transition-colors hover:text-white">
              {item.label}
            </Link>
          );
          return <li key={label}>{content}</li>;
        })}
      </ul>
    </div>
  );
}

export function Footer() {
  return (
    <footer className="sticky bottom-0 z-0 -mt-px bg-[#121316] text-zinc-200 [background-image:radial-gradient(circle_at_20%_10%,rgba(255,255,255,0.03),transparent_28%),repeating-linear-gradient(90deg,rgba(255,255,255,0.012)_0px,rgba(255,255,255,0.012)_1px,transparent_1px,transparent_10px)]">
      <div className="mx-auto max-w-7xl px-8 pb-8 pt-16 md:px-12">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          <div className="flex items-start">
            <Image src="/icon.svg" alt="SalesSuite icon" width={72} height={72} />
          </div>
          <FooterLinks
            title="Platform"
            links={["Overview", "Visits", "Leads", "Orders"]}
          />
          <FooterLinks
            title="Company"
            links={[
              "About",
              "Security",
              { label: "Privacy", href: "/privacy" },
              { label: "Terms", href: "/terms" },
            ]}
          />
          <FooterLinks title="Connect" links={["Contact", "Support", "WhatsApp"]} />
        </div>
        <p className="mt-6 text-xs text-center text-zinc-500">
          SalesSuite is a product of SalesSuite Private Limited.
        </p>
      </div>

      {/* Big SalesSuite wordmark — main attraction of the footer */}
      <div className="relative h-[clamp(5rem,15vw,16rem)] overflow-hidden">
        <p className="pointer-events-none absolute left-1/2 top-0 -translate-x-1/2 select-none text-[clamp(8rem,22vw,24rem)] leading-[0.82] font-semibold tracking-[-0.02em] text-white/95">
          SalesSuite
        </p>
      </div>
    </footer>
  );
}
