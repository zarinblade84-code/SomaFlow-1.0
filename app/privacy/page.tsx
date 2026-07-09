import React from 'react';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-300 p-6 md:p-12 max-w-3xl mx-auto font-sans">
      <h1 className="text-4xl font-bold text-white mb-2 tracking-tight">Privacy Policy</h1>
      <p className="text-xs text-zinc-500 mb-8">Last Updated: July 2026</p>

      <div className="space-y-8 backend-text">
        <section>
          <h2 className="text-xl font-semibold text-white mb-3">Third-Party Services</h2>
          <p className="leading-relaxed">
            We utilize secure third-party services (like Supabase for data management and Lemon Squeezy for payment processing) that may access relevant data to perform their required operational functions. When required by law, we may also disclose information to government authorities.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-white mb-3">Data Security</h2>
          <p className="leading-relaxed">
            We implement standard industry security measures to protect your information from unauthorized access. However, please note that no method of transmission over the internet or electronic storage is 100% secure.
          </p>
        </section>

        <section className="pt-4 border-t border-zinc-800">
          <h2 className="text-xl font-semibold text-white mb-3">Contact Us</h2>
          <p className="leading-relaxed">
            If you have any questions or concerns regarding this Privacy Policy, please reach out to our team directly at:{' '}
            <a href="mailto:somaflow.hq@gmail.com" className="text-[#1ea39b] font-medium hover:underline">
              somaflow.hq@gmail.com
            </a>
          </p>
        </section>
      </div>
    </div>
  );
}