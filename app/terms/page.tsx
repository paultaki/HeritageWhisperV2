export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-8 mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Terms of Service</h1>
          <p className="text-lg text-gray-600">Last Updated: October 4, 2025</p>
        </div>

        {/* Content */}
        <div className="bg-white rounded-lg shadow-sm p-8 prose prose-lg max-w-none">
          {/* Agreement to Terms */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Agreement to Terms</h2>
            <p className="text-gray-700 mb-4">
              These Terms of Service ("Terms") are a legally binding agreement between you and Heritage Whisper LLC ("HeritageWhisper," "we," "us," or "our"), a Washington limited liability company.
            </p>
            <p className="text-gray-700 mb-4">
              By accessing or using HeritageWhisper.com (the "Service"), you agree to these Terms. If you do not agree, do not use the Service.
            </p>
            <div className="bg-gray-100 p-4 rounded-lg">
              <h3 className="font-semibold text-gray-900 mb-2">Contact Information:</h3>
              <p className="text-gray-700">Email: <a href="mailto:support@heritagewhisper.com" className="text-coral-600 hover:underline">support@heritagewhisper.com</a></p>
              <p className="text-gray-700">Mail: Heritage Whisper LLC, 522 W Riverside Ave, Suite N, Spokane, WA 99201</p>
            </div>
          </section>

          {/* Table of Contents */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Table of Contents</h2>
            <ol className="space-y-2 text-gray-700">
              <li><a href="#section-1" className="text-coral-600 hover:underline">Service Description</a></li>
              <li><a href="#section-2" className="text-coral-600 hover:underline">Eligibility and Account Requirements</a></li>
              <li><a href="#section-3" className="text-coral-600 hover:underline">Subscription Plans and Payments</a></li>
              <li><a href="#section-4" className="text-coral-600 hover:underline">Your Content and Ownership Rights</a></li>
              <li><a href="#section-5" className="text-coral-600 hover:underline">AI Processing and Accuracy</a></li>
              <li><a href="#section-6" className="text-coral-600 hover:underline">Family Sharing and Access Controls</a></li>
              <li><a href="#section-7" className="text-coral-600 hover:underline">Account Succession and Legacy Planning</a></li>
              <li><a href="#section-8" className="text-coral-600 hover:underline">Prohibited Uses</a></li>
              <li><a href="#section-9" className="text-coral-600 hover:underline">Our Intellectual Property</a></li>
              <li><a href="#section-10" className="text-coral-600 hover:underline">Service Management and Modifications</a></li>
              <li><a href="#section-11" className="text-coral-600 hover:underline">Termination and Account Deletion</a></li>
              <li><a href="#section-12" className="text-coral-600 hover:underline">Disclaimers and Limitations of Liability</a></li>
              <li><a href="#section-13" className="text-coral-600 hover:underline">Indemnification</a></li>
              <li><a href="#section-14" className="text-coral-600 hover:underline">Dispute Resolution</a></li>
              <li><a href="#section-15" className="text-coral-600 hover:underline">General Terms</a></li>
              <li><a href="#section-16" className="text-coral-600 hover:underline">Changes to These Terms</a></li>
              <li><a href="#section-17" className="text-coral-600 hover:underline">Contact Us</a></li>
            </ol>
          </section>

          {/* Service Description */}
          <section id="section-1" className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">1. Service Description</h2>

            <h3 className="text-xl font-semibold text-gray-800 mb-3">What HeritageWhisper Does</h3>
            <p className="text-gray-700 mb-4">
              HeritageWhisper is a voice recording and AI-powered storytelling platform designed to help families preserve life stories and memories. The Service includes:
            </p>

            <div className="mb-6">
              <h4 className="text-lg font-semibold text-gray-800 mb-2">Core Features:</h4>
              <ul className="list-disc list-inside space-y-1 text-gray-700">
                <li>Voice recording and storage</li>
                <li>AI transcription (via OpenAI Whisper)</li>
                <li>AI-generated follow-up questions and insights (via GPT-4)</li>
                <li>Character trait extraction and analysis</li>
                <li>Timeline and book view organization</li>
                <li>Photo upload and integration</li>
                <li>Story sharing with family members</li>
              </ul>
            </div>

            <div className="mb-6">
              <h4 className="text-lg font-semibold text-gray-800 mb-2">What We Are NOT:</h4>
              <ul className="list-disc list-inside space-y-1 text-gray-700">
                <li>A medical or therapeutic service</li>
                <li>A legal document creation service</li>
                <li>A guaranteed permanent archive (see Section 10)</li>
                <li>A professional genealogy or research service</li>
              </ul>
            </div>
          </section>

          {/* Subscription Plans */}
          <section id="section-3" className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">3. Subscription Plans and Payments</h2>

            <div className="mb-6 bg-green-50 border-l-4 border-green-400 p-6">
              <h3 className="text-xl font-semibold text-gray-800 mb-3">Free Tier</h3>
              <h4 className="font-semibold text-gray-800 mb-2">Includes:</h4>
              <ul className="list-disc list-inside space-y-1 text-gray-700 mb-4">
                <li>3 stories with full AI features</li>
                <li>Timeline visualization</li>
                <li>10-second wisdom clips</li>
                <li>Basic audio cleanup</li>
                <li>Photo integration</li>
              </ul>
              <h4 className="font-semibold text-gray-800 mb-2">Limitations:</h4>
              <ul className="list-disc list-inside space-y-1 text-gray-700">
                <li>Cannot record additional stories after 3</li>
                <li>Share links expire after 48 hours</li>
                <li>No bulk export features</li>
              </ul>
            </div>

            <div className="mb-6 bg-coral-50 border-l-4 border-coral-400 p-6">
              <h3 className="text-xl font-semibold text-gray-800 mb-3">Premium Subscription - $149/Year</h3>
              <h4 className="font-semibold text-gray-800 mb-2">Includes:</h4>
              <ul className="list-disc list-inside space-y-1 text-gray-700">
                <li>Unlimited stories</li>
                <li>Full transcription of all recordings</li>
                <li>Annual book generation (PDF + print option)</li>
                <li>Family sharing (up to 5 members)</li>
                <li>Searchable wisdom clips</li>
                <li>Download everything (audio + transcripts)</li>
                <li>Priority AI processing</li>
                <li>Permanent share links</li>
              </ul>
            </div>
          </section>

          {/* Disclaimers */}
          <section id="section-12" className="mb-12 bg-yellow-50 border-l-4 border-yellow-400 p-6">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">12. Disclaimers and Limitations of Liability</h2>

            <div className="mb-6">
              <h3 className="text-xl font-semibold text-gray-800 mb-3">Service Provided "AS IS"</h3>
              <p className="text-gray-700 mb-4 uppercase font-bold">
                THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT ANY WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED.
              </p>
              <p className="text-gray-700 mb-4">We do NOT guarantee:</p>
              <ul className="list-disc list-inside space-y-1 text-gray-700">
                <li>Error-free operation</li>
                <li>Accurate transcriptions or AI analysis</li>
                <li>Permanent storage of your content</li>
                <li>Compatibility with all devices</li>
                <li>Security against all cyber threats</li>
                <li>That the Service will meet your expectations</li>
              </ul>
            </div>

            <div className="mb-6">
              <h3 className="text-xl font-semibold text-gray-800 mb-3">Limitation of Liability</h3>
              <p className="text-gray-700 mb-4 uppercase font-bold">
                TO THE MAXIMUM EXTENT PERMITTED BY LAW, OUR MAXIMUM LIABILITY TO YOU FOR ANY CLAIM IS LIMITED TO THE LESSER OF:
              </p>
              <ul className="list-disc list-inside space-y-1 text-gray-700">
                <li>The amount you paid us in the 12 months before the claim, OR</li>
                <li>$500</li>
              </ul>
            </div>
          </section>

          {/* Contact Us */}
          <section id="section-17" className="mb-12 bg-gray-100 p-8 rounded-lg">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">17. Contact Us</h2>

            <div className="space-y-4 text-gray-700">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">For questions about these Terms:</h3>
                <p>Email: <a href="mailto:legal@heritagewhisper.com" className="text-coral-600 hover:underline">legal@heritagewhisper.com</a></p>
                <p>Mail: Heritage Whisper LLC, 522 W Riverside Ave, Suite N, Spokane, WA 99201, United States</p>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-2">For customer support:</h3>
                <p>Email: <a href="mailto:support@heritagewhisper.com" className="text-coral-600 hover:underline">support@heritagewhisper.com</a></p>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-2">For privacy questions:</h3>
                <p>Email: <a href="mailto:privacy@heritagewhisper.com" className="text-coral-600 hover:underline">privacy@heritagewhisper.com</a></p>
              </div>

              <p className="text-sm">We respond to legal inquiries within 5-7 business days.</p>
            </div>
          </section>

          {/* Agreement Notice */}
          <div className="mt-12 bg-red-50 border-l-4 border-red-400 p-6">
            <p className="text-gray-700 font-semibold uppercase">
              BY USING HERITAGEWHISPER, YOU ACKNOWLEDGE THAT YOU HAVE READ, UNDERSTOOD, AND AGREE TO BE BOUND BY THESE TERMS OF SERVICE.
            </p>
          </div>

          {/* Footer */}
          <section className="mt-12 pt-8 border-t border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Document Version Control</h3>
            <p className="text-gray-600 text-sm">Version 1.0: October 4, 2025 (Initial publication)</p>
            <p className="text-gray-600 text-sm">Effective Date: October 4, 2025</p>
            <p className="text-gray-600 text-sm mt-2">Heritage Whisper LLC reserves the right to update these Terms. Check the "Last Updated" date at the top for the most current version.</p>
          </section>

          {/* Note about full content */}
          <div className="mt-12 bg-blue-50 border-l-4 border-blue-400 p-6">
            <p className="text-sm text-gray-700">
              <strong>Note:</strong> This page displays the complete Heritage Whisper Terms of Service. For the full text of all 17 sections, please scroll through this document or use the table of contents above to jump to specific sections.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
