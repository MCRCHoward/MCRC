import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Privacy Policy | MCRC',
  description: 'Privacy Policy for the Maryland Community Resource Center',
}

export default function PrivacyPolicyPage() {
  return (
    <section className="mt-32 py-16">
      <div className="container mx-auto max-w-4xl px-4">
        <div className="prose prose-lg max-w-none dark:prose-invert">
          <h1 className="mb-2 text-4xl font-bold">Privacy Policy</h1>
          <p className="text-muted-foreground mb-8">Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>

          <div className="space-y-8">
            <section>
              <h2 className="text-2xl font-semibold mb-4">1. Introduction</h2>
              <p>
                Maryland Community Resource Center (MCRC) is committed to protecting your privacy.
                This Privacy Policy explains how we collect, use, disclose, and safeguard your
                information when you use our services, including our website, mediation services,
                and other conflict resolution programs.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">2. Information We Collect</h2>
              
              <h3 className="text-xl font-semibold mb-3 mt-6">2.1 Personal Information</h3>
              <p>We may collect the following types of personal information:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Name, email address, phone number, and mailing address</li>
                <li>Date of birth (for age verification purposes)</li>
                <li>Guardian information (for users under 18)</li>
                <li>Payment information (processed securely through third-party payment processors)</li>
                <li>Language preferences and communication preferences</li>
                <li>Information about conflicts or disputes you seek to resolve</li>
                <li>Emergency contact information</li>
              </ul>

              <h3 className="text-xl font-semibold mb-3 mt-6">2.2 Automatically Collected Information</h3>
              <p>When you visit our website, we may automatically collect:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>IP address and browser type</li>
                <li>Device information and operating system</li>
                <li>Pages visited and time spent on pages</li>
                <li>Referring website addresses</li>
                <li>Cookies and similar tracking technologies</li>
              </ul>

              <h3 className="text-xl font-semibold mb-3 mt-6">2.3 Information from Third Parties</h3>
              <p>
                We may receive information about you from third parties, such as when you register
                using a social media account or when referred by another organization.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">3. How We Use Your Information</h2>
              <p>We use the information we collect to:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Provide, maintain, and improve our services</li>
                <li>Process your service requests and manage your account</li>
                <li>Communicate with you about your services, appointments, and updates</li>
                <li>Send you newsletters, educational materials, and promotional communications (with your consent)</li>
                <li>Respond to your inquiries and provide customer support</li>
                <li>Comply with legal obligations and protect our rights</li>
                <li>Prevent fraud and ensure the security of our services</li>
                <li>Conduct research and analytics to improve our services</li>
                <li>Facilitate conflict resolution processes and maintain case records</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">4. Information Sharing and Disclosure</h2>
              <p>We do not sell your personal information. We may share your information in the following circumstances:</p>
              
              <h3 className="text-xl font-semibold mb-3 mt-6">4.1 Service Providers</h3>
              <p>
                We may share information with third-party service providers who perform services on
                our behalf, such as payment processing, email delivery, and website hosting. These
                providers are contractually obligated to protect your information.
              </p>

              <h3 className="text-xl font-semibold mb-3 mt-6">4.2 Legal Requirements</h3>
              <p>
                We may disclose information if required by law, court order, or government
                regulation, or if we believe disclosure is necessary to protect our rights, your
                safety, or the safety of others.
              </p>

              <h3 className="text-xl font-semibold mb-3 mt-6">4.3 Mediation and Conflict Resolution</h3>
              <p>
                Information shared during mediation sessions is confidential and will only be
                disclosed as agreed upon by all parties or as required by law. We maintain strict
                confidentiality standards in accordance with professional mediation practices.
              </p>

              <h3 className="text-xl font-semibold mb-3 mt-6">4.4 Business Transfers</h3>
              <p>
                In the event of a merger, acquisition, or sale of assets, your information may be
                transferred to the acquiring entity, subject to the same privacy protections.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">5. Data Security</h2>
              <p>
                We implement appropriate technical and organizational measures to protect your
                personal information against unauthorized access, alteration, disclosure, or
                destruction. These measures include:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Encryption of sensitive data in transit and at rest</li>
                <li>Secure authentication and access controls</li>
                <li>Regular security assessments and updates</li>
                <li>Limited access to personal information on a need-to-know basis</li>
                <li>Secure data storage and backup procedures</li>
              </ul>
              <p className="mt-4">
                However, no method of transmission over the Internet or electronic storage is 100%
                secure. While we strive to protect your information, we cannot guarantee absolute
                security.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">6. Data Retention</h2>
              <p>
                We retain your personal information for as long as necessary to fulfill the purposes
                outlined in this Privacy Policy, unless a longer retention period is required or
                permitted by law. Case records and mediation documentation may be retained in
                accordance with legal and professional requirements.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">7. Your Rights and Choices</h2>
              <p>You have the following rights regarding your personal information:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>
                  <strong>Access:</strong> Request access to the personal information we hold about you
                </li>
                <li>
                  <strong>Correction:</strong> Request correction of inaccurate or incomplete information
                </li>
                <li>
                  <strong>Deletion:</strong> Request deletion of your personal information, subject to legal and professional obligations
                </li>
                <li>
                  <strong>Opt-Out:</strong> Unsubscribe from marketing communications at any time
                </li>
                <li>
                  <strong>Data Portability:</strong> Request a copy of your data in a portable format
                </li>
                <li>
                  <strong>Restrict Processing:</strong> Request restriction of processing in certain circumstances
                </li>
              </ul>
              <p className="mt-4">
                To exercise these rights, please contact us using the information provided in the
                Contact section below.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">8. Cookies and Tracking Technologies</h2>
              <p>
                We use cookies and similar tracking technologies to enhance your experience on our
                website. Cookies are small data files stored on your device that help us remember
                your preferences and improve site functionality.
              </p>
              <p className="mt-4">You can control cookies through your browser settings. However, disabling cookies may affect the functionality of our website.</p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">9. Children&apos;s Privacy</h2>
              <p>
                Our services are available to individuals of all ages. For users under 18, we require
                guardian consent and collect guardian contact information as part of our registration
                process. We do not knowingly collect personal information from children under 13
                without appropriate parental consent.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">10. Third-Party Links</h2>
              <p>
                Our website may contain links to third-party websites. We are not responsible for
                the privacy practices of these external sites. We encourage you to review the
                privacy policies of any third-party sites you visit.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">11. International Data Transfers</h2>
              <p>
                Your information may be transferred to and processed in countries other than your
                country of residence. We ensure that appropriate safeguards are in place to protect
                your information in accordance with this Privacy Policy.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">12. Changes to This Privacy Policy</h2>
              <p>
                We may update this Privacy Policy from time to time. We will notify you of any
                material changes by posting the new Privacy Policy on this page and updating the
                &quot;Last updated&quot; date. We encourage you to review this Privacy Policy periodically.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">13. California Privacy Rights</h2>
              <p>
                If you are a California resident, you have additional rights under the California
                Consumer Privacy Act (CCPA), including the right to know what personal information
                we collect, the right to delete personal information, and the right to opt-out of
                the sale of personal information (we do not sell personal information).
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">14. Contact Us</h2>
              <p>
                If you have any questions, concerns, or requests regarding this Privacy Policy or
                our data practices, please contact us:
              </p>
              <div className="mt-4 space-y-2">
                <p>
                  <strong>Maryland Community Resource Center</strong>
                </p>
                <p>9770 Patuxent Woods Drive, Suite 306</p>
                <p>Columbia, MD 21046</p>
                <p>
                  Email: <a href="mailto:info@mcrchoward.org" className="text-primary hover:underline">info@mcrchoward.org</a>
                </p>
                <p>
                  Phone: <a href="tel:+14435187693" className="text-primary hover:underline">(443) 518-7693</a>
                </p>
              </div>
            </section>
          </div>
        </div>
      </div>
    </section>
  )
}

