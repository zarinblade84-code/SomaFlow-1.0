import './globals.css';
import Logo from '../components/logo'; 
import OnboardingGuide from '../components/OnboardingGuide'; // <-- 1. Add this import

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-zinc-950 text-white min-h-screen flex flex-col">
        
        <OnboardingGuide /> {/* <-- 2. Drop the guide here. It stays invisible unless it's their first time! */}

        <header className="flex items-center justify-between p-4 bg-[#070c14] border-b border-zinc-800/50">
          <Logo className="h-8" />
        </header>

        <main className="flex-1">
          {children}
        </main>

      </body>
    </html>
  );
}