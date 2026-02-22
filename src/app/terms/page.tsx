"use client";

import Link from "next/link";
import { Cormorant_Garamond } from "next/font/google";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";

const displaySerif = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["500", "600"],
});

export default function TermsAndConditions() {
  return (
    <div className="relative min-h-screen overflow-x-clip bg-[#121316] text-zinc-900 dark:text-zinc-100">
      <main className="relative z-10 overflow-x-clip rounded-b-[4.5rem] bg-[#f3f2f6] pb-24 dark:bg-[#0d1117]">
        <div className="mx-auto w-full max-w-7xl px-4 pt-4 sm:px-8 lg:px-12">
          <Header />
          
          <div className="mx-auto max-w-2xl pt-20 pb-32">
            <div className="text-center">
              <p className="text-xs font-bold uppercase tracking-widest text-zinc-400">Legal</p>
              <h1 className={`${displaySerif.className} mt-3 text-5xl font-semibold tracking-tight sm:text-7xl text-zinc-900 dark:text-zinc-100`}>
                Terms of Use
              </h1>
              <p className="mt-6 text-zinc-500 dark:text-zinc-400">
                Last updated: February 22, 2026
              </p>
            </div>

            <div className="mt-20 space-y-12 text-[17px] leading-[1.6] text-zinc-600 dark:text-zinc-300">
              <section>
                <p>
                  These Terms govern the use of the SalesSuite application operated by <strong>Sales Suite Private Limited</strong>.
                </p>
              </section>

              <section>
                <h2 className={`${displaySerif.className} text-3xl font-semibold text-zinc-900 dark:text-zinc-100`}>1. Service Description</h2>
                <p className="mt-6">
                  SalesSuite is a workforce and sales management platform designed for use by authorized employees and contractors of subscribing organizations.
                </p>
              </section>

              <section>
                <h2 className={`${displaySerif.className} text-3xl font-semibold text-zinc-900 dark:text-zinc-100`}>2. Work Tracking Acknowledgment</h2>
                <div className="mt-6 space-y-4 text-zinc-600 dark:text-zinc-300">
                  <p>By using the clock-in feature, users acknowledge that:</p>
                  <ul className="list-inside list-disc space-y-2 pl-2">
                    <li>Location verification may occur during clocked-in periods</li>
                    <li>Visit verification is conducted using geofencing technology</li>
                    <li>Activity recognition may record movement status during work hours</li>
                  </ul>
                  <p className="mt-4 italic">
                    Tracking occurs only during active work sessions initiated by the user.
                  </p>
                </div>
              </section>

              <section>
                <h2 className={`${displaySerif.className} text-3xl font-semibold text-zinc-900 dark:text-zinc-100`}>3. Employer Access to Data</h2>
                <div className="mt-6 space-y-4">
                  <p>
                    Work-related data collected through the application may be accessible to authorized administrators within the subscribing organization.
                  </p>
                  <p className="font-semibold text-zinc-900 dark:text-zinc-100">
                    Sales Suite Private Limited is not responsible for how employers use internal reports.
                  </p>
                </div>
              </section>

              <section>
                <h2 className={`${displaySerif.className} text-3xl font-semibold text-zinc-900 dark:text-zinc-100`}>4. Acceptable Use</h2>
                <div className="mt-6 space-y-4 text-zinc-600 dark:text-zinc-300">
                  <p>Users agree not to:</p>
                  <ul className="list-inside list-disc space-y-2 pl-2">
                    <li>Attempt to falsify location data</li>
                    <li>Use unauthorized tools to manipulate tracking</li>
                    <li>Reverse engineer or exploit the platform</li>
                  </ul>
                </div>
              </section>

              <section>
                <h2 className={`${displaySerif.className} text-3xl font-semibold text-zinc-900 dark:text-zinc-100`}>5. Limitation of Liability</h2>
                <p className="mt-6">
                  The application is provided on an as-is basis. Sales Suite Private Limited shall not be liable for indirect or consequential damages arising from use of the service.
                </p>
              </section>

              <section>
                <h2 className={`${displaySerif.className} text-3xl font-semibold text-zinc-900 dark:text-zinc-100`}>6. Suspension or Termination</h2>
                <p className="mt-6">
                  Access may be suspended or terminated for violation of these Terms.
                </p>
              </section>

              <section>
                <h2 className={`${displaySerif.className} text-3xl font-semibold text-zinc-900 dark:text-zinc-100`}>7. Governing Law</h2>
                <p className="mt-6">
                  These Terms shall be governed by the laws of <strong>Nepal</strong>.
                </p>
              </section>

              <div className="pt-20 text-center">
                 <Link href="/" className="text-zinc-500 underline underline-offset-4 hover:text-zinc-900 dark:hover:text-zinc-100">
                  Back to home
                 </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
