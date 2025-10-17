export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-8 mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Privacy Policy
          </h1>
          <p className="text-lg text-gray-600">Last Updated: October 4, 2025</p>
        </div>

        {/* Content */}
        <div className="bg-white rounded-lg shadow-sm p-8 prose prose-lg max-w-none">
          {/* About This Policy */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              About This Policy
            </h2>
            <p className="text-gray-700 mb-4">
              Heritage Whisper LLC ("we," "us," or "our") operates
              HeritageWhisper.com, a mobile application that helps families
              preserve and share life stories through AI-powered voice
              interviews. This Privacy Policy explains how we collect, use,
              store, and share your personal information.
            </p>
            <p className="text-gray-700 mb-4">
              By using HeritageWhisper, you agree to this Privacy Policy. If you
              disagree with any part of this policy, do not use our service.
            </p>
            <p className="text-gray-700">
              <strong>Questions?</strong> Contact us at{" "}
              <a
                href="mailto:privacy@heritagewhisper.com"
                className="text-coral-600 hover:underline"
              >
                privacy@heritagewhisper.com
              </a>
            </p>
          </section>

          {/* Quick Summary */}
          <section className="mb-12 bg-amber-50 border-l-4 border-amber-400 p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Quick Summary
            </h2>
            <ul className="space-y-2 text-gray-700">
              <li>
                <strong>What we collect:</strong> Name, email, birth year, voice
                recordings, photos, and story content you provide.
              </li>
              <li>
                <strong>How we use it:</strong> To transcribe your stories,
                generate AI insights, create timelines, and enable family
                sharing.
              </li>
              <li>
                <strong>Who we share with:</strong> OpenAI (transcription/AI),
                Stripe (payments), Supabase (storage), Resend (emails). We never
                sell your data.
              </li>
              <li>
                <strong>Your rights:</strong> You own your recordings. You can
                download, edit, or delete everything at any time.
              </li>
              <li>
                <strong>AI processing:</strong> Your stories are processed by AI
                but never used to train AI models.
              </li>
            </ul>
          </section>

          {/* Your Security & Control */}
          <section className="mb-12 bg-gradient-to-br from-amber-50 to-orange-50 border border-orange-200 rounded-2xl p-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">
              Your Security & Control
            </h2>
            
            <div className="mb-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                We protect your stories with:
              </h3>
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="text-orange-600 font-bold mt-1">•</span>
                  <span><strong>Bank-level 256-bit encryption</strong> for all data in transit and at rest</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-orange-600 font-bold mt-1">•</span>
                  <span><strong>Private by default</strong> - you choose who sees each story</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-orange-600 font-bold mt-1">•</span>
                  <span><strong>Automatic removal of location data</strong> from all recordings</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-orange-600 font-bold mt-1">•</span>
                  <span><strong>Full download of your content anytime</strong></span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-orange-600 font-bold mt-1">•</span>
                  <span><strong>Complete deletion rights</strong> - no questions asked</span>
                </li>
              </ul>
            </div>

            <div className="bg-white rounded-xl p-6 border border-orange-100">
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                We promise:
              </h3>
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="text-orange-600 font-bold mt-1">✓</span>
                  <span><strong>Never sell or share your data</strong></span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-orange-600 font-bold mt-1">✓</span>
                  <span><strong>No ads or tracking</strong></span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-orange-600 font-bold mt-1">✓</span>
                  <span><strong>Your family's stories stay in your family</strong></span>
                </li>
              </ul>
            </div>
          </section>

          {/* Table of Contents */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Table of Contents
            </h2>
            <ol className="space-y-2 text-gray-700">
              <li>
                <a href="#section-1" className="text-coral-600 hover:underline">
                  What Information We Collect
                </a>
              </li>
              <li>
                <a href="#section-2" className="text-coral-600 hover:underline">
                  How We Use Your Information
                </a>
              </li>
              <li>
                <a href="#section-3" className="text-coral-600 hover:underline">
                  Who We Share Your Information With
                </a>
              </li>
              <li>
                <a href="#section-4" className="text-coral-600 hover:underline">
                  AI Processing and Voice Recordings
                </a>
              </li>
              <li>
                <a href="#section-5" className="text-coral-600 hover:underline">
                  Content Ownership and Your Rights
                </a>
              </li>
              <li>
                <a href="#section-6" className="text-coral-600 hover:underline">
                  Family Sharing and Collaboration
                </a>
              </li>
              <li>
                <a href="#section-7" className="text-coral-600 hover:underline">
                  Collaborative Account Data Sharing
                </a>
              </li>
              <li>
                <a href="#section-8" className="text-coral-600 hover:underline">
                  Data Security
                </a>
              </li>
              <li>
                <a href="#section-9" className="text-coral-600 hover:underline">
                  Data Retention and Deletion
                </a>
              </li>
              <li>
                <a
                  href="#section-10"
                  className="text-coral-600 hover:underline"
                >
                  Account Succession and Legacy Access
                </a>
              </li>
              <li>
                <a
                  href="#section-11"
                  className="text-coral-600 hover:underline"
                >
                  Elder User Protection
                </a>
              </li>
              <li>
                <a
                  href="#section-12"
                  className="text-coral-600 hover:underline"
                >
                  Children's Privacy
                </a>
              </li>
              <li>
                <a
                  href="#section-13"
                  className="text-coral-600 hover:underline"
                >
                  Cookies and Tracking
                </a>
              </li>
              <li>
                <a
                  href="#section-14"
                  className="text-coral-600 hover:underline"
                >
                  California Privacy Rights
                </a>
              </li>
              <li>
                <a
                  href="#section-15"
                  className="text-coral-600 hover:underline"
                >
                  Other US State Privacy Rights
                </a>
              </li>
              <li>
                <a
                  href="#section-16"
                  className="text-coral-600 hover:underline"
                >
                  International Users
                </a>
              </li>
              <li>
                <a
                  href="#section-17"
                  className="text-coral-600 hover:underline"
                >
                  Changes to This Policy
                </a>
              </li>
              <li>
                <a
                  href="#section-18"
                  className="text-coral-600 hover:underline"
                >
                  Contact Us
                </a>
              </li>
              <li>
                <a
                  href="#section-19"
                  className="text-coral-600 hover:underline"
                >
                  How to Exercise Your Rights
                </a>
              </li>
            </ol>
          </section>

          {/* Section 1 */}
          <section id="section-1" className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">
              1. What Information We Collect
            </h2>

            <h3 className="text-xl font-semibold text-gray-800 mb-3">
              Information You Provide Directly
            </h3>

            <div className="mb-6">
              <h4 className="text-lg font-semibold text-gray-800 mb-2">
                Account Information:
              </h4>
              <ul className="list-disc list-inside space-y-1 text-gray-700">
                <li>Name</li>
                <li>Email address</li>
                <li>Password (encrypted)</li>
                <li>Birth year (for timeline generation)</li>
                <li>Profile photo (optional)</li>
              </ul>
            </div>

            <div className="mb-6">
              <h4 className="text-lg font-semibold text-gray-800 mb-2">
                Story Content:
              </h4>
              <ul className="list-disc list-inside space-y-1 text-gray-700">
                <li>Voice recordings</li>
                <li>Photos you upload</li>
                <li>Story titles and descriptions</li>
                <li>Emotion tags and metadata</li>
                <li>Any text you write or edit</li>
              </ul>
            </div>

            <div className="mb-6">
              <h4 className="text-lg font-semibold text-gray-800 mb-2">
                Payment Information:
              </h4>
              <ul className="list-disc list-inside space-y-1 text-gray-700">
                <li>Billing address</li>
                <li>
                  Payment card details (processed and stored by Stripe, not by
                  us)
                </li>
              </ul>
            </div>

            <div className="mb-6">
              <h4 className="text-lg font-semibold text-gray-800 mb-2">
                Social Login Data:
              </h4>
              <ul className="list-disc list-inside space-y-1 text-gray-700">
                <li>If you sign in with Google: name, email, profile photo</li>
              </ul>
            </div>

            <div className="mb-6">
              <h4 className="text-lg font-semibold text-gray-800 mb-2">
                Collaborative Account Information:
              </h4>
              <ul className="list-disc list-inside space-y-1 text-gray-700">
                <li>
                  Names and emails of family members you invite as collaborators
                </li>
                <li>Permission levels assigned to each collaborator</li>
                <li>
                  Stories, photos, and recordings uploaded by collaborators
                </li>
                <li>Activity logs showing who added/edited what content</li>
              </ul>
            </div>

            <h3 className="text-xl font-semibold text-gray-800 mb-3 mt-8">
              Information Collected Automatically
            </h3>

            <div className="mb-6">
              <h4 className="text-lg font-semibold text-gray-800 mb-2">
                Usage Data:
              </h4>
              <ul className="list-disc list-inside space-y-1 text-gray-700">
                <li>Pages visited and features used</li>
                <li>Date/time stamps of activity</li>
                <li>Device type, browser, operating system</li>
                <li>IP address and general location (city/state level)</li>
              </ul>
            </div>

            <div className="mb-6">
              <h4 className="text-lg font-semibold text-gray-800 mb-2">
                Technical Data:
              </h4>
              <ul className="list-disc list-inside space-y-1 text-gray-700">
                <li>Session information</li>
                <li>Error reports and crash logs</li>
                <li>Performance metrics</li>
              </ul>
            </div>

            <h3 className="text-xl font-semibold text-gray-800 mb-3 mt-8">
              Information We Do NOT Collect
            </h3>
            <ul className="list-disc list-inside space-y-1 text-gray-700">
              <li>Social Security Numbers</li>
              <li>Driver's license numbers</li>
              <li>Precise GPS location</li>
              <li>
                Health/medical records (unless you choose to include them in
                your stories)
              </li>
              <li>Financial account numbers (beyond what Stripe processes)</li>
            </ul>
          </section>

          {/* Section 2 */}
          <section id="section-2" className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">
              2. How We Use Your Information
            </h2>

            <p className="text-gray-700 mb-4">We use your information to:</p>

            <div className="mb-6">
              <h3 className="text-xl font-semibold text-gray-800 mb-3">
                Provide Core Services:
              </h3>
              <ul className="list-disc list-inside space-y-1 text-gray-700">
                <li>Transcribe voice recordings using AI</li>
                <li>Generate personalized follow-up questions</li>
                <li>Create timeline and book views</li>
                <li>Enable story sharing with family</li>
              </ul>
            </div>

            <div className="mb-6">
              <h3 className="text-xl font-semibold text-gray-800 mb-3">
                Manage Your Account:
              </h3>
              <ul className="list-disc list-inside space-y-1 text-gray-700">
                <li>Create and authenticate your login</li>
                <li>Process subscription payments</li>
                <li>
                  Send service-related emails (receipts, confirmations, password
                  resets)
                </li>
                <li>Provide customer support</li>
              </ul>
            </div>

            <div className="mb-6">
              <h3 className="text-xl font-semibold text-gray-800 mb-3">
                Improve Our Service:
              </h3>
              <ul className="list-disc list-inside space-y-1 text-gray-700">
                <li>Analyze usage patterns to fix bugs</li>
                <li>Develop new features</li>
                <li>Monitor system performance and security</li>
              </ul>
            </div>

            <div className="mb-6">
              <h3 className="text-xl font-semibold text-gray-800 mb-3">
                Legal Compliance:
              </h3>
              <ul className="list-disc list-inside space-y-1 text-gray-700">
                <li>Prevent fraud and abuse</li>
                <li>Comply with legal obligations</li>
                <li>Protect our rights and safety</li>
              </ul>
            </div>

            <h3 className="text-xl font-semibold text-gray-800 mb-3 mt-8">
              We do NOT use your information to:
            </h3>
            <ul className="list-disc list-inside space-y-1 text-gray-700">
              <li>Train AI models (your stories remain private)</li>
              <li>Sell or rent to third parties</li>
              <li>Send marketing emails (unless you opt in)</li>
              <li>Track you across other websites</li>
            </ul>
          </section>

          {/* Section 3 */}
          <section id="section-3" className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">
              3. Who We Share Your Information With
            </h2>

            <h3 className="text-xl font-semibold text-gray-800 mb-4">
              Service Providers We Use
            </h3>

            <div className="mb-6 bg-gray-50 p-4 rounded-lg">
              <h4 className="text-lg font-semibold text-gray-800 mb-2">
                OpenAI (transcription and AI analysis)
              </h4>
              <ul className="list-disc list-inside space-y-1 text-gray-700">
                <li>
                  <strong>Purpose:</strong> Convert speech to text, generate
                  follow-up questions, extract themes
                </li>
                <li>
                  <strong>Data shared:</strong> Voice recordings, story text
                </li>
                <li>
                  <strong>Privacy policy:</strong>{" "}
                  <a
                    href="https://openai.com/privacy"
                    className="text-coral-600 hover:underline"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    https://openai.com/privacy
                  </a>
                </li>
              </ul>
            </div>

            <div className="mb-6 bg-gray-50 p-4 rounded-lg">
              <h4 className="text-lg font-semibold text-gray-800 mb-2">
                Stripe (payment processing)
              </h4>
              <ul className="list-disc list-inside space-y-1 text-gray-700">
                <li>
                  <strong>Purpose:</strong> Handle subscription payments
                </li>
                <li>
                  <strong>Data shared:</strong> Payment details, billing address
                </li>
                <li>
                  <strong>Privacy policy:</strong>{" "}
                  <a
                    href="https://stripe.com/privacy"
                    className="text-coral-600 hover:underline"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    https://stripe.com/privacy
                  </a>
                </li>
              </ul>
            </div>

            <div className="mb-6 bg-gray-50 p-4 rounded-lg">
              <h4 className="text-lg font-semibold text-gray-800 mb-2">
                Supabase (authentication and storage)
              </h4>
              <ul className="list-disc list-inside space-y-1 text-gray-700">
                <li>
                  <strong>Purpose:</strong> Secure login and file storage
                </li>
                <li>
                  <strong>Data shared:</strong> Account credentials, uploaded
                  files
                </li>
                <li>
                  <strong>Privacy policy:</strong>{" "}
                  <a
                    href="https://supabase.com/privacy"
                    className="text-coral-600 hover:underline"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    https://supabase.com/privacy
                  </a>
                </li>
              </ul>
            </div>

            <div className="mb-6 bg-gray-50 p-4 rounded-lg">
              <h4 className="text-lg font-semibold text-gray-800 mb-2">
                Resend (transactional emails)
              </h4>
              <ul className="list-disc list-inside space-y-1 text-gray-700">
                <li>
                  <strong>Purpose:</strong> Send account notifications and
                  receipts
                </li>
                <li>
                  <strong>Data shared:</strong> Email address, name
                </li>
                <li>
                  <strong>Privacy policy:</strong>{" "}
                  <a
                    href="https://resend.com/privacy"
                    className="text-coral-600 hover:underline"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    https://resend.com/privacy
                  </a>
                </li>
              </ul>
            </div>

            <h3 className="text-xl font-semibold text-gray-800 mb-3 mt-8">
              When We Share Your Story Content
            </h3>
            <ul className="list-disc list-inside space-y-2 text-gray-700">
              <li>
                With family members you explicitly authorize through our sharing
                features. You control who sees what.
              </li>
              <li>
                With legal authorities if required by valid legal process
                (subpoena, court order).
              </li>
              <li>
                In a business transfer if we're acquired or merged, but only
                under equivalent privacy protections.
              </li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-800 mb-3 mt-8">
              What We NEVER Do
            </h3>
            <ul className="list-disc list-inside space-y-1 text-gray-700">
              <li>Sell your personal information to anyone</li>
              <li>Share your stories publicly without your permission</li>
              <li>Use your content for advertising or marketing</li>
              <li>Provide your data to data brokers</li>
            </ul>
          </section>

          {/* Section 4 */}
          <section id="section-4" className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">
              4. AI Processing and Voice Recordings
            </h2>

            <h3 className="text-xl font-semibold text-gray-800 mb-4">
              How AI Works in HeritageWhisper
            </h3>

            <div className="mb-6">
              <h4 className="text-lg font-semibold text-gray-800 mb-2">
                Transcription:
              </h4>
              <ul className="list-disc list-inside space-y-1 text-gray-700">
                <li>Your voice recordings are sent to OpenAI's Whisper API</li>
                <li>Audio is converted to text</li>
                <li>Audio files are not stored by OpenAI</li>
              </ul>
            </div>

            <div className="mb-6">
              <h4 className="text-lg font-semibold text-gray-800 mb-2">
                Content Analysis:
              </h4>
              <p className="text-gray-700 mb-2">
                Story text is analyzed by GPT-4 to:
              </p>
              <ul className="list-disc list-inside space-y-1 text-gray-700">
                <li>
                  Generate personalized follow-up questions based on what you
                  said
                </li>
                <li>Create suggested prompts</li>
              </ul>
            </div>

            <h3 className="text-xl font-semibold text-gray-800 mb-3 mt-8">
              Your AI Content Rights
            </h3>
            <p className="text-gray-700 mb-2">You retain full control:</p>
            <ul className="list-disc list-inside space-y-1 text-gray-700 mb-4">
              <li>Edit or delete any AI-generated content</li>
              <li>Regenerate questions or insights</li>
              <li>Opt out of AI features (keeps raw transcription only)</li>
            </ul>

            <p className="text-gray-700 mb-2">We guarantee:</p>
            <ul className="list-disc list-inside space-y-1 text-gray-700 mb-4">
              <li>Your stories are NEVER used to train AI models</li>
              <li>
                OpenAI processes data per their enterprise terms (no training on
                customer data)
              </li>
              <li>
                AI-generated insights are suggestions only—you decide what's
                accurate
              </li>
            </ul>

            <p className="text-gray-700 mb-2">Data protection:</p>
            <ul className="list-disc list-inside space-y-1 text-gray-700">
              <li>All API calls are encrypted</li>
              <li>No audio is permanently stored by AI providers</li>
              <li>Processing is real-time and ephemeral</li>
            </ul>
          </section>

          {/* Section 5 */}
          <section id="section-5" className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">
              5. Content Ownership and Your Rights
            </h2>

            <h3 className="text-xl font-semibold text-gray-800 mb-4">
              You Own Your Content
            </h3>

            <ul className="list-disc list-inside space-y-2 text-gray-700 mb-6">
              <li>
                <strong>Full ownership:</strong> You retain complete copyright
                and ownership of all voice recordings, stories, photos, and text
                you create.
              </li>
              <li>
                <strong>Our limited license:</strong> You grant us permission
                to:
                <ul className="list-disc list-inside ml-6 mt-2 space-y-1">
                  <li>
                    Store and process your content to provide our services
                  </li>
                  <li>Display your content to family members you authorize</li>
                  <li>Create backups for data protection</li>
                </ul>
              </li>
              <li>
                <strong>Data portability:</strong> At any time, you can:
                <ul className="list-disc list-inside ml-6 mt-2 space-y-1">
                  <li>Download all your recordings (original audio files)</li>
                  <li>Export transcriptions as text files</li>
                  <li>Save photos and metadata</li>
                  <li>Delete individual stories or your entire account</li>
                </ul>
              </li>
            </ul>

            <p className="text-gray-700">
              <strong>No hidden claims:</strong> HeritageWhisper claims zero
              ownership rights to your content. When you delete content, we
              delete it (except for temporary backups, see Section 9).
            </p>
          </section>

          {/* Section 6 */}
          <section id="section-6" className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">
              6. Family Sharing and Collaboration
            </h2>

            <h3 className="text-xl font-semibold text-gray-800 mb-4">
              Default Privacy
            </h3>
            <p className="text-gray-700 mb-6">
              All stories are private by default. Nobody can access your content
              unless you explicitly grant permission.
            </p>

            <h3 className="text-xl font-semibold text-gray-800 mb-4">
              Permission Levels
            </h3>

            <div className="mb-6 bg-blue-50 p-4 rounded-lg">
              <h4 className="text-lg font-semibold text-gray-800 mb-2">
                View Only (Free & Premium):
              </h4>
              <ul className="list-disc list-inside space-y-1 text-gray-700">
                <li>Can view and listen to stories you've shared</li>
                <li>Can leave comments (if enabled)</li>
                <li>Cannot add, edit, or delete content</li>
                <li>Cannot invite other users</li>
              </ul>
            </div>

            <div className="mb-6 bg-green-50 p-4 rounded-lg">
              <h4 className="text-lg font-semibold text-gray-800 mb-2">
                Collaborator (Premium Only - up to 5 total family members):
              </h4>
              <ul className="list-disc list-inside space-y-1 text-gray-700">
                <li>Can add their own stories to the shared timeline</li>
                <li>Can upload photos and recordings</li>
                <li>Can edit their own stories only</li>
                <li>Cannot delete or edit your stories</li>
                <li>Cannot change account settings or billing</li>
                <li>Cannot remove other collaborators</li>
              </ul>
            </div>

            <div className="mb-6 bg-amber-50 p-4 rounded-lg">
              <h4 className="text-lg font-semibold text-gray-800 mb-2">
                Account Owner (You):
              </h4>
              <ul className="list-disc list-inside space-y-1 text-gray-700">
                <li>Full control over all content</li>
                <li>Can add/remove collaborators</li>
                <li>Can change permission levels</li>
                <li>Can edit or delete any story</li>
                <li>Controls billing and account settings</li>
              </ul>
            </div>

            <h3 className="text-xl font-semibold text-gray-800 mb-4 mt-8">
              How Collaboration Works
            </h3>

            <p className="text-gray-700 mb-2">
              When you invite a collaborator:
            </p>
            <ul className="list-disc list-inside space-y-1 text-gray-700 mb-4">
              <li>They receive an email invitation</li>
              <li>They create their own free account (or log in)</li>
              <li>
                They're linked to your timeline with the permission level you
                set
              </li>
              <li>
                Their stories appear on the shared timeline alongside yours
              </li>
            </ul>

            <p className="text-gray-700 mb-2">
              Content ownership with collaborators:
            </p>
            <ul className="list-disc list-inside space-y-1 text-gray-700 mb-4">
              <li>Each person owns the stories they create</li>
              <li>
                You cannot delete collaborators' stories without their
                permission
              </li>
              <li>Collaborators cannot delete your stories</li>
              <li>
                If you delete your account, collaborators' content remains
                intact in their own account
              </li>
              <li>
                If a collaborator leaves, their stories can either stay on your
                timeline (read-only) OR be removed entirely (their choice)
              </li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-800 mb-4 mt-8">
              Managing Collaborators
            </h3>

            <p className="text-gray-700 mb-2">You can:</p>
            <ul className="list-disc list-inside space-y-1 text-gray-700 mb-4">
              <li>Change View Only users to Collaborators (or vice versa)</li>
              <li>Remove any family member from your timeline</li>
              <li>See who added each story</li>
              <li>Filter timeline by contributor</li>
              <li>
                Require approval before collaborator stories appear (optional
                setting)
              </li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-800 mb-4 mt-8">
              Collaborator Responsibilities
            </h3>

            <p className="text-gray-700 mb-2">Collaborators must:</p>
            <ul className="list-disc list-inside space-y-1 text-gray-700">
              <li>Have their own HeritageWhisper account</li>
              <li>Agree to our Terms of Service and Privacy Policy</li>
              <li>Own rights to content they upload</li>
              <li>Respect your timeline's purpose and privacy</li>
            </ul>
          </section>

          {/* Section 7 */}
          <section id="section-7" className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">
              7. Collaborative Account Data Sharing
            </h2>

            <p className="text-gray-700 mb-4">
              When you participate in a collaborative timeline:
            </p>

            <div className="mb-6">
              <h3 className="text-xl font-semibold text-gray-800 mb-3">
                The account owner can see:
              </h3>
              <ul className="list-disc list-inside space-y-1 text-gray-700">
                <li>All stories you add to their timeline</li>
                <li>Your name and email address</li>
                <li>When you added content</li>
                <li>Your activity on the shared timeline</li>
              </ul>
            </div>

            <div className="mb-6">
              <h3 className="text-xl font-semibold text-gray-800 mb-3">
                Other collaborators can see:
              </h3>
              <ul className="list-disc list-inside space-y-1 text-gray-700">
                <li>Stories you add to the shared timeline</li>
                <li>Your name (as it appears on your stories)</li>
                <li>Not your email or account details</li>
              </ul>
            </div>

            <div className="mb-6">
              <h3 className="text-xl font-semibold text-gray-800 mb-3">
                What we share with account owners:
              </h3>
              <ul className="list-disc list-inside space-y-1 text-gray-700">
                <li>Activity logs (who added what, when)</li>
                <li>Contributor names</li>
                <li>Content metadata (file sizes, upload times)</li>
              </ul>
            </div>

            <div className="mb-6">
              <h3 className="text-xl font-semibold text-gray-800 mb-3">
                What we do NOT share:
              </h3>
              <ul className="list-disc list-inside space-y-1 text-gray-700">
                <li>Collaborators' passwords or login details</li>
                <li>Content from collaborators' personal timelines</li>
                <li>Collaborators' payment information</li>
                <li>Private messages between collaborators and support</li>
              </ul>
            </div>
          </section>

          {/* Section 8 */}
          <section id="section-8" className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">
              8. Data Security
            </h2>

            <h3 className="text-xl font-semibold text-gray-800 mb-4">
              How We Protect Your Information
            </h3>

            <div className="mb-6">
              <h4 className="text-lg font-semibold text-gray-800 mb-2">
                Encryption:
              </h4>
              <ul className="list-disc list-inside space-y-1 text-gray-700">
                <li>All data encrypted in transit (TLS/HTTPS)</li>
                <li>Files encrypted at rest in Supabase storage</li>
                <li>Passwords hashed with bcrypt</li>
              </ul>
            </div>

            <div className="mb-6">
              <h4 className="text-lg font-semibold text-gray-800 mb-2">
                Access controls:
              </h4>
              <ul className="list-disc list-inside space-y-1 text-gray-700">
                <li>Role-based permissions</li>
                <li>Multi-factor authentication available</li>
                <li>Regular security audits</li>
              </ul>
            </div>

            <div className="mb-6">
              <h4 className="text-lg font-semibold text-gray-800 mb-2">
                Infrastructure:
              </h4>
              <ul className="list-disc list-inside space-y-1 text-gray-700">
                <li>
                  Hosted on secure cloud platforms (Vercel, Render, Supabase)
                </li>
                <li>Automated backups</li>
                <li>DDoS protection</li>
              </ul>
            </div>

            <h3 className="text-xl font-semibold text-gray-800 mb-4 mt-8">
              What We Cannot Guarantee
            </h3>

            <p className="text-gray-700 mb-4">
              No internet transmission is 100% secure. While we use
              industry-standard protections, we cannot guarantee absolute
              security against:
            </p>
            <ul className="list-disc list-inside space-y-1 text-gray-700 mb-4">
              <li>Sophisticated cyberattacks</li>
              <li>Unauthorized third-party breaches</li>
              <li>Your own device being compromised</li>
            </ul>

            <p className="text-gray-700 mb-2">You should:</p>
            <ul className="list-disc list-inside space-y-1 text-gray-700 mb-4">
              <li>Use a strong, unique password</li>
              <li>Enable two-factor authentication</li>
              <li>Keep your devices secure</li>
              <li>Log out on shared devices</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-800 mb-4 mt-8">
              Data Breach Notification
            </h3>

            <p className="text-gray-700 mb-2">
              If we discover a breach affecting your personal information, we
              will:
            </p>
            <ul className="list-disc list-inside space-y-1 text-gray-700">
              <li>Notify you within 72 hours via email</li>
              <li>Explain what data was compromised</li>
              <li>Describe steps we're taking to fix it</li>
              <li>Provide guidance on protecting yourself</li>
            </ul>
          </section>

          {/* Section 9 */}
          <section id="section-9" className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">
              9. Data Retention and Deletion
            </h2>

            <h3 className="text-xl font-semibold text-gray-800 mb-4">
              While Your Account is Active
            </h3>
            <p className="text-gray-700 mb-6">
              We keep your information as long as your account exists and you're
              using our service.
            </p>

            <h3 className="text-xl font-semibold text-gray-800 mb-4">
              After You Delete Your Account
            </h3>

            <div className="mb-4">
              <h4 className="text-lg font-semibold text-gray-800 mb-2">
                Immediate deletion:
              </h4>
              <ul className="list-disc list-inside space-y-1 text-gray-700">
                <li>Your account is deactivated immediately</li>
                <li>You lose access to all content</li>
              </ul>
            </div>

            <div className="mb-4">
              <h4 className="text-lg font-semibold text-gray-800 mb-2">
                30-day grace period:
              </h4>
              <ul className="list-disc list-inside space-y-1 text-gray-700">
                <li>Backups are fully purged after 30 days</li>
                <li>
                  During this time, you can contact us to restore your account
                </li>
              </ul>
            </div>

            <div className="mb-6 bg-amber-50 p-4 rounded-lg">
              <h4 className="text-lg font-semibold text-gray-800 mb-2">
                Exception - Deceased Users:
              </h4>
              <ul className="list-disc list-inside space-y-1 text-gray-700">
                <li>
                  Accounts of deceased users are preserved for 5 years to allow
                  family members to claim access (see Section 10)
                </li>
                <li>
                  After 5 years, content is permanently deleted unless family
                  has claimed it
                </li>
              </ul>
            </div>

            <h3 className="text-xl font-semibold text-gray-800 mb-4 mt-8">
              Legal Retention
            </h3>

            <p className="text-gray-700 mb-2">
              We may retain some information longer if required by:
            </p>
            <ul className="list-disc list-inside space-y-1 text-gray-700 mb-4">
              <li>Law enforcement requests</li>
              <li>Pending litigation</li>
              <li>Tax/accounting regulations (transaction records only)</li>
            </ul>

            <p className="text-gray-700 mb-2">What we keep:</p>
            <ul className="list-disc list-inside space-y-1 text-gray-700">
              <li>Payment history: 7 years (IRS requirement)</li>
              <li>Support tickets: 3 years</li>
              <li>Fraud investigations: As needed</li>
            </ul>
          </section>

          {/* Section 10 */}
          <section id="section-10" className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">
              10. Account Succession and Legacy Access
            </h2>

            <h3 className="text-xl font-semibold text-gray-800 mb-4">
              Designating a Successor
            </h3>

            <p className="text-gray-700 mb-4">
              You may designate a trusted person to access your account after
              your death or incapacity.
            </p>

            <p className="text-gray-700 mb-2">How to set it up:</p>
            <ul className="list-disc list-inside space-y-1 text-gray-700 mb-6">
              <li>
                Email privacy@heritagewhisper.com with "Legacy Access Request"
              </li>
              <li>Provide successor's name and relationship</li>
              <li>Provide successor's contact information</li>
              <li>We'll confirm in writing</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-800 mb-4">
              How Successors Gain Access
            </h3>

            <div className="mb-4">
              <h4 className="text-lg font-semibold text-gray-800 mb-2">
                Required documentation:
              </h4>
              <ul className="list-disc list-inside space-y-1 text-gray-700">
                <li>Death certificate or court order showing incapacity</li>
                <li>Government-issued ID of successor</li>
                <li>Proof of relationship (if not legally documented)</li>
              </ul>
            </div>

            <div className="mb-4">
              <h4 className="text-lg font-semibold text-gray-800 mb-2">
                What successors can do:
              </h4>
              <ul className="list-disc list-inside space-y-1 text-gray-700">
                <li>View all your stories</li>
                <li>Download recordings and transcriptions</li>
                <li>Share with other family members</li>
                <li>Continue your subscription (optional)</li>
              </ul>
            </div>

            <div className="mb-6">
              <h4 className="text-lg font-semibold text-gray-800 mb-2">
                What successors cannot do:
              </h4>
              <ul className="list-disc list-inside space-y-1 text-gray-700">
                <li>Edit your original recordings</li>
                <li>Delete content without court order</li>
                <li>Claim content as their own</li>
              </ul>
            </div>

            <h3 className="text-xl font-semibold text-gray-800 mb-4 mt-8">
              Unclaimed Accounts
            </h3>

            <p className="text-gray-700 mb-2">
              If no successor is designated and we're notified of your death:
            </p>
            <ul className="list-disc list-inside space-y-1 text-gray-700">
              <li>Account is locked but preserved for 5 years</li>
              <li>Family members can claim access with proper documentation</li>
              <li>After 5 years, account is deleted unless claimed</li>
            </ul>
          </section>

          {/* Section 11 */}
          <section id="section-11" className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">
              11. Elder User Protection
            </h2>

            <p className="text-gray-700 mb-6">
              We designed HeritageWhisper with senior users in mind. We take
              additional steps to protect our older users.
            </p>

            <h3 className="text-xl font-semibold text-gray-800 mb-4">
              Monitoring for Exploitation
            </h3>

            <p className="text-gray-700 mb-2">
              We may flag accounts for review if we detect:
            </p>
            <ul className="list-disc list-inside space-y-1 text-gray-700 mb-6">
              <li>Sudden sharing of all stories with a new user</li>
              <li>Mass deletions shortly after family member gains access</li>
              <li>Unusual payment changes or subscription cancellations</li>
              <li>Multiple failed login attempts from new locations</li>
              <li>Account settings changed dramatically in short time</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-800 mb-4">
              Collaborative Timeline Monitoring
            </h3>

            <p className="text-gray-700 mb-2">
              For collaborative accounts with senior users, we monitor for:
            </p>
            <ul className="list-disc list-inside space-y-1 text-gray-700 mb-6">
              <li>
                Sudden addition of collaborators followed by content changes
              </li>
              <li>Mass story deletions after new collaborator joins</li>
              <li>Account owner losing control of their timeline</li>
              <li>Content added without account owner's knowledge</li>
              <li>Permission changes the owner didn't initiate</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-800 mb-4">
              What We Do If Concerned
            </h3>

            <p className="text-gray-700 mb-2">
              If we suspect exploitation or account compromise:
            </p>
            <ul className="list-disc list-inside space-y-1 text-gray-700 mb-4">
              <li>We temporarily freeze account changes</li>
              <li>We contact you at your registered email</li>
              <li>We contact your designated trusted contact (if provided)</li>
              <li>We require identity verification to unlock</li>
            </ul>

            <p className="text-gray-700 mb-2">
              If we suspect exploitation through collaboration features:
            </p>
            <ul className="list-disc list-inside space-y-1 text-gray-700 mb-6">
              <li>We freeze all collaborator permissions</li>
              <li>We contact the account owner directly (phone if possible)</li>
              <li>We may temporarily disable story additions</li>
              <li>We require identity verification to unlock</li>
            </ul>

            <p className="text-gray-700 mb-6">
              This is NOT to restrict your access—it's to ensure the account
              changes reflect your actual wishes, not coercion or fraud.
            </p>

            <h3 className="text-xl font-semibold text-gray-800 mb-4">
              Trusted Contact Option
            </h3>

            <p className="text-gray-700 mb-2">
              You can designate a "trusted contact" (adult child, lawyer,
              friend) who we can notify if:
            </p>
            <ul className="list-disc list-inside space-y-1 text-gray-700 mb-4">
              <li>We detect suspicious activity</li>
              <li>You haven't logged in for 6+ months</li>
              <li>We need to verify account security</li>
            </ul>

            <p className="text-gray-700 mb-2">Trusted contacts cannot:</p>
            <ul className="list-disc list-inside space-y-1 text-gray-700">
              <li>Access your account without proper succession process</li>
              <li>Make changes to your settings</li>
              <li>View your stories</li>
            </ul>
          </section>

          {/* Section 12 */}
          <section id="section-12" className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">
              12. Children's Privacy
            </h2>

            <h3 className="text-xl font-semibold text-gray-800 mb-4">
              Age Restrictions
            </h3>

            <ul className="list-disc list-inside space-y-2 text-gray-700 mb-6">
              <li>
                <strong>Under 13:</strong> We do not knowingly collect
                information from children under 13. If we discover we've
                collected such information, we will delete it immediately.
              </li>
              <li>
                <strong>Ages 13-17:</strong> Minors aged 13-17 may use
                HeritageWhisper only with verifiable parental consent. Parents
                must create the account and maintain control.
              </li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-800 mb-4">
              If You're a Parent
            </h3>

            <p className="text-gray-700">
              If you believe your child under 13 has provided information to us,
              contact privacy@heritagewhisper.com immediately and we will delete
              it.
            </p>
          </section>

          {/* Section 13 */}
          <section id="section-13" className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">
              13. Cookies and Tracking
            </h2>

            <h3 className="text-xl font-semibold text-gray-800 mb-4">
              Cookies We Use
            </h3>

            <div className="mb-4">
              <h4 className="text-lg font-semibold text-gray-800 mb-2">
                Essential cookies (required for service to work):
              </h4>
              <ul className="list-disc list-inside space-y-1 text-gray-700">
                <li>Session authentication</li>
                <li>Security tokens</li>
                <li>User preferences</li>
              </ul>
            </div>

            <div className="mb-6">
              <h4 className="text-lg font-semibold text-gray-800 mb-2">
                Analytics cookies (optional, you can disable):
              </h4>
              <ul className="list-disc list-inside space-y-1 text-gray-700">
                <li>Page visit tracking</li>
                <li>Feature usage statistics</li>
                <li>Error reporting</li>
              </ul>
            </div>

            <h3 className="text-xl font-semibold text-gray-800 mb-4">
              We Do NOT Use
            </h3>
            <ul className="list-disc list-inside space-y-1 text-gray-700 mb-6">
              <li>Third-party advertising cookies</li>
              <li>Cross-site tracking</li>
              <li>Social media tracking pixels</li>
              <li>Behavioral targeting</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-800 mb-4">
              How to Control Cookies
            </h3>

            <p className="text-gray-700 mb-2">
              <strong>Browser settings:</strong> Most browsers let you:
            </p>
            <ul className="list-disc list-inside space-y-1 text-gray-700 mb-4">
              <li>Block all cookies</li>
              <li>Delete existing cookies</li>
              <li>Get warnings before cookies are set</li>
            </ul>

            <p className="text-gray-700 mb-6">
              <strong>Impact of blocking:</strong> If you block essential
              cookies, you won't be able to log in or use core features.
            </p>

            <h3 className="text-xl font-semibold text-gray-800 mb-4">
              Do Not Track Signals
            </h3>

            <p className="text-gray-700">
              We respect Do Not Track (DNT) browser settings. If your browser
              sends a DNT signal, we disable optional analytics.
            </p>
          </section>

          {/* Section 14 */}
          <section id="section-14" className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">
              14. California Privacy Rights
            </h2>

            <h3 className="text-xl font-semibold text-gray-800 mb-4">
              Your California Rights (CCPA/CPRA)
            </h3>

            <p className="text-gray-700 mb-2">
              California residents have specific rights regarding personal
              information:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-700 mb-6">
              <li>
                <strong>Right to Know:</strong> Request details about personal
                information we've collected in the past 12 months
              </li>
              <li>
                <strong>Right to Delete:</strong> Request deletion of your
                personal information
              </li>
              <li>
                <strong>Right to Correct:</strong> Fix inaccuracies in your data
              </li>
              <li>
                <strong>Right to Opt-Out:</strong> We don't sell or share for
                advertising, so nothing to opt out of
              </li>
              <li>
                <strong>Right to Non-Discrimination:</strong> We won't treat you
                differently for exercising your rights
              </li>
              <li>
                <strong>Right to Limit Sensitive Data Use:</strong> Request we
                only use sensitive information for essential services
              </li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-800 mb-4">
              What Personal Information We Collect (Last 12 Months)
            </h3>

            <div className="overflow-x-auto mb-6">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                      Category
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                      Examples
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                      Collected?
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  <tr>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      Identifiers
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      Name, email, account ID
                    </td>
                    <td className="px-4 py-3 text-sm text-green-600 font-semibold">
                      YES
                    </td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      Personal Records
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      Birth year, billing address
                    </td>
                    <td className="px-4 py-3 text-sm text-green-600 font-semibold">
                      YES
                    </td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      Protected Classifications
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      Age derived from birth year
                    </td>
                    <td className="px-4 py-3 text-sm text-green-600 font-semibold">
                      YES
                    </td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      Commercial Information
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      Subscription status, payment history
                    </td>
                    <td className="px-4 py-3 text-sm text-green-600 font-semibold">
                      YES
                    </td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      Internet Activity
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      Usage logs, features accessed
                    </td>
                    <td className="px-4 py-3 text-sm text-green-600 font-semibold">
                      YES
                    </td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      Geolocation
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      City/state from IP address
                    </td>
                    <td className="px-4 py-3 text-sm text-green-600 font-semibold">
                      YES
                    </td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      Audio/Visual
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      Voice recordings, photos
                    </td>
                    <td className="px-4 py-3 text-sm text-green-600 font-semibold">
                      YES
                    </td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      Professional Information
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      Not collected
                    </td>
                    <td className="px-4 py-3 text-sm text-red-600 font-semibold">
                      NO
                    </td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      Education Information
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      Not collected
                    </td>
                    <td className="px-4 py-3 text-sm text-red-600 font-semibold">
                      NO
                    </td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      Inferences
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      Not collected
                    </td>
                    <td className="px-4 py-3 text-sm text-red-600 font-semibold">
                      NO
                    </td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      Sensitive Personal Information
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      Story content, payment details
                    </td>
                    <td className="px-4 py-3 text-sm text-green-600 font-semibold">
                      YES
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <h3 className="text-xl font-semibold text-gray-800 mb-4">
              How to Exercise California Rights
            </h3>

            <p className="text-gray-700 mb-2">
              <strong>Request form:</strong> Email privacy@heritagewhisper.com
              with subject "California Privacy Request"
            </p>

            <p className="text-gray-700 mb-2">Include:</p>
            <ul className="list-disc list-inside space-y-1 text-gray-700 mb-4">
              <li>Your full name</li>
              <li>Account email address</li>
              <li>Specific request (access, delete, correct)</li>
              <li>Verification info (we'll confirm your identity)</li>
            </ul>

            <ul className="list-disc list-inside space-y-1 text-gray-700 mb-6">
              <li>
                <strong>Response time:</strong> We'll respond within 45 days
                (may extend to 90 for complex requests)
              </li>
              <li>
                <strong>Authorized agents:</strong> You may designate someone to
                make requests on your behalf (requires written authorization)
              </li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-800 mb-4">
              California "Shine the Light" Law
            </h3>

            <p className="text-gray-700">
              Once per year, California residents can request a list of third
              parties we've shared personal information with for their direct
              marketing. We don't share for marketing purposes, so this list
              will be empty.
            </p>
          </section>

          {/* Section 15 */}
          <section id="section-15" className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">
              15. Other US State Privacy Rights
            </h2>

            <p className="text-gray-700 mb-4">
              If you're a resident of Colorado, Connecticut, Delaware, Florida,
              Indiana, Iowa, Kentucky, Maryland, Minnesota, Montana, Nebraska,
              New Hampshire, New Jersey, Oregon, Rhode Island, Tennessee, Texas,
              Utah, or Virginia, you have similar rights to California
              residents:
            </p>

            <div className="mb-6">
              <h3 className="text-xl font-semibold text-gray-800 mb-3">
                Rights include:
              </h3>
              <ul className="list-disc list-inside space-y-1 text-gray-700">
                <li>Access your personal information</li>
                <li>Correct inaccuracies</li>
                <li>Delete your data</li>
                <li>
                  Opt out of profiling/targeted ads (not applicable—we don't do
                  this)
                </li>
                <li>Data portability</li>
              </ul>
            </div>

            <p className="text-gray-700 mb-4">
              <strong>How to exercise:</strong> Same process as California
              (email privacy@heritagewhisper.com)
            </p>

            <p className="text-gray-700">
              <strong>Appeal process:</strong> If we deny your request, you may
              appeal by emailing the same address. We'll respond within 30 days.
              If denied again, you may contact your state attorney general.
            </p>
          </section>

          {/* Section 16 */}
          <section id="section-16" className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">
              16. International Users
            </h2>

            <h3 className="text-xl font-semibold text-gray-800 mb-4">
              US-Based Service
            </h3>
            <p className="text-gray-700 mb-6">
              HeritageWhisper is operated from the United States. All data is
              stored on US-based servers.
            </p>

            <h3 className="text-xl font-semibold text-gray-800 mb-4">
              Not Available in EU/UK
            </h3>
            <p className="text-gray-700 mb-6">
              We do not currently offer services to residents of the European
              Union or United Kingdom. If you're located in these regions,
              please do not use HeritageWhisper.
            </p>

            <h3 className="text-xl font-semibold text-gray-800 mb-4">
              Other International Users
            </h3>
            <p className="text-gray-700 mb-2">
              If you use HeritageWhisper from outside the US:
            </p>
            <ul className="list-disc list-inside space-y-1 text-gray-700 mb-4">
              <li>Your data will be transferred to and stored in the US</li>
              <li>US privacy laws will apply</li>
              <li>You consent to this transfer by using our service</li>
            </ul>

            <p className="text-gray-700">
              <strong>Note:</strong> Your country may have stronger privacy
              protections than US law provides. By using our service, you
              acknowledge this difference.
            </p>
          </section>

          {/* Section 17 */}
          <section id="section-17" className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">
              17. Changes to This Policy
            </h2>

            <h3 className="text-xl font-semibold text-gray-800 mb-4">
              When We Update This Policy
            </h3>

            <p className="text-gray-700 mb-2">
              We may update this Privacy Policy to:
            </p>
            <ul className="list-disc list-inside space-y-1 text-gray-700 mb-6">
              <li>Reflect new features or services</li>
              <li>Comply with new laws</li>
              <li>Improve clarity</li>
            </ul>

            <p className="text-gray-700 mb-2">
              We will notify you of material changes by:
            </p>
            <ul className="list-disc list-inside space-y-1 text-gray-700 mb-6">
              <li>Email to your registered address</li>
              <li>Prominent notice on our website</li>
              <li>Update to "Last Updated" date at top of policy</li>
            </ul>

            <p className="text-gray-700 mb-4">
              Your continued use of HeritageWhisper after changes constitutes
              acceptance of the updated policy.
            </p>

            <p className="text-gray-700">
              If you disagree with changes, you must stop using the service and
              may request account deletion.
            </p>
          </section>

          {/* Section 18 */}
          <section id="section-18" className="mb-12 bg-gray-100 p-8 rounded-lg">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">
              18. Contact Us
            </h2>

            <div className="space-y-4 text-gray-700">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">
                  Privacy questions or concerns:
                </h3>
                <p>
                  Email:{" "}
                  <a
                    href="mailto:privacy@heritagewhisper.com"
                    className="text-coral-600 hover:underline"
                  >
                    privacy@heritagewhisper.com
                  </a>
                </p>
                <p>
                  Mail: Heritage Whisper LLC, 522 W Riverside Ave, Suite N,
                  Spokane, WA 99201, United States
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-2">
                  Customer support:
                </h3>
                <p>
                  Email:{" "}
                  <a
                    href="mailto:support@heritagewhisper.com"
                    className="text-coral-600 hover:underline"
                  >
                    support@heritagewhisper.com
                  </a>
                </p>
              </div>

              <p className="text-sm">
                We respond to privacy inquiries within 5 business days.
              </p>
            </div>
          </section>

          {/* Section 19 */}
          <section id="section-19" className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">
              19. How to Exercise Your Rights
            </h2>

            <h3 className="text-xl font-semibold text-gray-800 mb-4">
              Access, Correct, or Delete Your Data
            </h3>

            <div className="mb-6">
              <h4 className="text-lg font-semibold text-gray-800 mb-2">
                Online (fastest):
              </h4>
              <ul className="list-disc list-inside space-y-1 text-gray-700">
                <li>Log into your account</li>
                <li>Go to Settings &gt; Privacy</li>
                <li>Request data download, corrections, or deletion</li>
              </ul>
            </div>

            <div className="mb-6">
              <h4 className="text-lg font-semibold text-gray-800 mb-2">
                Email:
              </h4>
              <p className="text-gray-700 mb-2">
                Send request to privacy@heritagewhisper.com with:
              </p>
              <ul className="list-disc list-inside space-y-1 text-gray-700">
                <li>Subject: "Privacy Rights Request"</li>
                <li>Your full name and account email</li>
                <li>Specific request (access/correct/delete)</li>
                <li>For deletion: Confirm you understand this is permanent</li>
              </ul>
            </div>

            <div className="mb-6">
              <h4 className="text-lg font-semibold text-gray-800 mb-2">
                Mail:
              </h4>
              <p className="text-gray-700">
                Send written request to address in Section 18
              </p>
            </div>

            <div className="mb-6 bg-blue-50 p-4 rounded-lg">
              <h4 className="text-lg font-semibold text-gray-800 mb-2">
                For collaborative accounts:
              </h4>
              <ul className="list-disc list-inside space-y-1 text-gray-700">
                <li>You can request/delete only your own data</li>
                <li>Account owner controls overall timeline access</li>
                <li>
                  Each collaborator controls their own contributed content
                </li>
              </ul>
            </div>

            <h3 className="text-xl font-semibold text-gray-800 mb-4 mt-8">
              Verification Process
            </h3>

            <p className="text-gray-700 mb-2">
              To protect your privacy, we must verify your identity before
              processing requests:
            </p>
            <ul className="list-disc list-inside space-y-1 text-gray-700 mb-6">
              <li>For online requests: You must be logged into your account</li>
              <li>
                For email/mail requests: We may ask for:
                <ul className="list-disc list-inside ml-6 mt-2 space-y-1">
                  <li>Government-issued ID</li>
                  <li>Answer to security question</li>
                  <li>Confirmation from registered email address</li>
                </ul>
              </li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-800 mb-4">
              Response Timeline
            </h3>
            <ul className="list-disc list-inside space-y-1 text-gray-700 mb-6">
              <li>Access requests: Within 45 days</li>
              <li>Correction requests: Within 30 days</li>
              <li>
                Deletion requests: Within 30 days (plus 30-day backup purge)
              </li>
              <li>
                California/state-specific requests: Per applicable law timelines
              </li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-800 mb-4">
              No Fee (Usually)
            </h3>

            <p className="text-gray-700 mb-2">
              We don't charge for reasonable requests. However, if you make
              excessive or repetitive requests, we may:
            </p>
            <ul className="list-disc list-inside space-y-1 text-gray-700">
              <li>Charge a reasonable administrative fee</li>
              <li>Refuse the request if clearly unfounded</li>
            </ul>
          </section>

          {/* Footer */}
          <section className="mt-12 pt-8 border-t border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Document Version Control
            </h3>
            <p className="text-gray-600 text-sm">
              Version 1.0: October 4, 2025 (Initial publication)
            </p>
            <p className="text-gray-600 text-sm">
              Effective Date: October 4, 2025
            </p>
            <p className="text-gray-600 text-sm mt-2">
              Heritage Whisper LLC reserves the right to update this document.
              Check the "Last Updated" date at the top for the most current
              version.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
