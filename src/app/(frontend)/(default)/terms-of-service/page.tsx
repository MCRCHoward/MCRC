import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Terms of Service | MCRC',
  description: 'Terms of Service for the Maryland Community Resource Center',
}

export default function TermsOfServicePage() {
  return (
    <section className="mt-32 py-16">
      <div className="container mx-auto max-w-4xl px-4">
        <div className="prose prose-lg max-w-none dark:prose-invert">
          <h1 className="mb-2 text-4xl font-bold">Terms of Service</h1>
          <p className="text-muted-foreground mb-8">Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>

          <div className="space-y-8">
            <section>
              <h2 className="text-2xl font-semibold mb-4">1. Agreement to Terms</h2>
              <p>
                By accessing or using the services provided by Maryland Community Resource Center
                (MCRC), you agree to be bound by these Terms of Service. If you do not agree to
                these terms, please do not use our services.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">2. Description of Services</h2>
              <p>
                MCRC provides conflict resolution services, including but not limited to mediation,
                facilitation, restorative justice programs, and training services. Our services are
                designed to help individuals, families, and groups resolve conflicts and build
                stronger communities.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">3. User Accounts</h2>
              <p>
                To access certain features of our services, you may be required to create an
                account. You agree to:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Provide accurate, current, and complete information</li>
                <li>Maintain and update your information to keep it accurate</li>
                <li>Maintain the security of your account credentials</li>
                <li>Accept responsibility for all activities under your account</li>
                <li>Notify us immediately of any unauthorized use of your account</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">4. Use of Services</h2>
              <p>You agree to use our services only for lawful purposes and in accordance with these Terms. You agree not to:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Use the services in any way that violates any applicable law or regulation</li>
                <li>Transmit any malicious code, viruses, or harmful materials</li>
                <li>Attempt to gain unauthorized access to any portion of our services</li>
                <li>Interfere with or disrupt the services or servers connected to the services</li>
                <li>Use the services to harass, abuse, or harm others</li>
                <li>Impersonate any person or entity or misrepresent your affiliation</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">5. Confidentiality</h2>
              <p>
                MCRC is committed to maintaining the confidentiality of all information shared during
                our mediation and conflict resolution services. All participants are expected to
                respect the confidentiality of the process and information shared by other
                participants, except as required by law or as agreed upon by all parties.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">6. Intellectual Property</h2>
              <p>
                All content, materials, and resources provided through our services, including but
                not limited to text, graphics, logos, images, and software, are the property of
                MCRC or its licensors and are protected by copyright, trademark, and other
                intellectual property laws.
              </p>
              <p>
                You may not reproduce, distribute, modify, or create derivative works from any
                content without our express written permission.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">7. Payment and Fees</h2>
              <p>
                Some services may require payment. All fees are clearly stated before you commit to
                a service. Payment must be made in accordance with the terms specified at the time
                of service request. MCRC reserves the right to modify fees with reasonable notice.
              </p>
              <p>
                We offer services regardless of ability to pay. If you have concerns about fees,
                please contact us to discuss payment options or financial assistance.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">8. Cancellation and Refunds</h2>
              <p>
                Cancellation policies vary by service type. Please refer to the specific terms
                provided at the time of service booking. Refund requests will be evaluated on a
                case-by-case basis in accordance with our refund policy.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">9. Limitation of Liability</h2>
              <p>
                To the maximum extent permitted by law, MCRC shall not be liable for any indirect,
                incidental, special, consequential, or punitive damages, or any loss of profits or
                revenues, whether incurred directly or indirectly, or any loss of data, use, goodwill,
                or other intangible losses resulting from your use of our services.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">10. Indemnification</h2>
              <p>
                You agree to indemnify, defend, and hold harmless MCRC, its officers, directors,
                employees, agents, and affiliates from any claims, damages, losses, liabilities,
                and expenses (including reasonable attorneys&apos; fees) arising out of or relating to
                your use of our services or violation of these Terms.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">11. Termination</h2>
              <p>
                We reserve the right to terminate or suspend your account and access to our services
                at our sole discretion, without prior notice, for conduct that we believe violates
                these Terms or is harmful to other users, us, or third parties, or for any other
                reason.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">12. Changes to Terms</h2>
              <p>
                We reserve the right to modify these Terms at any time. We will notify users of any
                material changes by posting the new Terms on this page and updating the &quot;Last
                updated&quot; date. Your continued use of our services after such modifications
                constitutes your acceptance of the updated Terms.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">13. Governing Law</h2>
              <p>
                These Terms shall be governed by and construed in accordance with the laws of the
                State of Maryland, without regard to its conflict of law provisions. Any disputes
                arising from these Terms or your use of our services shall be resolved in the
                courts of Maryland.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">14. Severability</h2>
              <p>
                If any provision of these Terms is found to be unenforceable or invalid, that
                provision shall be limited or eliminated to the minimum extent necessary, and the
                remaining provisions shall remain in full force and effect.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">15. Contact Information</h2>
              <p>
                If you have any questions about these Terms of Service, please contact us at:
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

