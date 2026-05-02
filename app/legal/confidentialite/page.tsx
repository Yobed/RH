import Link from "next/link";
import { ArrowLeft, ShieldCheck } from "lucide-react";

export const metadata = {
  title: "Politique de confidentialité — RH Manager CI",
  description: "Traitement des données personnelles conforme à la Loi n° 2013-450 du 19 juin 2013 (ARTCI).",
};

export default function ConfidentialitePage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <Link
          href="/"
          className="text-xs text-slate-500 hover:text-slate-900 inline-flex items-center gap-1.5 mb-6"
        >
          <ArrowLeft className="h-3 w-3" /> Retour à l'application
        </Link>

        <header className="pb-6 border-b border-slate-200 mb-8">
          <div className="flex items-center gap-3 mb-2">
            <ShieldCheck className="h-5 w-5 text-slate-700" />
            <p className="text-[11px] uppercase tracking-[0.14em] text-slate-400 font-medium">
              Loi n° 2013-450 · ARTCI
            </p>
          </div>
          <h1 className="text-2xl sm:text-3xl font-semibold text-slate-900">
            Politique de confidentialité
          </h1>
          <p className="text-sm text-slate-500 mt-2 leading-snug">
            Traitement des données personnelles dans RH Manager CI — conforme à la
            Loi n° 2013-450 du 19 juin 2013 relative à la protection des données à
            caractère personnel en Côte d'Ivoire.
          </p>
          <p className="text-xs text-slate-400 mt-2">Dernière mise à jour : 28 avril 2026.</p>
        </header>

        <article className="prose prose-slate prose-sm max-w-none space-y-8 text-slate-700 leading-relaxed">
          <Section title="1. Identité du responsable de traitement">
            <p>
              Le responsable du traitement des données est la personne morale
              cliente de RH Manager CI (l'<strong>« Entreprise »</strong>) pour le
              compte de laquelle l'application est exploitée. RH Manager CI agit
              en tant que <strong>sous-traitant</strong> au sens de l'article 1er
              de la Loi n° 2013-450.
            </p>
          </Section>

          <Section title="2. Catégories de données collectées">
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Identité :</strong> nom, prénoms, civilité, date et lieu de naissance, nationalité, situation familiale, photo.</li>
              <li><strong>Pièce d'identité :</strong> numéro CNI/passeport et date d'expiration, numéro CNPS.</li>
              <li><strong>Coordonnées :</strong> adresse postale, téléphone, email, contact d'urgence.</li>
              <li><strong>Bancaires :</strong> RIB ou numéro mobile money pour le virement du salaire.</li>
              <li><strong>Vie professionnelle :</strong> matricule, poste, département, contrat, ancienneté, salaire, primes, évaluations, formations.</li>
              <li><strong>Santé :</strong> visites médicales (dates et conclusions d'aptitude), accidents du travail, arrêts maladie. Aucune donnée médicale détaillée n'est stockée.</li>
              <li><strong>Disciplinaire :</strong> sanctions, avertissements, procédures.</li>
            </ul>
          </Section>

          <Section title="3. Finalités du traitement">
            <ul className="list-disc pl-5 space-y-1">
              <li>Gestion administrative du personnel (contrats, paie, congés).</li>
              <li>Calcul et déclaration des cotisations sociales et fiscales (CNPS, ITS, IGR, FDFP).</li>
              <li>Production des bulletins de paie (Arrêté n° 2008-2401) et documents légaux (STC, attestations).</li>
              <li>Suivi médical professionnel et sécurité au travail.</li>
              <li>Gestion des évaluations et de la performance.</li>
              <li>Pilotage analytique anonymisé (masse salariale, turnover, parité).</li>
            </ul>
          </Section>

          <Section title="4. Bases légales du traitement">
            <ul className="list-disc pl-5 space-y-1">
              <li>Exécution du contrat de travail (Art. 12 Loi 2013-450).</li>
              <li>Respect d'obligations légales (Code du travail CI, Code de la sécurité sociale, CGI).</li>
              <li>Intérêt légitime de l'employeur pour la gestion administrative.</li>
              <li>Consentement explicite pour les données facultatives (mobile money, contact d'urgence).</li>
            </ul>
          </Section>

          <Section title="5. Durées de conservation">
            <p>
              Les données sont conservées pour les durées prévues par les textes
              ivoiriens, à compter de la fin de la relation de travail :
            </p>
            <table className="w-full text-xs border-collapse mt-3">
              <thead className="bg-slate-100">
                <tr>
                  <th className="border border-slate-200 px-3 py-2 text-left">Domaine</th>
                  <th className="border border-slate-200 px-3 py-2 text-left">Durée</th>
                  <th className="border border-slate-200 px-3 py-2 text-left">Base légale</th>
                </tr>
              </thead>
              <tbody>
                <tr><td className="border border-slate-200 px-3 py-2">Bulletins et documents de paie</td><td className="border border-slate-200 px-3 py-2 tabular-nums">5 ans</td><td className="border border-slate-200 px-3 py-2">CGI CI Art. 36</td></tr>
                <tr><td className="border border-slate-200 px-3 py-2">Documents comptables</td><td className="border border-slate-200 px-3 py-2 tabular-nums">10 ans</td><td className="border border-slate-200 px-3 py-2">Acte uniforme OHADA Art. 24</td></tr>
                <tr><td className="border border-slate-200 px-3 py-2">Contrats, avenants, lettres de licenciement</td><td className="border border-slate-200 px-3 py-2 tabular-nums">5 ans</td><td className="border border-slate-200 px-3 py-2">CT-CI Art. 73</td></tr>
                <tr><td className="border border-slate-200 px-3 py-2">Sanctions disciplinaires</td><td className="border border-slate-200 px-3 py-2 tabular-nums">2 ans</td><td className="border border-slate-200 px-3 py-2">CT-CI Art. 28.4</td></tr>
                <tr><td className="border border-slate-200 px-3 py-2">Dossier médical professionnel</td><td className="border border-slate-200 px-3 py-2 tabular-nums">5 ans</td><td className="border border-slate-200 px-3 py-2">CT-CI Art. 41</td></tr>
                <tr><td className="border border-slate-200 px-3 py-2">Dossier d'accident du travail</td><td className="border border-slate-200 px-3 py-2 tabular-nums">10 ans</td><td className="border border-slate-200 px-3 py-2">Code SS CI Art. 47</td></tr>
                <tr><td className="border border-slate-200 px-3 py-2">CV non retenus</td><td className="border border-slate-200 px-3 py-2 tabular-nums">2 ans</td><td className="border border-slate-200 px-3 py-2">Recommandation ARTCI</td></tr>
              </tbody>
            </table>
          </Section>

          <Section title="6. Vos droits (Art. 35 à 41 Loi 2013-450)">
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Accès :</strong> consulter les données vous concernant.</li>
              <li><strong>Rectification :</strong> corriger les informations erronées.</li>
              <li><strong>Effacement :</strong> demander la suppression dans les limites légales.</li>
              <li><strong>Opposition :</strong> refuser certains traitements (hors obligations légales).</li>
              <li><strong>Portabilité :</strong> récupérer vos données dans un format structuré.</li>
              <li><strong>Retrait du consentement</strong> à tout moment sans effet rétroactif.</li>
            </ul>
            <p className="mt-3">
              L'exercice de ces droits s'effectue auprès du service RH de votre
              entreprise. À défaut de réponse, vous pouvez saisir l'<strong>Autorité
              de Régulation des Télécommunications/TIC de Côte d'Ivoire (ARTCI)</strong>.
            </p>
          </Section>

          <Section title="7. Sécurité des données">
            <ul className="list-disc pl-5 space-y-1">
              <li>Chiffrement des communications en TLS 1.3.</li>
              <li>Isolation par entreprise (Row Level Security PostgreSQL).</li>
              <li>Authentification renforcée et journal d'audit.</li>
              <li>Hébergement sur infrastructure conforme aux standards internationaux (Supabase / Vercel).</li>
              <li>Sauvegardes quotidiennes chiffrées.</li>
            </ul>
          </Section>

          <Section title="8. Sous-traitants">
            <p>
              Les données peuvent être traitées par les sous-traitants suivants,
              tous soumis à des engagements contractuels de confidentialité :
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Supabase</strong> — hébergement de la base de données et fichiers.</li>
              <li><strong>Vercel</strong> — hébergement de l'application web.</li>
              <li><strong>Google (Gemini)</strong> — assistance IA juridique (questions/réponses anonymisées).</li>
            </ul>
          </Section>

          <Section title="9. Transferts internationaux">
            <p>
              Certains sous-traitants peuvent stocker des données hors de la
              Côte d'Ivoire. Ces transferts s'effectuent dans le cadre des règles
              de l'art en matière de protection des données et bénéficient des
              garanties contractuelles standard.
            </p>
          </Section>

          <Section title="10. Contact">
            <p>
              Pour toute question relative au traitement de vos données :
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Service RH de votre entreprise.</li>
              <li>
                ARTCI :{" "}
                <a href="https://www.artci.ci" target="_blank" rel="noopener noreferrer" className="text-slate-900 underline">
                  www.artci.ci
                </a>
              </li>
            </ul>
          </Section>
        </article>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-base font-semibold text-slate-900 mb-3">{title}</h2>
      <div className="text-sm text-slate-700 leading-relaxed space-y-2">{children}</div>
    </section>
  );
}
