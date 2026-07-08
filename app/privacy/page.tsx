export default function PrivacyPolicy() {
    return (
      <div className="max-w-4xl mx-auto p-8 py-12 text-gray-800">
        <h1 className="text-4xl font-bold mb-6">Privacy Policy for SomaFlow</h1>
        <p className="mb-8 text-gray-600"><strong>Last Updated:</strong> July 2026</p>
  
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">1. Information We Collect</h2>
          <p className="mb-2">We collect information to provide and improve our service to you.</p>
          <ul className="list-disc pl-6 mb-4 space-y-2">
            <li><strong>Personal Information:</strong> When you sign in with Google, we receive your name and email address.</li>
            <li><strong>Usage Data:</strong> We automatically collect technical data such as your IP address and browser type to improve performance.</li>
            <li><strong>User Content:</strong> We store the tasks, protocols, and energy logs you create within the application.</li>
          </ul>
        </section>
  
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">2. How We Use Your Information</h2>
          <ul className="list-disc pl-6 mb-4 space-y-2">
            <li>To provide, maintain, and improve our services.</li>
            <li>To manage your account and authenticate your identity.</li>
            <li>To communicate with you regarding updates, security, or support.</li>
          </ul>
        </section>
  
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">3. How We Share Your Information</h2>
          <p className="mb-4">We do not sell your personal data. We may share information in limited circumstances:</p>
          <ul className="list-disc pl-6 mb-4 space-y-2">
            <li><strong>Service Providers:</strong> We use third-party services (like Supabase and Lemon Squeezy) that may access data to perform their functions.</li>
            <li><strong>Legal Obligations:</strong> If required by law, we may disclose information to government authorities.</li>
          </ul>
        </section>
  
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">4. Data Security</h2>
          <p className="mb-4">We implement industry-standard security measures to protect your information. However, no method of transmission over the internet is 100% secure.</p>
        </section>
  
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">5. Contact Us</h2>
          <p className="mb-4">If you have questions about this Privacy Policy, please contact us at: <strong>[somaflow.hq@gail.com]</strong></p>
        </section>
      </div>
    );
  }