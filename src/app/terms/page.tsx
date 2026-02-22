import Image from "next/image";
import Link from "next/link";
import { Cormorant_Garamond } from "next/font/google";

const displaySerif = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["500", "600"],
});

function Header() {
  return (
    <header className="flex items-center justify-between py-6">
      <Link href="/" className="relative flex items-center">
        <Image
          src="/logo.svg"
          alt="SalesSuite logo"
          width={160}
          height={50}
          priority
          className="dark:hidden"
        />
        <Image
          src="/logo-dark.svg"
          alt="SalesSuite logo dark"
          width={160}
          height={50}
          priority
          className="hidden dark:block"
        />
      </Link>
      <nav className="hidden md:flex items-center gap-8">
        <Link href="/" className="text-sm font-medium text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100">Home</Link>
        <Link href="/#how-it-works" className="text-sm font-medium text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100">Platform</Link>
        <Link href="/#contact" className="text-sm font-medium text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100">Pricing</Link>
        <Link href="/#contact" className="text-sm font-medium text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100">Support</Link>
      </nav>
      <Link
        href="/auth/signup"
        className="rounded-full bg-zinc-900 px-6 py-2 text-sm font-medium text-white transition-all hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
      >
        Sign up
      </Link>
    </header>
  );
}

export default function TermsAndConditions() {
  return (
    <div className="min-h-screen bg-white text-zinc-900 dark:bg-[#0d1117] dark:text-zinc-100">
      <div className="mx-auto max-w-7xl px-4 sm:px-8 lg:px-12">
        <Header />
        
        <main className="mx-auto max-w-2xl pt-20 pb-32">
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
              <div className="mt-6 space-y-4">
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
              <div className="mt-6 space-y-4">
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
        </main>
      </div>

      <footer className="bg-zinc-50 py-12 dark:bg-zinc-900/50">
        <div className="mx-auto max-w-7xl px-4 text-center text-sm text-zinc-500 dark:text-zinc-400">
          <p>© 2026 Sales Suite Private Limited. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
