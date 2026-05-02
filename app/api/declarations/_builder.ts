/**
 * Helper partagé : construit le payload d'une déclaration sociale ou fiscale
 * à partir des bulletins de la période. Utilisé par /preview et /generer.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  REFORME_2026,
  computeDeadline,
  computePenaltyCnps,
  generateDipeCsv,
  generateDisaCsv,
  generateItsCsv,
  buildItsLineFromBulletin,
  type DipeLigneSalarie,
  type DisaLigneSalarie,
  type ItsLigneSalarie,
} from "@/lib/compliance-2026-ci";

export type DeclarationKind =
  | "DIPE"
  | "DISA"
  | "DASC"
  | "ITS_MENSUEL"
  | "ITS_ANNUEL";

export interface BuildResult {
  kind: DeclarationKind;
  periode: string;
  deadline: Date;
  isSocial: boolean;
  isMonthly: boolean;
  company: { raison_sociale: string; cnps_matricule: string | null; ncc: string | null };
  totals: {
    nb_salaries: number;
    total_brut: number;
    total_cotisations: number;
    total_assiette: number;
    total_retenu: number;
    penalite: number;
    total_du: number;
  };
  columns: string[];
  rows: Array<Record<string, string | number>>;
  csv: string;
}

interface BulletinRow {
  employee_id: string;
  periode: string;
  salaire_brut: number;
  fiscal_gross: number | null;
  social_gross: number | null;
  cnps_salarie: number;
  withholding_cnps: number | null;
  prime_transport: number | null;
}

interface EmployeeRow {
  id: string;
  matricule: string;
  full_name: string;
  num_cnps: string | null;
  date_naissance: string | null;
  date_embauche: string | null;
}

const DIPE_COLUMNS = [
  "Matricule",
  "N° CNPS",
  "Nom & prénoms",
  "Salaire brut",
  "Salaire imposable",
  "Base CNPS",
  "Retraite salarié",
  "Retraite patronal",
  "Familiales",
  "Maternité",
  "AT/MP",
  "CMU sal.",
  "CMU pat.",
];

const DISA_COLUMNS = [
  "Matricule",
  "N° CNPS",
  "Nom & prénoms",
  "Naissance",
  "Embauche",
  "Sortie",
  "Brut annuel",
  "CNPS salarié",
  "CNPS patronal",
  "Jours travaillés",
];

const ITS_COLUMNS = [
  "Matricule",
  "Nom & prénoms",
  "NCC",
  "Brut imposable",
  "Abattement 20 %",
  "Base imposable",
  "ITS",
  "Contribution Nationale 1,5 %",
];

export async function buildDeclaration(
  supabase: SupabaseClient,
  companyId: string,
  kind: DeclarationKind,
  periode: string
): Promise<BuildResult | { error: string }> {
  const isMonthly = kind === "DIPE" || kind === "ITS_MENSUEL";
  const isSocial = kind === "DIPE" || kind === "DISA" || kind === "DASC";

  // 1) Charger les bulletins
  const periodFilter = isMonthly ? periode : `${periode}-`;
  const { data: bulletinsRaw } = await supabase
    .from("bulletins_paie")
    .select(
      "employee_id, periode, salaire_brut, fiscal_gross, social_gross, cnps_salarie, withholding_cnps, prime_transport"
    )
    .eq("company_id", companyId)
    .like("periode", isMonthly ? periodFilter : `${periodFilter}%`);

  const bulletins = (bulletinsRaw ?? []) as BulletinRow[];
  if (bulletins.length === 0) {
    return { error: `Aucun bulletin trouvé pour la période ${periode}.` };
  }

  // 2) Charger l'entreprise et les employés
  const [{ data: company }, { data: employees }] = await Promise.all([
    supabase
      .from("companies")
      .select("name, raison_sociale, cnps_matricule, ncc, taux_at_mp")
      .eq("id", companyId)
      .single(),
    supabase
      .from("employees")
      .select("id, matricule, full_name, num_cnps, date_naissance, date_embauche")
      .in(
        "id",
        Array.from(new Set(bulletins.map((b) => b.employee_id)))
      ),
  ]);

  const empById = new Map<string, EmployeeRow>(
    (employees ?? []).map((e) => [e.id, e as EmployeeRow])
  );
  const tauxAtMp = Number(
    (company as { taux_at_mp?: number | null } | null)?.taux_at_mp ??
      REFORME_2026.cnps.at_mp_patronal_default
  );

  const companyMeta = {
    raison_sociale:
      (company as { raison_sociale?: string | null; name?: string } | null)
        ?.raison_sociale ??
      (company as { name?: string } | null)?.name ??
      "Entreprise",
    cnps_matricule:
      (company as { cnps_matricule?: string | null } | null)?.cnps_matricule ??
      null,
    ncc: (company as { ncc?: string | null } | null)?.ncc ?? null,
  };

  let totalBrut = 0;
  let totalCotisations = 0;
  let totalAssiette = 0;
  let totalRetenu = 0;
  let nbSalaries = 0;
  let csv = "";
  let columns: string[] = [];
  let rows: Array<Record<string, string | number>> = [];

  if (kind === "DIPE") {
    columns = DIPE_COLUMNS;
    const lignes: DipeLigneSalarie[] = bulletins.map((b) => {
      const emp = empById.get(b.employee_id);
      const baseCnps = Math.min(
        Number(b.fiscal_gross ?? b.salaire_brut),
        REFORME_2026.cnps.plafond_mensuel
      );
      const cnpsSal = Math.round(baseCnps * REFORME_2026.cnps.retraite_salarie);
      const cnpsPat = Math.round(baseCnps * REFORME_2026.cnps.retraite_patronal);
      const familiales = Math.round(
        Number(b.salaire_brut) * REFORME_2026.cnps.familiales_patronal
      );
      const maternite = Math.round(
        Number(b.salaire_brut) * REFORME_2026.cnps.maternite_patronal
      );
      const atMp = Math.round(Number(b.salaire_brut) * tauxAtMp);
      const cmuSal = REFORME_2026.cnps.cmu_forfait_mensuel;
      const cmuPat = REFORME_2026.cnps.cmu_forfait_mensuel;

      totalBrut += Number(b.salaire_brut);
      totalCotisations +=
        cnpsSal + cnpsPat + familiales + maternite + atMp + cmuSal + cmuPat;
      nbSalaries++;

      return {
        matricule: emp?.matricule ?? "",
        num_cnps: emp?.num_cnps ?? null,
        full_name: emp?.full_name ?? "",
        salaire_brut: Number(b.salaire_brut),
        salaire_imposable: Number(b.fiscal_gross ?? b.salaire_brut),
        base_cnps: baseCnps,
        cnps_retraite_salarie: cnpsSal,
        cnps_retraite_patronal: cnpsPat,
        cnps_familiales: familiales,
        cnps_maternite: maternite,
        cnps_at_mp: atMp,
        cmu_salarie: cmuSal,
        cmu_patronal: cmuPat,
      };
    });
    rows = lignes.map((l) => ({
      Matricule: l.matricule,
      "N° CNPS": l.num_cnps ?? "—",
      "Nom & prénoms": l.full_name,
      "Salaire brut": l.salaire_brut,
      "Salaire imposable": l.salaire_imposable,
      "Base CNPS": l.base_cnps,
      "Retraite salarié": l.cnps_retraite_salarie,
      "Retraite patronal": l.cnps_retraite_patronal,
      Familiales: l.cnps_familiales,
      Maternité: l.cnps_maternite,
      "AT/MP": l.cnps_at_mp,
      "CMU sal.": l.cmu_salarie,
      "CMU pat.": l.cmu_patronal,
    }));
    csv = generateDipeCsv({
      periode,
      numero_cnps_employeur: companyMeta.cnps_matricule,
      raison_sociale: companyMeta.raison_sociale,
      ncc: companyMeta.ncc,
      lignes,
    });
  } else if (kind === "DISA" || kind === "DASC") {
    columns = DISA_COLUMNS;
    const aggByEmp = new Map<
      string,
      { brut: number; cnps_sal: number; cnps_pat: number; jours: number }
    >();
    for (const b of bulletins) {
      const cur = aggByEmp.get(b.employee_id) ?? {
        brut: 0,
        cnps_sal: 0,
        cnps_pat: 0,
        jours: 0,
      };
      const brut = Number(b.salaire_brut);
      const baseCnps = Math.min(
        Number(b.fiscal_gross ?? brut),
        REFORME_2026.cnps.plafond_mensuel
      );
      cur.brut += brut;
      cur.cnps_sal += Math.round(baseCnps * REFORME_2026.cnps.retraite_salarie);
      cur.cnps_pat += Math.round(baseCnps * REFORME_2026.cnps.retraite_patronal);
      cur.jours += 22;
      aggByEmp.set(b.employee_id, cur);
    }

    const lignes: DisaLigneSalarie[] = Array.from(aggByEmp.entries()).map(
      ([empId, agg]) => {
        const emp = empById.get(empId);
        totalBrut += agg.brut;
        totalCotisations += agg.cnps_sal + agg.cnps_pat;
        nbSalaries++;
        return {
          matricule: emp?.matricule ?? "",
          num_cnps: emp?.num_cnps ?? null,
          full_name: emp?.full_name ?? "",
          date_naissance: emp?.date_naissance ?? null,
          date_embauche: emp?.date_embauche ?? null,
          date_sortie: null,
          total_brut_annuel: agg.brut,
          total_cnps_salarie: agg.cnps_sal,
          total_cnps_patronal: agg.cnps_pat,
          jours_travailles: agg.jours,
        };
      }
    );
    rows = lignes.map((l) => ({
      Matricule: l.matricule,
      "N° CNPS": l.num_cnps ?? "—",
      "Nom & prénoms": l.full_name,
      Naissance: l.date_naissance ?? "—",
      Embauche: l.date_embauche ?? "—",
      Sortie: l.date_sortie ?? "—",
      "Brut annuel": l.total_brut_annuel,
      "CNPS salarié": l.total_cnps_salarie,
      "CNPS patronal": l.total_cnps_patronal,
      "Jours travaillés": l.jours_travailles,
    }));
    csv = generateDisaCsv({
      annee: periode,
      numero_cnps_employeur: companyMeta.cnps_matricule,
      raison_sociale: companyMeta.raison_sociale,
      ncc: companyMeta.ncc,
      lignes,
    });
  } else {
    // ITS_MENSUEL ou ITS_ANNUEL
    columns = ITS_COLUMNS;
    const lignes: ItsLigneSalarie[] = bulletins.map((b) => {
      const emp = empById.get(b.employee_id);
      const brutImposable =
        Number(b.fiscal_gross ?? b.salaire_brut) - Number(b.prime_transport ?? 0);
      const cnpsRetraite = Math.round(
        Math.min(brutImposable, REFORME_2026.cnps.plafond_mensuel) *
          REFORME_2026.cnps.retraite_salarie
      );
      const ligne = buildItsLineFromBulletin({
        matricule: emp?.matricule ?? "",
        full_name: emp?.full_name ?? "",
        ncc_employe: null,
        brut_imposable: brutImposable,
        cnps_retraite: cnpsRetraite,
      });
      totalAssiette += brutImposable;
      totalRetenu += ligne.its + ligne.contribution_nationale;
      nbSalaries++;
      return ligne;
    });
    rows = lignes.map((l) => ({
      Matricule: l.matricule,
      "Nom & prénoms": l.full_name,
      NCC: l.ncc_employe ?? "—",
      "Brut imposable": l.brut_imposable,
      "Abattement 20 %": l.abattement,
      "Base imposable": l.base_imposable,
      ITS: l.its,
      "Contribution Nationale 1,5 %": l.contribution_nationale,
    }));
    csv = generateItsCsv({
      periode,
      ncc_employeur: companyMeta.ncc,
      raison_sociale: companyMeta.raison_sociale,
      lignes,
    });
  }

  const deadline = computeDeadline(kind, periode);
  const totalDu = isSocial ? totalCotisations : totalRetenu;
  const penalite = computePenaltyCnps(totalDu, deadline);

  return {
    kind,
    periode,
    deadline,
    isSocial,
    isMonthly,
    company: companyMeta,
    totals: {
      nb_salaries: nbSalaries,
      total_brut: totalBrut,
      total_cotisations: totalCotisations,
      total_assiette: totalAssiette,
      total_retenu: totalRetenu,
      penalite,
      total_du: totalDu,
    },
    columns,
    rows,
    csv,
  };
}
