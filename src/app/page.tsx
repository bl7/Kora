"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { Cormorant_Garamond } from "next/font/google";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";

const displaySerif = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["500", "600"],
});

function useScrollAnimation() {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => {
      if (ref.current) {
        observer.unobserve(ref.current);
      }
    };
  }, []);

  return { ref, isVisible };
}

function ScrollSection({ children, className = "", id }: { children: React.ReactNode; className?: string; id?: string }) {
  const { ref, isVisible } = useScrollAnimation();
  return (
    <section
      ref={ref}
      id={id}
      className={`${className} transition-all duration-700 ${
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
      }`}
    >
      {children}
    </section>
  );
}



export default function Home() {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "SalesSuite",
    applicationCategory: "BusinessApplication",
    operatingSystem: "Android",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "NPR",
    },
    description: "Field sales management platform for distributors. Verify visits with geofencing, capture leads, and process orders.",
    url: "https://kora.vercel.app",
    publisher: {
      "@type": "Organization",
      name: "SalesSuite Private Limited",
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <div className="relative min-h-screen overflow-x-clip bg-[#121316] text-zinc-900 dark:text-zinc-100">
        {/* Main content — sits above the sticky footer; overflow-x-clip avoids making main a scroll container so doc scrolls */}
        <main className="relative z-10 overflow-x-clip rounded-b-[4.5rem] bg-[#f3f2f6] pb-24 dark:bg-[#0d1117]">
          <div className="mx-auto w-full max-w-7xl px-4 pt-4 sm:px-8 lg:px-12">
          <Header />

        <section className="pt-16 pb-8 text-center">
          <div className="mx-auto inline-flex items-center rounded-full border border-zinc-200 bg-white/70 px-6 py-2 text-[14px] text-zinc-700 shadow-sm dark:border-zinc-700 dark:bg-zinc-800/70 dark:text-zinc-200 animate-in fade-in slide-in-from-bottom-4 duration-700" style={{ animationDelay: "0.1s" }}>
            For reps in the field and managers and back office in the dashboard
          </div>
          <h1
            className={`${displaySerif.className} mx-auto mt-8 max-w-[920px] text-[clamp(3.8rem,8vw,8.2rem)] leading-[0.95] tracking-[-0.02em] text-zinc-900 dark:text-zinc-100 animate-in fade-in slide-in-from-bottom-4 duration-700`}
            style={{ animationDelay: "0.2s" }}
          >
            Field Sales,
            <br />
            Fully Visible.
          </h1>
          <p className="mx-auto mt-7 max-w-2xl text-[clamp(0.95rem,1.3vw,1.35rem)] leading-[1.5] text-zinc-600 dark:text-zinc-400 animate-in fade-in slide-in-from-bottom-4 duration-700" style={{ animationDelay: "0.3s" }}>
            SalesSuite detects shop arrivals using geofencing, logs visits with time and duration, and lets reps submit orders with totals, straight to back office.
          </p>
          <div className="mt-8 flex flex-col items-center gap-3 animate-in fade-in slide-in-from-bottom-4 duration-700" style={{ animationDelay: "0.4s" }}>
            <Link
              href="#contact"
              className="rounded-full bg-zinc-800 px-11 py-3 text-[17px] font-medium text-white transition-all duration-300 hover:scale-105 hover:shadow-lg dark:bg-zinc-100 dark:text-zinc-900"
            >
              Request demo
            </Link>
            <Link
              href="#how-it-works"
              className="text-[14px] text-zinc-500 underline underline-offset-4 transition-colors hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
            >
              See how it works ↓
            </Link>
          </div>

          <div className="relative mx-auto mt-12 h-[90vh] w-full">
            <div className="relative h-full w-full pt-[60px] pb-[60px]">
              <div
                className="absolute left-1/2 top-[33%] z-10 h-[46vh] w-[min(46vw,100%)] -translate-x-1/2 rounded-[999px] opacity-20"
                style={{
                  backgroundImage:
                    "radial-gradient(circle at 50% 50%, rgba(0,0,0,0.1) 0 2px, rgba(0,0,0,0) 2px 10px)",
                }}
              />
              <Image
                src="/phones.png"
                alt="SalesSuite mobile app preview"
                width={900}
                height={900}
                className="absolute left-1/2 top-[52%] z-20 h-auto w-[min(100vw,120vh)] max-w-[900px] -translate-x-1/2 -translate-y-1/2 sm:w-[min(145vw,150vh)] sm:max-w-none"
                style={{ filter: "drop-shadow(0 32px 64px rgba(0,0,0,0.22)) drop-shadow(0 8px 24px rgba(0,0,0,0.14))" }}
              />
              {/* Seamless fade — no overflow-hidden so this bleeds past the container */}
              <div className="absolute bottom-0 left-0 right-0 z-10 h-80 bg-gradient-to-b from-transparent to-[#f3f2f6] dark:to-[#0d1117]" />
            </div>
          </div>
        </section>


        {/* Executive Features Showcase */}
        <ScrollSection className="mt-32 px-4">
          <div className="text-center space-y-6">
            <p className="text-xs font-black uppercase tracking-[0.25em] text-zinc-400">Institutional Visibility</p>
            <h2 className={`${displaySerif.className} text-[clamp(2.5rem,6vw,5rem)] leading-[0.9] tracking-tight text-zinc-900 dark:text-zinc-100`}>
              The ground-truth for 
              <br />
              field operations.
            </h2>
            <p className="mx-auto max-w-2xl text-lg leading-relaxed text-zinc-500 dark:text-zinc-400">
              SalesSuite provides the verified data required to optimize regional territories, monitor visit integrity, and scale high-performance sales units.
            </p>
          </div>

          <div className="mt-20 grid gap-12 md:grid-cols-3 border-t border-zinc-100 pt-16 dark:border-zinc-800/50">
            <FeatureItem 
              title="Operational Integrity"
              desc="Deep geofence integration ensures reps are physically present at shop locations, eliminating reporting ambiguity and verifying field presence."
            />
            <FeatureItem 
              title="Market Expansion"
              desc="Empower your team to capture new leads in seconds. Log metadata, location, and requirements instantly, converting prospects to active accounts seamlessly."
            />
            <FeatureItem 
              title="Strategic Oversight"
              desc="Convert field activity into actionable intelligence. Monitor coverage parity, reassign territories dynamically, and benchmark performance across regional units."
            />
          </div>
        </ScrollSection>

        {/* How it works strip */}
        <ScrollSection id="how-it-works" className="mx-auto mt-16 max-w-4xl px-4">
          <div className="relative flex items-start justify-between gap-0">
            {/* connecting line */}
            <div className="absolute left-[calc(16.67%)] right-[calc(16.67%)] top-5 h-px bg-zinc-200 dark:bg-zinc-700" />
            {[{n:"1",label:"Arrive",sub:"Rep enters shop geofence"},{n:"2",label:"Log visit",sub:"Time, duration & notes captured"},{n:"3",label:"Send order",sub:"Items & totals straight to back office"}].map((step) => (
              <div key={step.n} className="relative z-10 flex flex-1 flex-col items-center text-center px-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-900 text-[13px] font-bold text-white dark:bg-zinc-100 dark:text-zinc-900">
                  {step.n}
                </div>
                <p className="mt-3 text-[15px] font-bold text-zinc-900 dark:text-zinc-100">{step.label}</p>
                <p className="mt-1 text-[12px] leading-snug text-zinc-500 dark:text-zinc-400">{step.sub}</p>
              </div>
            ))}
          </div>
          <p className="mx-auto mt-8 max-w-2xl text-center text-sm text-zinc-500 dark:text-zinc-400">
            Tracking is configurable. SalesSuite focuses on visit verification during working routes, not personal surveillance.
          </p>
        </ScrollSection>


        {/* Nepal-first Offline Section */}
        <ScrollSection className="mt-32 px-4">
          <div className="text-center space-y-6">
            <p className="text-xs font-black uppercase tracking-[0.25em] text-zinc-400">Nepal First</p>
            <h2 className={`${displaySerif.className} text-[clamp(2.5rem,6vw,5rem)] leading-[0.9] tracking-tight text-zinc-900 dark:text-zinc-100`}>
              Built for hills, valleys<br />and spotty signal.
            </h2>
            <p className="mx-auto max-w-2xl text-lg leading-relaxed text-zinc-500 dark:text-zinc-400">
              Most sales software assumes a stable 4G connection. Nepal doesn&apos;t. From the Terai plains to mountain districts, our reps operate where connectivity is unreliable at best. SalesSuite stores everything locally first, then syncs the moment signal returns.
            </p>
          </div>
          {/* Image — light/dark variants, single container to avoid layout shift */}
          <div className="mt-12 mx-auto w-full max-w-4xl" style={{ position: "relative" }}>
            {/* Glow bed — only visible in dark mode */}
            <div
              className="hidden dark:block"
              style={{
                position: "absolute",
                inset: 0,
                borderRadius: "999px",
                background: "radial-gradient(ellipse 80% 60% at 50% 50%, rgba(255,255,255,0.06), transparent 70%)",
                filter: "blur(8px)",
                zIndex: 0,
              }}
            />
            {/* Light mode image */}
            <Image
              src="/hills.png"
              alt="Nepal hills — SalesSuite works without internet"
              width={1400}
              height={900}
              className="dark:hidden w-full h-auto rounded-3xl"
              style={{ position: "relative", zIndex: 1 }}
            />
            {/* Dark mode image with mask */}
            <Image
              src="/dark.png"
              alt="Nepal hills at night — SalesSuite works without internet"
              width={1400}
              height={900}
              className="hidden dark:block w-full h-auto"
              style={{
                position: "relative",
                zIndex: 1,
                WebkitMaskImage: "radial-gradient(ellipse 80% 75% at 50% 50%, black 25%, transparent 68%)",
                maskImage: "radial-gradient(ellipse 80% 75% at 50% 50%, black 25%, transparent 68%)",
                WebkitMaskRepeat: "no-repeat",
                maskRepeat: "no-repeat",
                WebkitMaskSize: "100% 100%",
                maskSize: "100% 100%",
              }}
            />
          </div>
          {/* Feature items below, same grid as features section */}
          <div className="mt-16 grid gap-12 md:grid-cols-3 border-t border-zinc-100 pt-16 dark:border-zinc-800/50">
            <FeatureItem title="Offline-first" desc="Data writes to the device first. Nothing is lost if the network drops mid-visit or in a dead zone." />
            <FeatureItem title="Auto-sync on reconnect" desc="Queued visits, orders, and leads sync silently the moment a connection is restored — no manual steps needed." />
            <FeatureItem title="GPS always on" desc="Geofence detection and visit logging continue using on-device GPS even without a data connection." />
          </div>
        </ScrollSection>

        <ScrollSection className="mt-16 rounded-[2rem] bg-[#ebe8f2] px-5 py-10 dark:bg-zinc-900">
          <h3 className={`${displaySerif.className} text-center text-4xl leading-tight`}>
            Teams trust SalesSuite
          </h3>
          <div className="mt-8 grid gap-3 md:grid-cols-3">
            <QuoteCard quote="We finally have proof of visits, not just promises." author="Roshan K. — Regional Manager, Paint Distributor" delay="0ms" />
            <QuoteCard quote="Lead follow-ups are cleaner because every note is logged on site." author="Priya S. — Sales Ops Lead, FMCG Distributor" delay="100ms" />
            <QuoteCard quote="Orders come through with totals and item lists. No more messy calls to the office." author="Anita M. — Back Office Lead, Wholesale" delay="200ms" />
          </div>
        </ScrollSection>

        <ScrollSection className="mx-auto mt-16 mb-0 max-w-3xl">
          <p className="text-center text-xs uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">FAQ</p>
          <h3 className={`${displaySerif.className} mt-2 text-center text-4xl leading-tight`}>
            Got questions?
            <br />
            Here are the answers.
          </h3>
          <div className="mt-8 space-y-3">
            {[
              { q: "How does SalesSuite detect shop visits?", a: "SalesSuite uses geofencing around shop locations and prompts reps when they arrive. Visits record time, duration, and outcome." },
              { q: "Can reps fake a visit?", a: "Visits require arrival detection and are stamped with time and location. You can also enforce minimum time on site." },
              { q: "Does SalesSuite track reps all day?", a: "You control tracking mode. SalesSuite is designed for visit verification, not personal surveillance." },
              { q: "Will it drain battery?", a: "SalesSuite uses Android background location responsibly and only increases accuracy near visit zones." },
              { q: "Can reps capture orders from the field?", a: "Yes, reps can build orders with items and quantities, see totals, then submit to back office." },
              { q: "How do orders reach back office?", a: "Orders are delivered to the manager dashboard and can be exported for processing." },
              { q: "Is SalesSuite Android only?", a: "Yes, Android only for now." },
              { q: "What happens when a rep leaves?", a: "You can deactivate them and reassign their shops to other reps in one flow, so coverage stays intact." },
            ].map((item) => (
              <FAQItem key={item.q} question={item.q} answer={item.a} />
            ))}
          </div>
        </ScrollSection>

        {/* Pricing section — one connected strip: left | phone (tilted connector) | right (taller); phone.png */}
        <ScrollSection className="mx-auto max-w-5xl pt-20 pb-20 md:pt-24 md:pb-24">
          <div className="relative flex min-h-[340px] flex-col overflow-visible rounded-2xl md:flex-row md:items-stretch">
            {/* Left panel — light blue-grey; clean typography, step numbers in circles */}
            <div
              className="flex min-w-0 flex-1 flex-col justify-center rounded-t-2xl pt-8 pb-7 pl-7 pr-6 md:rounded-l-2xl md:rounded-tr-none md:self-center md:pt-10 md:pb-8"
              style={{ backgroundColor: "#e8ecf1" }}
            >
              <h3
                className="text-[1.05rem] font-bold leading-snug tracking-tight"
                style={{ color: "#1d1e20" }}
              >
                Get started in minutes
              </h3>
              <div className="mt-6 space-y-3.5">
                {[
                  "Sign up",
                  "Add your team & shops",
                  "Start capturing orders",
                ].map((step, i) => (
                  <div
                    key={step}
                    className="flex min-h-[48px] items-center gap-3 rounded-xl px-4 py-3"
                    style={{ backgroundColor: "rgba(255,255,255,0.85)" }}
                  >
                    <span
                      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[13px] font-semibold"
                      style={{ backgroundColor: "#e2e4e8", color: "#1d1e20" }}
                    >
                      {i + 1}
                    </span>
                    <span className="text-[15px] font-medium leading-snug" style={{ color: "#1d1e20" }}>
                      {step}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Phone — middle as connector; tilted, overlaps both on desktop; between panels on mobile */}
            <div className="relative z-10 flex items-center justify-center py-4 md:absolute md:inset-0 md:pointer-events-none md:py-0">
              <div className="relative w-[240px] drop-shadow-2xl md:absolute md:left-1/2 md:top-1/2 md:my-8 md:w-[340px] md:-translate-x-1/2 md:-translate-y-1/2 md:rotate-[6deg] md:pointer-events-auto">
                <Image
                  src="/phone.png"
                  alt="SalesSuite app on phone"
                  width={340}
                  height={706}
                  className="h-auto w-full"
                />
              </div>
            </div>

            {/* Right panel — dark, taller; text and button right-aligned */}
            <div
              className="flex min-w-0 flex-1 flex-col items-end justify-center rounded-b-2xl px-8 py-14 text-right md:min-h-[440px] md:rounded-r-2xl md:rounded-bl-none md:py-20 md:px-10"
              style={{ backgroundColor: "#2d2f33" }}
            >
              <p
                className="text-[1.125rem] font-normal leading-snug"
                style={{ color: "#f5f6f8" }}
              >
                Pricing that scales with your team.
              </p>
              <p
                className="mt-5 max-w-[260px] text-[0.9375rem] font-normal leading-relaxed"
                style={{ color: "#b6b8b9" }}
              >
                Pricing depends on your team size. Get in touch and we&apos;ll tailor a plan for you.
              </p>
              <Link
                href="#contact"
                className="mt-8 inline-block rounded-full px-10 py-3.5 text-[15px] font-medium transition-opacity hover:opacity-90"
                style={{ backgroundColor: "#ffffff", color: "#1d1e20" }}
              >
                Get in touch
              </Link>
            </div>
          </div>
        </ScrollSection>

        {/* Contact Form Section */}
        <ScrollSection id="contact" className="mx-auto mt-20 mb-20 max-w-2xl">
          <p className="text-center text-xs uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">Request a Demo</p>
          <h3 className={`${displaySerif.className} mt-2 text-center text-4xl leading-tight`}>
            Request a demo
          </h3>
          <p className="mx-auto mt-3 max-w-xl text-center text-sm text-zinc-600 dark:text-zinc-400">
            Tell us your team size and workflow, we&apos;ll set up SalesSuite for your route.
          </p>
          <ContactForm />
        </ScrollSection>

        </div>{/* close inner max-w-7xl wrapper */}
      </main>{/* close main — rounded-b content layer */}

      <Footer />
    </div>
    </>
  );
}


function QuoteCard(props: { quote: string; author: string; delay?: string }) {
  const { ref, isVisible } = useScrollAnimation();
  return (
    <div
      ref={ref}
      className={`rounded-xl bg-white px-4 py-4 transition-all duration-500 hover:shadow-md hover:-translate-y-1 dark:bg-zinc-800 ${
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
      }`}
      style={{ transitionDelay: props.delay || "0ms" }}
    >
      <p className="font-serif text-lg text-zinc-900 dark:text-zinc-100">&quot;{props.quote}&quot;</p>
      <p className="mt-2 text-xs uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
        {props.author}
      </p>
    </div>
  );
}

function FAQItem(props: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-2xl border border-zinc-200/80 bg-[#f7f7f8] shadow-[0_1px_0_rgba(0,0,0,0.03)] transition-all duration-300 hover:shadow-md dark:border-zinc-700 dark:bg-zinc-900">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={`${displaySerif.className} flex w-full items-center justify-between px-7 py-5 text-left text-[26px] text-zinc-800 dark:text-zinc-100 transition-colors hover:text-zinc-900 dark:hover:text-zinc-50`}
      >
        <span>{props.question}</span>
        <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-zinc-200 text-[14px] text-zinc-500 transition-all duration-300 dark:bg-zinc-700 dark:text-zinc-300 ${open ? "rotate-180" : ""}`}>
          v
        </span>
      </button>
      {open && (
        <div className="border-t border-zinc-200/80 px-7 pb-5 pt-3 animate-in fade-in slide-in-from-top-2 duration-300 dark:border-zinc-700">
          <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">{props.answer}</p>
        </div>
      )}
    </div>
  );
}

function ContactForm() {
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [email, setEmail] = useState("");
  const [phoneDigits, setPhoneDigits] = useState("");
  const [teamSize, setTeamSize] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const res = await fetch("/api/contact", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name,
        company,
        email,
        phone: `+977${phoneDigits}`,
        teamSize,
        message,
      }),
    });

    const data = (await res.json()) as { ok: boolean; error?: string };
    setLoading(false);

    if (!res.ok || !data.ok) {
      setError(data.error ?? "Something went wrong. Please try again.");
      return;
    }

    setSuccess(true);
    setName("");
    setCompany("");
    setEmail("");
    setPhoneDigits("");
    setTeamSize("");
    setMessage("");
  }

  if (success) {
    return (
      <div className="mt-8 rounded-2xl border border-emerald-200 bg-emerald-50 px-6 py-8 text-center dark:border-emerald-800/40 dark:bg-emerald-900/20">
        <p className={`${displaySerif.className} text-xl text-emerald-700 dark:text-emerald-400`}>
          Thank you for reaching out!
        </p>
        <p className="mt-2 text-sm text-emerald-600 dark:text-emerald-300">
          We&apos;ve received your message and will get back to you soon.
        </p>
        <button
          onClick={() => setSuccess(false)}
          className="mt-4 text-sm font-medium text-emerald-700 underline dark:text-emerald-400"
        >
          Send another message
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="mt-8 space-y-4">
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800/40 dark:bg-red-900/20 dark:text-red-400">
          {error}
        </div>
      )}

      <input
        required
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Your name"
        className="w-full rounded-2xl border border-zinc-200 bg-[#f7f7f8] px-5 py-4 text-[18px] text-zinc-800 placeholder:text-zinc-400 focus:border-zinc-400 focus:bg-white focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus:border-zinc-500"
      />

      <input
        required
        value={company}
        onChange={(e) => setCompany(e.target.value)}
        placeholder="Company / Business name"
        className="w-full rounded-2xl border border-zinc-200 bg-[#f7f7f8] px-5 py-4 text-[18px] text-zinc-800 placeholder:text-zinc-400 focus:border-zinc-400 focus:bg-white focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus:border-zinc-500"
      />

      <input
        required
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email address"
        className="w-full rounded-2xl border border-zinc-200 bg-[#f7f7f8] px-5 py-4 text-[18px] text-zinc-800 placeholder:text-zinc-400 focus:border-zinc-400 focus:bg-white focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus:border-zinc-500"
      />

      <div className="grid grid-cols-[92px_1fr] gap-2">
        <div className="flex items-center justify-center rounded-2xl border border-zinc-200 bg-[#f7f7f8] text-[18px] text-zinc-800 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300">
          +977
        </div>
        <input
          required
          inputMode="numeric"
          pattern="\d{10}"
          maxLength={10}
          value={phoneDigits}
          onChange={(e) => setPhoneDigits(e.target.value.replace(/[^0-9]/g, "").slice(0, 10))}
          placeholder="98XXXXXXXX"
          className="w-full rounded-2xl border border-zinc-200 bg-[#f7f7f8] px-5 py-4 text-[18px] text-zinc-800 placeholder:text-zinc-400 focus:border-zinc-400 focus:bg-white focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus:border-zinc-500"
        />
      </div>

      <textarea
        required
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Your message"
        rows={5}
        className="w-full rounded-2xl border border-zinc-200 bg-[#f7f7f8] px-5 py-4 text-[18px] text-zinc-800 placeholder:text-zinc-400 focus:border-zinc-400 focus:bg-white focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus:border-zinc-500"
      />

      <select
        value={teamSize}
        onChange={(e) => setTeamSize(e.target.value)}
        className="w-full rounded-2xl border border-zinc-200 bg-[#f7f7f8] px-5 py-4 text-[18px] text-zinc-800 focus:border-zinc-400 focus:bg-white focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:focus:border-zinc-500"
      >
        <option value="">Team size (optional)</option>
        <option value="1-5">1–5 reps</option>
        <option value="6-15">6–15 reps</option>
        <option value="16-50">16–50 reps</option>
        <option value="50+">50+ reps</option>
      </select>

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-full bg-zinc-800 py-4 text-[18px] font-medium text-white shadow-[0_10px_28px_rgba(0,0,0,0.18)] transition-colors hover:bg-zinc-700 disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
      >
        {loading ? "Sending..." : "Request demo"}
      </button>
      <p className="text-center text-[13px] text-zinc-400 dark:text-zinc-500">
        We reply within 24 hours. No sales pressure.
      </p>
    </form>
  );
}



function FeatureItem({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="space-y-4">
      <div className="h-0.5 w-8 bg-zinc-900 dark:bg-zinc-100" />
      <div>
        <h4 className={`${displaySerif.className} text-[22px] font-black leading-tight text-zinc-900 dark:text-zinc-100`}>{title}</h4>
        <p className="mt-3 text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">{desc}</p>
      </div>
    </div>
  );
}
