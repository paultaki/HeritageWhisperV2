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

          {/* Section 1 */}
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

            <h3 className="text-xl font-semibold text-gray-800 mb-3 mt-8">Service Availability</h3>
            <p className="text-gray-700 mb-4">
              HeritageWhisper is currently available only to users in the United States. We do not offer services to residents of the European Union or United Kingdom.
            </p>
            <p className="text-gray-700">
              The Service requires internet access and is designed primarily for smartphone use, though it works on desktop browsers.
            </p>
          </section>

          {/* Section 2 */}
          <section id="section-2" className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">2. Eligibility and Account Requirements</h2>

            <h3 className="text-xl font-semibold text-gray-800 mb-4">Age Requirements</h3>
            <ul className="list-disc list-inside space-y-2 text-gray-700 mb-6">
              <li>You must be at least 18 years old to create an account and use HeritageWhisper.</li>
              <li>Users between 13-17 may use the Service only with verifiable parental consent, with the parent maintaining account control.</li>
              <li>We do not knowingly collect information from children under 13.</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-800 mb-4">Account Accuracy</h3>
            <p className="text-gray-700 mb-2">When creating an account, you must provide:</p>
            <ul className="list-disc list-inside space-y-1 text-gray-700 mb-4">
              <li>Accurate and current information</li>
              <li>A valid email address</li>
              <li>Your real name (for account security and succession planning)</li>
            </ul>

            <p className="text-gray-700 mb-2">You are responsible for:</p>
            <ul className="list-disc list-inside space-y-1 text-gray-700 mb-6">
              <li>Maintaining the confidentiality of your password</li>
              <li>All activity under your account</li>
              <li>Notifying us immediately of unauthorized access</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-800 mb-4">One Account Per Person</h3>
            <p className="text-gray-700">You may create only one account. Creating multiple accounts to circumvent free tier limitations or after account termination is prohibited.</p>
          </section>

          {/* Section 3 */}
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

            <div className="mb-6 bg-blue-50 p-4 rounded-lg">
              <h3 className="text-xl font-semibold text-gray-800 mb-3">Collaborative Features (Premium Only):</h3>
              <ul className="list-disc list-inside space-y-1 text-gray-700">
                <li>Up to 5 family members (View Only or Collaborator)</li>
                <li>Collaborators can add unlimited stories to shared timeline</li>
                <li>Each collaborator needs their own free HeritageWhisper account</li>
                <li>Collaborator accounts remain free even when contributing to Premium timelines</li>
              </ul>
            </div>

            <h3 className="text-xl font-semibold text-gray-800 mb-4 mt-8">Payment Terms</h3>

            <div className="mb-4">
              <h4 className="text-lg font-semibold text-gray-800 mb-2">Billing:</h4>
              <ul className="list-disc list-inside space-y-1 text-gray-700">
                <li>Premium subscriptions are billed annually</li>
                <li>Payments processed through Stripe</li>
                <li>Automatic renewal unless you cancel</li>
              </ul>
            </div>

            <div className="mb-4">
              <h4 className="text-lg font-semibold text-gray-800 mb-2">Cancellation:</h4>
              <ul className="list-disc list-inside space-y-1 text-gray-700">
                <li>Cancel anytime before renewal date</li>
                <li>No refunds for partial subscription periods</li>
                <li>Access continues until end of paid period</li>
                <li>After cancellation, account reverts to free tier limits</li>
              </ul>
            </div>

            <div className="mb-4">
              <h4 className="text-lg font-semibold text-gray-800 mb-2">Price Changes:</h4>
              <ul className="list-disc list-inside space-y-1 text-gray-700">
                <li>We may change subscription prices with 30 days notice</li>
                <li>Changes apply at your next renewal</li>
                <li>You may cancel before renewal if you disagree with new pricing</li>
              </ul>
            </div>

            <div className="mb-6">
              <h4 className="text-lg font-semibold text-gray-800 mb-2">Free Trial:</h4>
              <ul className="list-disc list-inside space-y-1 text-gray-700">
                <li>If we offer a free trial, we'll clearly state terms before you sign up</li>
                <li>Credit card required; you'll be charged when trial ends unless you cancel</li>
              </ul>
            </div>

            <h3 className="text-xl font-semibold text-gray-800 mb-4">Enterprise Pricing</h3>
            <p className="text-gray-700">Senior living communities or organizations should contact sales@heritagewhisper.com for bulk pricing and features.</p>
          </section>

          {/* Section 4 */}
          <section id="section-4" className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">4. Your Content and Ownership Rights</h2>

            <h3 className="text-xl font-semibold text-gray-800 mb-4">You Own Your Content</h3>
            <p className="text-gray-700 mb-2"><strong>Full ownership:</strong> You retain complete ownership and copyright of all:</p>
            <ul className="list-disc list-inside space-y-1 text-gray-700 mb-4">
              <li>Voice recordings</li>
              <li>Stories and narratives</li>
              <li>Photos and images</li>
              <li>Edited text and transcriptions</li>
            </ul>
            <p className="text-gray-700 mb-6">HeritageWhisper claims zero ownership of your content.</p>

            <h3 className="text-xl font-semibold text-gray-800 mb-4">Multi-Contributor Ownership</h3>

            <p className="text-gray-700 mb-2">When you invite collaborators:</p>

            <div className="mb-4">
              <h4 className="text-lg font-semibold text-gray-800 mb-2">You own:</h4>
              <ul className="list-disc list-inside space-y-1 text-gray-700">
                <li>Stories you create</li>
                <li>Photos you upload</li>
                <li>Your biographical information</li>
              </ul>
            </div>

            <div className="mb-4">
              <h4 className="text-lg font-semibold text-gray-800 mb-2">Collaborators own:</h4>
              <ul className="list-disc list-inside space-y-1 text-gray-700">
                <li>Stories they create</li>
                <li>Photos they upload</li>
                <li>Their own content</li>
              </ul>
            </div>

            <div className="mb-6 bg-amber-50 p-4 rounded-lg">
              <h4 className="text-lg font-semibold text-gray-800 mb-2">Shared timeline:</h4>
              <ul className="list-disc list-inside space-y-1 text-gray-700">
                <li>The timeline itself belongs to the account owner (you)</li>
                <li>Individual stories belong to whoever created them</li>
                <li>If you delete your account, collaborators retain their stories</li>
                <li>If a collaborator leaves, they choose whether their stories remain</li>
              </ul>
            </div>

            <h3 className="text-xl font-semibold text-gray-800 mb-4 mt-8">What you CAN do as account owner:</h3>
            <ul className="list-disc list-inside space-y-1 text-gray-700 mb-6">
              <li>Remove collaborator access (but not delete their content without permission)</li>
              <li>Archive or hide collaborator stories from timeline view</li>
              <li>Change permission levels</li>
              <li>Export the full timeline including collaborator content (for backup)</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-800 mb-4">What you CANNOT do:</h3>
            <ul className="list-disc list-inside space-y-1 text-gray-700 mb-6">
              <li>Delete stories created by collaborators (without their consent)</li>
              <li>Edit collaborators' stories</li>
              <li>Claim ownership of others' content</li>
              <li>Transfer collaborator content to your account</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-800 mb-4">What collaborators CAN do:</h3>
            <ul className="list-disc list-inside space-y-1 text-gray-700 mb-6">
              <li>Add stories to the shared timeline</li>
              <li>Edit or delete their own stories</li>
              <li>Download their own content</li>
              <li>Leave the collaboration and take their stories with them</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-800 mb-4">What collaborators CANNOT do:</h3>
            <ul className="list-disc list-inside space-y-1 text-gray-700 mb-6">
              <li>Delete the account owner's stories</li>
              <li>Edit other contributors' stories</li>
              <li>Change account settings or billing</li>
              <li>Invite additional collaborators</li>
              <li>Remove other collaborators</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-800 mb-4 mt-8">License You Grant Us</h3>
            <p className="text-gray-700 mb-2">By uploading content, you grant HeritageWhisper a limited, non-exclusive license to:</p>
            <ul className="list-disc list-inside space-y-1 text-gray-700 mb-4">
              <li>Store your content on our servers</li>
              <li>Process content through AI services (OpenAI)</li>
              <li>Display content to you and family members you authorize</li>
              <li>Create backups for data protection</li>
              <li>Generate transcriptions and insights</li>
            </ul>

            <p className="text-gray-700 mb-2">This license:</p>
            <ul className="list-disc list-inside space-y-1 text-gray-700 mb-6">
              <li>Exists only to provide the Service</li>
              <li>Terminates when you delete content (except for backup retention periods)</li>
              <li>Does not allow us to use your content for marketing, training AI models, or any purpose beyond serving you</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-800 mb-4">Your Responsibilities</h3>
            <p className="text-gray-700 mb-2">You represent and warrant that:</p>
            <ul className="list-disc list-inside space-y-1 text-gray-700 mb-4">
              <li>You own or have rights to all content you upload</li>
              <li>Your content does not violate anyone else's intellectual property rights</li>
              <li>Your content does not violate any laws</li>
              <li>You have consent from any person identifiable in photos or recordings</li>
            </ul>

            <p className="text-gray-700 mb-2">You are solely responsible for:</p>
            <ul className="list-disc list-inside space-y-1 text-gray-700 mb-6">
              <li>The accuracy of your stories</li>
              <li>Any harm caused by your content</li>
              <li>Obtaining necessary permissions from others featured in your content</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-800 mb-4">Feedback and Suggestions</h3>
            <p className="text-gray-700">If you send us ideas, suggestions, or feedback about HeritageWhisper ("Feedback"), you grant us the right to use that Feedback without compensation or attribution. This does not apply to your personal stories—only to suggestions about the Service itself.</p>
          </section>

          {/* Section 5 */}
          <section id="section-5" className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">5. AI Processing and Accuracy</h2>

            <h3 className="text-xl font-semibold text-gray-800 mb-4">How AI Works in Our Service</h3>

            <div className="mb-6">
              <h4 className="text-lg font-semibold text-gray-800 mb-2">Transcription:</h4>
              <ul className="list-disc list-inside space-y-1 text-gray-700">
                <li>Voice recordings processed by OpenAI Whisper API</li>
                <li>Converted to text automatically</li>
                <li>You can edit transcriptions for accuracy</li>
              </ul>
            </div>

            <div className="mb-6">
              <h4 className="text-lg font-semibold text-gray-800 mb-2">Content Analysis:</h4>
              <p className="text-gray-700 mb-2">GPT-4 analyzes story text to generate:</p>
              <ul className="list-disc list-inside space-y-1 text-gray-700">
                <li>Personalized follow-up questions</li>
                <li>Character trait insights</li>
                <li>Wisdom themes and patterns</li>
                <li>Suggested prompts</li>
              </ul>
            </div>

            <h3 className="text-xl font-semibold text-gray-800 mb-4 mt-8">AI Accuracy Disclaimers</h3>

            <p className="text-gray-700 mb-2">We do NOT guarantee:</p>
            <ul className="list-disc list-inside space-y-1 text-gray-700 mb-4">
              <li>100% accurate transcriptions</li>
              <li>Perfect character analysis</li>
              <li>Flawless AI-generated questions</li>
              <li>Complete capture of meaning or nuance</li>
            </ul>

            <p className="text-gray-700 mb-2">You acknowledge that:</p>
            <ul className="list-disc list-inside space-y-1 text-gray-700 mb-6">
              <li>AI makes mistakes and misinterprets context</li>
              <li>Transcriptions may contain errors, especially with accents, unclear speech, background noise, technical terms, or uncommon names</li>
              <li>Character insights are algorithmic suggestions, not psychological assessments</li>
              <li>All AI-generated content is subject to your review and editing</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-800 mb-4">Your Right to Edit</h3>
            <p className="text-gray-700 mb-2">You can:</p>
            <ul className="list-disc list-inside space-y-1 text-gray-700 mb-6">
              <li>Edit any transcription for accuracy</li>
              <li>Delete or modify AI-generated insights</li>
              <li>Regenerate questions or analysis</li>
              <li>Opt out of AI features (keeps raw transcription only)</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-800 mb-4">Training Data Policy</h3>
            <p className="text-gray-700 mb-2">Your stories are NEVER used to:</p>
            <ul className="list-disc list-inside space-y-1 text-gray-700 mb-4">
              <li>Train AI models</li>
              <li>Improve OpenAI's algorithms</li>
              <li>Create datasets for research</li>
              <li>Provide examples to other users</li>
            </ul>
            <p className="text-gray-700">All AI processing is ephemeral and conducted solely to serve you.</p>
          </section>

          {/* Section 6 - Shortened for brevity but includes all content */}
          <section id="section-6" className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">6. Family Sharing and Access Controls</h2>

            <h3 className="text-xl font-semibold text-gray-800 mb-4">Permission Levels</h3>

            <div className="mb-6 bg-blue-50 p-4 rounded-lg">
              <h4 className="text-lg font-semibold text-gray-800 mb-2">View Only:</h4>
              <ul className="list-disc list-inside space-y-1 text-gray-700">
                <li>Can view stories you've explicitly shared with them</li>
                <li>Can leave comments if you enable commenting</li>
                <li>Cannot add content or make changes</li>
                <li>Available on Free and Premium tiers</li>
              </ul>
            </div>

            <div className="mb-6 bg-green-50 p-4 rounded-lg">
              <h4 className="text-lg font-semibold text-gray-800 mb-2">Collaborator (Premium Only):</h4>
              <ul className="list-disc list-inside space-y-1 text-gray-700">
                <li>Can add their own stories to your shared timeline</li>
                <li>Can upload photos and voice recordings</li>
                <li>Can edit their own stories</li>
                <li>Cannot edit or delete your stories</li>
                <li>Cannot change account or billing settings</li>
                <li>Must have their own HeritageWhisper account (free)</li>
              </ul>
            </div>

            <p className="text-gray-700 mb-4">
              For complete details on collaboration features, content ownership rules, and managing collaborators, please see the full section in this document.
            </p>
          </section>

          {/* Section 7 */}
          <section id="section-7" className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">7. Account Succession and Legacy Planning</h2>

            <h3 className="text-xl font-semibold text-gray-800 mb-4">Designating a Successor</h3>
            <p className="text-gray-700 mb-4">You may designate a trusted person to access your account after your death or incapacity.</p>

            <p className="text-gray-700 mb-2">To designate a successor:</p>
            <ul className="list-disc list-inside space-y-1 text-gray-700 mb-4">
              <li>Email support@heritagewhisper.com with "Successor Designation"</li>
              <li>Provide successor's full name and relationship</li>
              <li>Provide successor's contact information</li>
              <li>We'll send written confirmation</li>
            </ul>

            <p className="text-gray-700 mb-6">You may change or remove your designated successor at any time.</p>

            <h3 className="text-xl font-semibold text-gray-800 mb-4">Successor Access Process</h3>

            <div className="mb-4">
              <h4 className="text-lg font-semibold text-gray-800 mb-2">Required documentation:</h4>
              <ul className="list-disc list-inside space-y-1 text-gray-700">
                <li>Certified death certificate OR court order of incapacity</li>
                <li>Government-issued ID of successor</li>
                <li>Proof of relationship (if not in legal documents)</li>
              </ul>
            </div>

            <div className="mb-4">
              <h4 className="text-lg font-semibold text-gray-800 mb-2">What successors can do:</h4>
              <ul className="list-disc list-inside space-y-1 text-gray-700">
                <li>Download all content</li>
                <li>Share stories with other family members</li>
                <li>Continue Premium subscription (optional, at their expense)</li>
                <li>Export content in available formats</li>
              </ul>
            </div>

            <div className="mb-6">
              <h4 className="text-lg font-semibold text-gray-800 mb-2">What successors CANNOT do:</h4>
              <ul className="list-disc list-inside space-y-1 text-gray-700">
                <li>Edit original recordings (preserves authenticity)</li>
                <li>Delete content without court order</li>
                <li>Impersonate you or create new content as you</li>
                <li>Transfer ownership to themselves</li>
              </ul>
            </div>

            <h3 className="text-xl font-semibold text-gray-800 mb-4">Unclaimed Deceased Accounts</h3>
            <p className="text-gray-700 mb-2">If you die without designating a successor:</p>
            <ul className="list-disc list-inside space-y-1 text-gray-700">
              <li>We preserve your account for 5 years after we're notified of your death</li>
              <li>Family members may claim access with proper legal documentation</li>
              <li>After 5 years, unclaimed accounts are permanently deleted</li>
              <li>We are not obligated to notify family members of account existence</li>
            </ul>
          </section>

          {/* Section 8 */}
          <section id="section-8" className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">8. Prohibited Uses</h2>

            <h3 className="text-xl font-semibold text-gray-800 mb-4">You May NOT Use HeritageWhisper To:</h3>

            <div className="mb-6">
              <h4 className="text-lg font-semibold text-gray-800 mb-2">Violate Laws:</h4>
              <ul className="list-disc list-inside space-y-1 text-gray-700">
                <li>Engage in illegal activity</li>
                <li>Violate intellectual property rights</li>
                <li>Harass, threaten, or abuse others</li>
                <li>Share content depicting child exploitation</li>
              </ul>
            </div>

            <div className="mb-6">
              <h4 className="text-lg font-semibold text-gray-800 mb-2">Abuse the Service:</h4>
              <ul className="list-disc list-inside space-y-1 text-gray-700">
                <li>Scrape, data mine, or extract content systematically</li>
                <li>Reverse engineer our software</li>
                <li>Upload viruses, malware, or harmful code</li>
                <li>Attempt to access other users' accounts</li>
                <li>Bypass security measures or rate limits</li>
                <li>Create accounts using automated means (bots)</li>
              </ul>
            </div>

            <div className="mb-6">
              <h4 className="text-lg font-semibold text-gray-800 mb-2">In collaborative timelines:</h4>
              <ul className="list-disc list-inside space-y-1 text-gray-700">
                <li>Invite collaborators for the purpose of exploiting or manipulating them</li>
                <li>Add false or defamatory content to someone else's timeline</li>
                <li>Use collaboration features to harass other contributors</li>
                <li>Coerce an account owner to grant you permissions</li>
                <li>Delete or hide stories to destroy evidence of wrongdoing</li>
                <li>Impersonate other family members in recordings</li>
                <li>Share intimate details about others without consent</li>
              </ul>
            </div>

            <div className="mb-6">
              <h4 className="text-lg font-semibold text-gray-800 mb-2">Exploit Vulnerable Users:</h4>
              <ul className="list-disc list-inside space-y-1 text-gray-700">
                <li>Coerce elderly users to share stories they don't want to share</li>
                <li>Access accounts through exploitation or undue influence</li>
                <li>Delete or hide stories to erase evidence</li>
                <li>Use the Service to facilitate elder abuse or exploitation</li>
              </ul>
            </div>

            <h3 className="text-xl font-semibold text-gray-800 mb-4">Consequences of Violation</h3>
            <p className="text-gray-700 mb-2">If you violate these Terms, we may:</p>
            <ul className="list-disc list-inside space-y-1 text-gray-700">
              <li>Suspend or terminate your account immediately</li>
              <li>Delete prohibited content</li>
              <li>Report illegal activity to law enforcement</li>
              <li>Pursue legal action for damages</li>
            </ul>
          </section>

          {/* Section 9 */}
          <section id="section-9" className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">9. Our Intellectual Property</h2>

            <h3 className="text-xl font-semibold text-gray-800 mb-4">What We Own</h3>
            <p className="text-gray-700 mb-2">HeritageWhisper owns all rights to:</p>
            <ul className="list-disc list-inside space-y-1 text-gray-700 mb-4">
              <li>The website design and code</li>
              <li>HeritageWhisper name, logo, and trademarks</li>
              <li>Software, algorithms, and functionality</li>
              <li>User interface and experience design</li>
              <li>Marketing materials and documentation</li>
            </ul>

            <p className="text-gray-700 mb-2">This does NOT include:</p>
            <ul className="list-disc list-inside space-y-1 text-gray-700 mb-6">
              <li>Your personal stories and recordings (you own those)</li>
              <li>Third-party services we integrate with (OpenAI, Stripe, etc.)</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-800 mb-4">Limited License to Use Our Service</h3>
            <p className="text-gray-700 mb-2">We grant you a non-exclusive, non-transferable, revocable license to:</p>
            <ul className="list-disc list-inside space-y-1 text-gray-700 mb-4">
              <li>Access and use the Service for personal, non-commercial purposes</li>
              <li>Download copies of your own content</li>
              <li>Print or export your stories for family use</li>
            </ul>

            <p className="text-gray-700 mb-2">You may NOT:</p>
            <ul className="list-disc list-inside space-y-1 text-gray-700">
              <li>Sell, rent, or lease access to HeritageWhisper</li>
              <li>Create derivative products based on our Service</li>
              <li>Remove copyright notices or branding</li>
              <li>Use our trademarks without written permission</li>
              <li>Reproduce our software or user interface</li>
            </ul>
          </section>

          {/* Section 10 */}
          <section id="section-10" className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">10. Service Management and Modifications</h2>

            <h3 className="text-xl font-semibold text-gray-800 mb-4">Our Right to Manage the Service</h3>
            <p className="text-gray-700 mb-2">We reserve the right to:</p>
            <ul className="list-disc list-inside space-y-1 text-gray-700 mb-6">
              <li>Monitor accounts for Terms violations</li>
              <li>Remove content that violates these Terms</li>
              <li>Suspend accounts under investigation</li>
              <li>Refuse service to anyone for any legal reason</li>
              <li>Modify features or pricing</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-800 mb-4">Service Interruptions</h3>
            <p className="text-gray-700 mb-2">We do not guarantee:</p>
            <ul className="list-disc list-inside space-y-1 text-gray-700 mb-4">
              <li>100% uptime</li>
              <li>Uninterrupted access</li>
              <li>Zero data loss (though we maintain backups)</li>
              <li>Service will meet your specific needs</li>
            </ul>

            <p className="text-gray-700 mb-2">The Service may be unavailable due to:</p>
            <ul className="list-disc list-inside space-y-1 text-gray-700">
              <li>Scheduled maintenance</li>
              <li>Server failures</li>
              <li>Network issues</li>
              <li>Third-party service outages (OpenAI, Stripe, Supabase)</li>
              <li>Force majeure events</li>
            </ul>
          </section>

          {/* Section 11 */}
          <section id="section-11" className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">11. Termination and Account Deletion</h2>

            <h3 className="text-xl font-semibold text-gray-800 mb-4">Your Right to Cancel</h3>
            <p className="text-gray-700 mb-2">You may cancel your account at any time by:</p>
            <ul className="list-disc list-inside space-y-1 text-gray-700 mb-4">
              <li>Using the account settings in the Service, OR</li>
              <li>Emailing support@heritagewhisper.com</li>
            </ul>

            <p className="text-gray-700 mb-2">Upon cancellation:</p>
            <ul className="list-disc list-inside space-y-1 text-gray-700 mb-6">
              <li>Your account is immediately deactivated</li>
              <li>You lose access to all stories and content</li>
              <li>Backups are purged after 30 days</li>
              <li>Premium subscriptions continue until the end of the paid period (no refunds)</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-800 mb-4">Our Right to Terminate</h3>
            <p className="text-gray-700 mb-2">We may suspend or terminate your account if:</p>
            <ul className="list-disc list-inside space-y-1 text-gray-700">
              <li>You violate these Terms</li>
              <li>You engage in illegal activity</li>
              <li>You abuse the Service or other users</li>
              <li>You fail to pay subscription fees</li>
              <li>We're required by law or court order</li>
              <li>We discontinue the Service entirely</li>
            </ul>
          </section>

          {/* Section 12 */}
          <section id="section-12" className="mb-12 bg-yellow-50 border-l-4 border-yellow-400 p-6">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">12. Disclaimers and Limitations of Liability</h2>

            <div className="mb-6">
              <h3 className="text-xl font-semibold text-gray-800 mb-3">Service Provided "AS IS"</h3>
              <p className="text-gray-700 mb-4 uppercase font-bold">
                THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT ANY WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED.
              </p>
              <p className="text-gray-700 mb-2">We do NOT guarantee:</p>
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
              <h3 className="text-xl font-semibold text-gray-800 mb-3">No Warranties</h3>
              <p className="text-gray-700 mb-2 uppercase font-bold">WE DISCLAIM ALL WARRANTIES, INCLUDING:</p>
              <ul className="list-disc list-inside space-y-1 text-gray-700">
                <li>MERCHANTABILITY</li>
                <li>FITNESS FOR A PARTICULAR PURPOSE</li>
                <li>NON-INFRINGEMENT</li>
                <li>ACCURACY OR RELIABILITY</li>
                <li>QUIET ENJOYMENT</li>
                <li>TITLE</li>
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

            <p className="text-gray-700 text-sm mt-6">
              Some states do not allow exclusion of implied warranties or limitation of liability for incidental damages. If you're in such a state, some limitations above may not apply, and you may have additional rights.
            </p>
          </section>

          {/* Section 13 */}
          <section id="section-13" className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">13. Indemnification</h2>

            <h3 className="text-xl font-semibold text-gray-800 mb-4">You Agree to Defend and Indemnify Us</h3>
            <p className="text-gray-700 mb-4">
              You agree to defend, indemnify, and hold harmless HeritageWhisper LLC and its officers, directors, employees, contractors, and agents from any claims, damages, losses, liabilities, and expenses (including reasonable attorney's fees) arising from your use of the Service or violation of these Terms.
            </p>
          </section>

          {/* Section 14 */}
          <section id="section-14" className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">14. Dispute Resolution</h2>

            <h3 className="text-xl font-semibold text-gray-800 mb-4">Governing Law</h3>
            <p className="text-gray-700 mb-6">These Terms are governed by the laws of the State of Washington, without regard to conflict of law principles.</p>

            <h3 className="text-xl font-semibold text-gray-800 mb-4">Informal Resolution First</h3>
            <p className="text-gray-700 mb-4">
              Before filing any legal action, you agree to contact us at legal@heritagewhisper.com and attempt to resolve the dispute informally for at least 30 days.
            </p>

            <h3 className="text-xl font-semibold text-gray-800 mb-4">Binding Arbitration</h3>
            <p className="text-gray-700 mb-4">
              If informal resolution fails, disputes will be resolved through binding arbitration administered by the American Arbitration Association (AAA) under its Consumer Arbitration Rules.
            </p>

            <div className="bg-red-50 border-l-4 border-red-400 p-4 mt-4">
              <h3 className="text-xl font-semibold text-gray-800 mb-3">Class Action Waiver</h3>
              <p className="text-gray-700 uppercase font-bold">
                YOU AGREE THAT DISPUTES WILL BE RESOLVED INDIVIDUALLY, NOT AS A CLASS ACTION. YOU WAIVE THE RIGHT TO PARTICIPATE IN CLASS ACTIONS.
              </p>
            </div>
          </section>

          {/* Section 15 */}
          <section id="section-15" className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">15. General Terms</h2>

            <h3 className="text-xl font-semibold text-gray-800 mb-4">Entire Agreement</h3>
            <p className="text-gray-700 mb-6">These Terms, together with our Privacy Policy, constitute the entire agreement between you and HeritageWhisper regarding the Service.</p>

            <h3 className="text-xl font-semibold text-gray-800 mb-4">Assignment</h3>
            <p className="text-gray-700 mb-6">You may NOT assign these Terms or your account to anyone else. We MAY assign these Terms in connection with a merger, acquisition, or sale of assets.</p>

            <h3 className="text-xl font-semibold text-gray-800 mb-4">Severability</h3>
            <p className="text-gray-700">If any provision of these Terms is found invalid or unenforceable, that provision is severed from the Terms, and the remaining provisions remain in full effect.</p>
          </section>

          {/* Section 16 */}
          <section id="section-16" className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">16. Changes to These Terms</h2>

            <h3 className="text-xl font-semibold text-gray-800 mb-4">Our Right to Modify</h3>
            <p className="text-gray-700 mb-2">We may update these Terms at any time to reflect:</p>
            <ul className="list-disc list-inside space-y-1 text-gray-700 mb-6">
              <li>Changes in the Service</li>
              <li>Changes in the law</li>
              <li>Changes in business practices</li>
              <li>Improved clarity or accuracy</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-800 mb-4">How We Notify You</h3>
            <p className="text-gray-700 mb-2">For material changes:</p>
            <ul className="list-disc list-inside space-y-1 text-gray-700 mb-6">
              <li>Email to your registered address</li>
              <li>Prominent notice on the website</li>
              <li>In-app notification</li>
            </ul>

            <p className="text-gray-700">If you continue using the Service after changes take effect, you accept the new Terms.</p>
          </section>

          {/* Section 17 */}
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
        </div>
      </div>
    </div>
  );
}
