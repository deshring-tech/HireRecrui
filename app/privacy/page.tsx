import type { Metadata } from "next";
import Link from "next/link";
import { Bullets, ContactLink, LegalShell, Section } from "@/components/LegalPage";

export const metadata: Metadata = { title: "Privacy Policy" };

export default function PrivacyPage() {
  return (
    <LegalShell
      title="Privacy Policy"
      intro="HireFlow AI turns candidates' résumés and project work into shareable interactive profiles and helps recruiters review them. This policy explains what we collect, how it's used, who can see it, and how to delete it."
    >
      <Section title="What we collect">
        <Bullets
          items={[
            <><strong>Recruiters:</strong> name, email address, and password (stored only as a one-way hash), the roles you create, and the statuses and notes you record on candidates.</>,
            <><strong>Candidates:</strong> name, job title, email address, résumé text, projects, links, uploaded screenshots and documents, answers to follow-up questions, and whether you've opted into matching.</>,
            <><strong>Résumés uploaded by recruiters:</strong> the text and details extracted from files a recruiter uploads.</>,
            <><strong>Usage:</strong> how many times a profile was viewed, when a recruiter first opened it, and when a recruiter was last active.</>,
            <><strong>Technical:</strong> IP address and request details, processed by our hosting providers and briefly in memory to prevent abuse.</>,
          ]}
        />
      </Section>

      <Section title="How we use it">
        <Bullets
          items={[
            "To build your interactive profile and show it to the recruiter whose link you used.",
            "To score profiles against a role's stated requirements. Scores are advisory.",
            "If you opt into matching: to show your profile to recruiters with matching roles, and to show you roles you fit.",
            "To send notifications, such as a new application or a change in your status.",
            "To check that links you add actually load. We visit those addresses automatically.",
            "To keep the service secure and to count overall usage so we can tell whether it's useful.",
          ]}
        />
      </Section>

      <Section title="AI processing">
        <p>
          Profiles, follow-up questions, match scores, and answers to questions about a candidate are generated from the
          information provided. That processing may run on our own built-in rules or be sent to a third-party AI
          provider, which handles it under its own terms.
        </p>
        <p>
          AI output can be wrong. It never rejects anyone automatically — every accept, interview, or reject decision is
          made by a person.
        </p>
      </Section>

      <Section title="Who can see your information">
        <Bullets
          items={[
            <><strong>Anyone with your profile link</strong> can view the profile. Your email address is not shown on it, and profile pages ask search engines not to index them.</>,
            <><strong>The recruiter whose link you used</strong> can see your profile and email address, update your status, and contact you.</>,
            <><strong>If you opt into matching,</strong> recruiters on HireFlow can see your profile and email address so they can contact you about roles you match. You can turn this off at any time.</>,
            <><strong>Service providers</strong> that run the service: Vercel (hosting), Supabase (database and file storage), an email delivery provider, and an AI provider when enabled.</>,
          ]}
        />
        <p>We do not sell personal information.</p>
      </Section>

      <Section title="Cookies">
        <p>
          Signed-in recruiters get one essential cookie that keeps them logged in. We don't use advertising or
          third-party tracking cookies.
        </p>
      </Section>

      <Section title="Keeping and deleting your data">
        <Bullets
          items={[
            <><strong>Candidates</strong> can delete their profile at any time from their private edit link. This removes the profile, its notifications, and uploaded files.</>,
            <><strong>Recruiters</strong> can delete their account from the dashboard. This removes the account, its roles, and any résumés the recruiter bulk-uploaded. Profiles that candidates submitted are detached from the account — the recruiter's scores and decisions are removed — and stay under the candidate's control.</>,
            "If a recruiter uploaded your résumé and you want it removed, ask that recruiter, or contact us.",
          ]}
        />
        <p>
          We keep information until it's deleted. Copies may remain in service providers' logs for a limited time.
        </p>
      </Section>

      <Section title="Security">
        <p>
          Passwords are hashed and access to candidate data is restricted to the people described above. No system is
          perfectly secure. Keep your private edit link private: anyone who has it can edit or delete your profile.
        </p>
      </Section>

      <Section title="Children">
        <p>HireFlow AI is not intended for anyone under 16.</p>
      </Section>

      <Section title="Changes and contact">
        <p>
          We'll update the date above when this policy changes. For questions, or to ask us to access, correct, or
          delete your information, contact <ContactLink />. See also our{" "}
          <Link href="/terms" className="text-brand-600 hover:underline">
            Terms of Service
          </Link>
          .
        </p>
      </Section>
    </LegalShell>
  );
}
