import Image from "next/image";
import Link from "next/link";
import { Cormorant_Garamond } from "next/font/google";

const displaySerif = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["500", "600"],
});

export default function Home() {
  return (
    <div className="relative min-h-screen bg-[#121316] text-zinc-900 dark:text-zinc-100">
      {/* Main content — sits above the sticky footer, has rounded bottom + background */}
      <main className="relative z-10 rounded-b-[4.5rem] bg-[#f3f2f6] pb-24 dark:bg-[#0d1117]">
        <div className="mx-auto max-w-7xl px-4 pt-8 sm:px-8 lg:px-12">
        <header className="flex items-center justify-between">
          <div className="relative h-[82px] w-[82px]">
            <Image
              src="/logo.svg"
              alt="Kora logo"
              width={82}
              height={82}
              priority
              className="dark:hidden"
            />
            <Image
              src="/logo-dark.svg"
              alt="Kora logo dark"
              width={82}
              height={82}
              priority
              className="hidden dark:block"
            />
          </div>
          <Link
            href="/auth/signup"
            className="rounded-full bg-zinc-800 px-10 py-3 text-[16px] font-medium text-white dark:bg-zinc-100 dark:text-zinc-900"
          >
            Sign up
          </Link>
        </header>

        <section className="pt-16 pb-8 text-center">
          <div className="mx-auto inline-flex items-center rounded-full border border-zinc-200 bg-white/70 px-6 py-2 text-[14px] text-zinc-700 shadow-sm dark:border-zinc-700 dark:bg-zinc-800/70 dark:text-zinc-200">
            Built for modern field sales teams
          </div>
          <h1
            className={`${displaySerif.className} mx-auto mt-8 max-w-[920px] text-[clamp(3.8rem,8vw,8.2rem)] leading-[0.95] tracking-[-0.02em] text-zinc-900 dark:text-zinc-100`}
          >
            Field visits,
            <br />
            leads, and orders.
          </h1>
          <p className="mx-auto mt-7 max-w-2xl text-[clamp(1.1rem,1.8vw,2rem)] leading-[1.35] text-zinc-500 dark:text-zinc-400">
            Kora helps managers track staff activity, convert leads faster,
            <br />
            and capture orders with confidence.
          </p>
          <div className="mt-8 flex items-center justify-center gap-3">
            <Link
              href="/auth/signup"
              className="rounded-full bg-zinc-800 px-11 py-3 text-[17px] font-medium text-white dark:bg-zinc-100 dark:text-zinc-900"
            >
              Sign up
            </Link>
        </div>

          <div className="relative mx-auto mt-8 h-[82vh] max-w-none overflow-visible">
            <div
              className="absolute left-1/2 top-[6%] z-10 h-[28vh] w-[56vw] -translate-x-1/2 rounded-[999px] blur-[72px]"
              style={{
                background:
                  "radial-gradient(ellipse at center, rgba(220,20,60,0.55) 0%, rgba(220,20,60,0.2) 45%, rgba(220,20,60,0) 75%)",
              }}
            />
            <div
              className="absolute left-[30%] top-[40%] z-10 h-[30vh] w-[24vw] rounded-[999px] blur-[80px]"
              style={{
                background:
                  "radial-gradient(ellipse at center, rgba(220,20,60,0.38) 0%, rgba(220,20,60,0) 72%)",
              }}
            />
            <div
              className="absolute right-[30%] top-[40%] z-10 h-[30vh] w-[24vw] rounded-[999px] blur-[80px]"
              style={{
                background:
                  "radial-gradient(ellipse at center, rgba(0,56,147,0.35) 0%, rgba(0,56,147,0) 72%)",
              }}
            />
            <div
              className="absolute left-1/2 top-[31%] z-10 h-[46vh] w-[46vw] -translate-x-1/2 rounded-[999px] opacity-80"
              style={{
                backgroundImage:
                  "radial-gradient(circle at 50% 38%, rgba(220,20,60,0.28), rgba(220,20,60,0) 58%), radial-gradient(circle at 50% 63%, rgba(0,56,147,0.26), rgba(0,56,147,0) 60%), repeating-radial-gradient(circle at 50% 50%, rgba(255,255,255,0.14) 0 2px, rgba(255,255,255,0) 2px 10px)",
                filter: "blur(1px)",
              }}
            />
            <div
              className="absolute bottom-[-2%] left-1/2 z-10 h-[26vh] w-[56vw] -translate-x-1/2 rounded-[999px] opacity-90 blur-[78px]"
              style={{
                background:
                  "radial-gradient(ellipse at center, rgba(0,56,147,0.5) 0%, rgba(0,56,147,0.2) 38%, rgba(220,20,60,0.12) 58%, rgba(0,56,147,0) 86%)",
              }}
            />
            <Image
              src="/phones.png"
              alt="Kora mobile app preview"
              width={900}
              height={900}
              className="absolute left-1/2 top-[52%] z-20 h-auto w-[min(145vw,150vh)] max-w-none -translate-x-1/2 -translate-y-1/2"
            />
          </div>
        </section>

        <section className="mt-28 text-center">
          <h2 className={`${displaySerif.className} text-4xl leading-tight sm:text-5xl`}>
            From first visit,
            <br />
            to final order.
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-sm text-zinc-600 dark:text-zinc-400">
            One platform for rep productivity, lead conversion, and back-office clarity.
          </p>
          <div className="mt-7 grid gap-4 md:grid-cols-3">
            <InfoCard
              title="Visits"
              subtitle="Verified Activity"
              description="Track real field movement with geofence-ready shop records."
            />
            <InfoCard
              title="Leads"
              subtitle="Pipeline Control"
              description="Move prospects through stages and convert them to customers."
            />
            <InfoCard
              title="Orders"
              subtitle="Fast Handoff"
              description="Capture orders quickly and pass them to back office without chaos."
            />
          </div>
        </section>

        <section className="mt-16 rounded-[2rem] bg-white/70 px-6 py-10 text-center dark:bg-zinc-900/70">
          <p className="text-xs uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">Coverage</p>
          <h3 className={`${displaySerif.className} mt-2 text-4xl leading-tight`}>
            Coverage and performance,
            <br />
            all in one place.
          </h3>
          <p className="mx-auto mt-3 max-w-2xl text-sm text-zinc-600 dark:text-zinc-400">
            Monitor shop coverage, missed visits, and rep productivity across your team.
          </p>
        </section>

        <section className="mt-16 rounded-[2rem] bg-[#ebe8f2] px-5 py-10 dark:bg-zinc-900">
          <h3 className={`${displaySerif.className} text-center text-4xl leading-tight`}>
            Teams trust Kora
          </h3>
          <div className="mt-8 grid gap-3 md:grid-cols-3">
            <QuoteCard quote="Our reps finally log visits consistently." author="Regional Manager" />
            <QuoteCard quote="Lead follow-ups are faster and more structured now." author="Sales Ops" />
            <QuoteCard quote="Order capture and handoff became painless." author="Back Office Lead" />
          </div>
        </section>

        <section className="mx-auto mt-16 mb-0 max-w-3xl">
          <p className="text-center text-xs uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">FAQ</p>
          <h3 className={`${displaySerif.className} mt-2 text-center text-4xl leading-tight`}>
            Got questions?
            <br />
            Here are the answers.
          </h3>
          <div className="mt-8 space-y-3">
            {[
              "What is Kora?",
              "Can managers monitor staff activity in real time?",
              "Can we assign shops directly to reps?",
              "Does Kora support lead-to-customer conversion?",
              "Can reps capture orders from the field?",
              "Can we export data for back office or ERP?",
            ].map((item) => (
              <button
                key={item}
                type="button"
                className={`${displaySerif.className} flex w-full items-center justify-between rounded-2xl border border-zinc-200/80 bg-[#f7f7f8] px-7 py-5 text-left text-[22px] text-zinc-800 shadow-[0_1px_0_rgba(0,0,0,0.03)] dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100`}
              >
                <span>{item}</span>
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-zinc-200 text-[14px] text-zinc-500 dark:bg-zinc-700 dark:text-zinc-300">
                  v
                </span>
              </button>
            ))}
          </div>
        </section>

        </div>{/* close inner max-w-7xl wrapper */}
      </main>{/* close main — rounded-b content layer */}

      {/* Footer — sticky underneath, revealed as main scrolls away */}
      <footer className="sticky bottom-0 z-0 -mt-px bg-[#121316] text-zinc-200 [background-image:radial-gradient(circle_at_20%_10%,rgba(255,255,255,0.03),transparent_28%),repeating-linear-gradient(90deg,rgba(255,255,255,0.012)_0px,rgba(255,255,255,0.012)_1px,transparent_1px,transparent_10px)]">
        <div className="mx-auto max-w-7xl px-8 pb-8 pt-16 md:px-12">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            <div className="flex items-start">
              <Image src="/icon.svg" alt="Kora icon" width={36} height={36} />
            </div>
            <FooterLinks
              title="Platform"
              links={["Overview", "Visits", "Leads", "Orders"]}
            />
            <FooterLinks
              title="Company"
              links={["About", "Security", "Privacy", "Terms"]}
            />
            <FooterLinks title="Connect" links={["Contact", "Support", "WhatsApp"]} />
          </div>
        </div>

        {/* Big "Kora" wordmark — bottom ~30% buried below visible area */}
        <div className="relative h-[clamp(5.5rem,18vw,19rem)] overflow-hidden">
          <p className="pointer-events-none absolute left-1/2 top-0 -translate-x-1/2 select-none text-[clamp(12rem,32vw,38rem)] leading-[0.82] font-semibold tracking-[-0.03em] text-white/95">
            Kora
          </p>
        </div>
      </footer>
    </div>
  );
}

function InfoCard(props: { title: string; subtitle: string; description: string }) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-5 text-left shadow-sm dark:border-zinc-700 dark:bg-zinc-800">
      <p className="text-4xl font-semibold text-zinc-900 dark:text-zinc-100">{props.title}</p>
      <p className="mt-2 text-xl font-serif text-zinc-900 dark:text-zinc-100">{props.subtitle}</p>
      <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">{props.description}</p>
    </div>
  );
}

function QuoteCard(props: { quote: string; author: string }) {
  return (
    <div className="rounded-xl bg-white px-4 py-4 dark:bg-zinc-800">
      <p className="font-serif text-lg text-zinc-900 dark:text-zinc-100">&quot;{props.quote}&quot;</p>
      <p className="mt-2 text-xs uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
        {props.author}
      </p>
    </div>
  );
}

function FooterLinks(props: { title: string; links: string[] }) {
  return (
    <div>
      <p className="text-sm font-semibold uppercase tracking-wide text-white">{props.title}</p>
      <ul className="mt-3 space-y-2 text-sm text-zinc-400">
        {props.links.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}
