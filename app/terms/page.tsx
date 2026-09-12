import type { Metadata } from "next";
import Link from "next/link";
import { Bullets, ContactLink, LegalShell, Section } from "@/components/LegalPage";

export const metadata: Metadata = { title: "Terms of Service" };

export default function TermsPage() {
  return (
    <LegalShell
      title="Terms of Service"
      intro="These terms cover your use of HireFlow AI. By using the service you agree to them."
    >
      <Section title="The service">
        <p>
          HireFlow AI is free to use while it's in early access. It's provided as it is, features may change or stop,
          and we may limit usage to keep the service running for everyone.
        </p>
      </Section>

      <Section title="Eligibility">
        <p>
          You must be at least 16. If you use HireFlow AI as a recruiter on behalf of an organisation, you confirm
          you're authorised to hire for it.
        </p>
      </Section>

      <Section title="Accounts and private links">
        <p>
          Keep your password and your private profile edit link safe. You're responsible for what happens through your
          account or link.
        </p>
      </Section>

      <Section title="Your content">
        <p>
          You keep ownership of what you submit. You give us permission to store, process (including with AI), display,
          and share it as described in our{" "}
          <Link href="/privacy" className="text-brand-600 hover:underline">
            Privacy Policy
          </Link>
          , only as needed to run the service. Only submit content you have the right to share, and keep it accurate.
        </p>
      </Section>

      <Section title="If you're a recruiter">
        <Bullets
          items={[
            "Follow the employment, anti-discrimination, and data-protection laws that apply to you.",
            "Only upload résumés you're authorised to process.",
            "Scores, summaries, and matches are advisory and can be wrong. You make hiring decisions and are responsible for them.",
            "Contact matched candidates only about genuine roles. No bulk or unsolicited messaging.",
          ]}
        />
      </Section>

      <Section title="If you're a candidate">
        <p>
          Represent your experience honestly. Links you add may be visited automatically to confirm they load, and the
          result may be shown on your profile.
        </p>
      </Section>

      <Section title="Acceptable use">
        <Bullets
          items={[
            "Don't scrape or harvest profiles or contact details.",
            "Don't try to get around security measures or usage limits.",
            "Don't upload malware, impersonate anyone, or post unlawful or harmful content.",
            "Don't upload other people's information without their permission.",
          ]}
        />
      </Section>

      <Section title="No guarantees">
        <p>
          We don't guarantee any job, hire, candidate, or outcome, or that AI output is accurate. To the extent the law
          allows, we're not liable for indirect or consequential losses arising from use of this free service.
        </p>
      </Section>

      <Section title="Ending use">
        <p>
          You can stop using HireFlow AI and delete your data at any time. We may suspend access that breaks these
          terms.
        </p>
      </Section>

      <Section title="Changes and contact">
        <p>
          We'll update the date above when these terms change; continuing to use the service means you accept the
          updated terms. Questions: <ContactLink />.
        </p>
      </Section>
    </LegalShell>
  );
}
