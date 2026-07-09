import './globals.css';
import Logo from '../components/logo'; 
import OnboardingGuide from '../components/OnboardingGuide';
import Link from 'next/link'; // <-- 1. Make sure to import Link at the top

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-zinc-950 text-white min-h-screen flex flex-col">
        
        <OnboardingGuide />

        <header className="flex items-center justify-between p-4 bg-[#070c14] border-b border-zinc-800/50">
          <Logo className="h-8" />
        </header>

        {/* This renders the actual pages of your app */}
        <main className="flex-1">
          {children}
        </main>

        {/* 2. Add this clean, simple footer at the bottom */}
        <footer className="p-4 bg-[#070c14] border-t border-zinc-800/50 text-center text-xs text-zinc-500">
          <p>© 2026 SomaFlow. All rights reserved.</p>
          <Link href="/privacy" className="hover:text-zinc-300 underline mt-1 inline-block">
            Privacy Policy
          </Link>
        </footer>

      </body>
    </html>
  );
}