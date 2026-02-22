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

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-white text-zinc-900 dark:bg-[#0d1117] dark:text-zinc-100">
      <div className="mx-auto max-w-7xl px-4 sm:px-8 lg:px-12">
        <Header />
        
        <main className="mx-auto max-w-2xl pt-20 pb-32">
          <div className="text-center">
            <p className="text-xs font-bold uppercase tracking-widest text-zinc-400">Policies</p>
            <h1 className={`${displaySerif.className} mt-3 text-5xl font-semibold tracking-tight sm:text-7xl text-zinc-900 dark:text-zinc-100`}>
              Privacy Policy
            </h1>
            <p className="mt-6 text-zinc-500 dark:text-zinc-400">
              Last updated: February 22, 2026
            </p>
          </div>

          <div className="mt-20 space-y-12 text-[17px] leading-[1.6] text-zinc-600 dark:text-zinc-300">
            <section>
              <p>
                SalesSuite is owned and operated by <strong>Sales Suite Private Limited</strong>.
              </p>
              <p className="mt-4">
                This Privacy Policy explains how we collect, use, and protect information when you use the SalesSuite mobile application and related services.
              </p>
            </section>

            <section>
              <h2 className={`${displaySerif.className} text-3xl font-semibold text-zinc-900 dark:text-zinc-100`}>1. Information We Collect</h2>
              <div className="mt-6 space-y-8">
                <div>
                  <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">1.1 Account Information</h3>
                  <p className="mt-2">We collect information provided during account creation, including:</p>
                  <ul className="mt-3 list-inside list-disc space-y-1 pl-2">
                    <li>Name</li>
                    <li>Email address</li>
                    <li>Phone number</li>
                    <li>Organization or employer details</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">1.2 Location Data</h3>
                  <p className="mt-2 text-zinc-900 dark:text-zinc-100 font-medium">
                    During active clocked-in work sessions, SalesSuite collects precise location data for the following purposes:
                  </p>
                  <ul className="mt-3 list-inside list-disc space-y-1 pl-2">
                    <li>Verifying shop visits using geofencing</li>
                    <li>Confirming attendance at assigned locations</li>
                    <li>Supporting work activity reporting</li>
                  </ul>
                  <p className="mt-6 border-l-2 border-zinc-200 pl-4 italic dark:border-zinc-800">
                    Location tracking begins only when a user manually clocks in and stops automatically when the user clocks out. SalesSuite does not collect or store location data outside of clocked-in work hours.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">1.3 Activity Recognition Data</h3>
                  <p className="mt-2">
                    During active work sessions, the application may collect activity recognition data such as walking, driving, or being stationary. This data is used solely for business reporting and verification purposes.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">1.4 Device and Technical Information</h3>
                  <p className="mt-2">
                    We collect diagnostic logs and technical details including device type, operating system version, and app version to ensure platform stability.
                  </p>
                </div>
              </div>
            </section>

            <section>
              <h2 className={`${displaySerif.className} text-3xl font-semibold text-zinc-900 dark:text-zinc-100`}>2. How We Use Information</h2>
              <div className="mt-6 space-y-4">
                <p>We use collected data to verify client visits, generate work reports for authorized managers, improve service performance, and maintain system security.</p>
                <p className="font-semibold text-zinc-900 dark:text-zinc-100">We do not sell personal data.</p>
              </div>
            </section>

            <section>
              <h2 className={`${displaySerif.className} text-3xl font-semibold text-zinc-900 dark:text-zinc-100`}>3. Data Sharing</h2>
              <div className="mt-6 space-y-4">
                <p>Collected work-related data may be shared with your employer, authorized administrators, and our hosting/infrastructure providers. We do not share data for advertising purposes.</p>
              </div>
            </section>

            <section>
              <h2 className={`${displaySerif.className} text-3xl font-semibold text-zinc-900 dark:text-zinc-100`}>4. Data Retention</h2>
              <p className="mt-6">
                Work-related data is retained only as long as necessary for operational and reporting purposes or as required by employer policy.
              </p>
            </section>

            <section>
              <h2 className={`${displaySerif.className} text-3xl font-semibold text-zinc-900 dark:text-zinc-100`}>5. User Rights</h2>
              <div className="mt-6 space-y-2">
                <p>Users may view their recorded work activity and control tracking through the manual clock-in and clock-out features.</p>
              </div>
            </section>

            <section>
              <h2 className={`${displaySerif.className} text-3xl font-semibold text-zinc-900 dark:text-zinc-100`}>9. Contact Information</h2>
              <div className="mt-6 space-y-2">
                <p><strong>Sales Suite Private Limited</strong></p>
                <p>Nepal</p>
                <p>Email: contact@salessuite.com.np</p>
              </div>
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
