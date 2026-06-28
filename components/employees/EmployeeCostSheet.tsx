import {
  calculerChargesPatronales,
  calculerBulletinComplet,
  type ChargesPatronales,
} from "@/lib/paie-ci";

const fmt = (n: number) =>
  new Intl.NumberFormat("fr-CI", {
    style: "currency",
    currency: "XOF",
    minimumFractionDigits: 0,
  }).format(n);

interface EmployeeCostSheetProps {
  salaireBrut: number;
  sursalaire?: number | null;
  primeExceptionnelle?: number | null;
  primeSalissure?: number | null;
  primeDepassement?: number | null;
  primeFonction?: number | null;
  primeTransport?: number | null;
  primeAnciennete?: number | null;
  tauxAtMp?: number;
}

interface LigneCalcul {
  label: string;
  montant: number;
  type: "gain" | "retenue_salarie" | "charge_patronale" | "total";
}

function LigneRow({
  label,
  montant,
  type,
}: {
  label: string;
  montant: number;
  type: LigneCalcul["type"];
}) {
  const colorClass =
    type === "gain"
      ? "text-foreground"
      : type === "retenue_salarie"
      ? "text-red-600"
      : type === "charge_patronale"
      ? "text-orange-600"
      : "text-slate-700 font-bold";

  const prefix =
    type === "retenue_salarie" ? "−" : type === "charge_patronale" ? "+" : "";

  return (
    <div className="flex items-center justify-between py-1.5 border-b last:border-0">
      <span
        className={`text-sm ${type === "total" ? "font-bold" : "text-muted-foreground"}`}
      >
        {label}
      </span>
      <span className={`text-sm font-medium ${colorClass}`}>
        {prefix} {fmt(montant)}
      </span>
    </div>
  );
}

export function EmployeeCostSheet({
  salaireBrut,
  sursalaire,
  primeExceptionnelle,
  primeSalissure,
  primeDepassement,
  primeFonction,
  primeTransport,
  primeAnciennete,
  tauxAtMp = 0.03, // Valeur par défaut de 3%
}: EmployeeCostSheetProps) {
  const totalBrut =
    salaireBrut +
    (sursalaire ?? 0) +
    (primeExceptionnelle ?? 0) +
    (primeSalissure ?? 0) +
    (primeDepassement ?? 0) +
    (primeFonction ?? 0) +
    (primeTransport ?? 0) +
    (primeAnciennete ?? 0);

  // Calcul du bulletin salarié (retenues salariales)
  const bulletin = calculerBulletinComplet({
    salaire_brut: salaireBrut,
    sursalaire: sursalaire ?? 0,
    prime_anciennete: primeAnciennete ?? 0,
    prime_exceptionnelle: primeExceptionnelle ?? 0,
    prime_salissure: primeSalissure ?? 0,
    prime_depassement: primeDepassement ?? 0,
    prime_fonction: primeFonction ?? 0,
    prime_transport: primeTransport ?? 0,
  });

  // Charges patronales sur le brut de base (hors transport, non soumis)
  const chargesPatronales: ChargesPatronales = calculerChargesPatronales(
    bulletin.total_imposable,
    tauxAtMp
  );

  // Coût total employeur
  const coutTotalEmployeur = totalBrut + chargesPatronales.total;

  return (
    <div className="space-y-4">
      {/* Alerte légale */}
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
        <p className="font-medium">Taux AT/MP indicatif</p>
        <p>
          Le taux accidents du travail (3%) est un taux moyen. Le taux exact
          dépend de votre secteur d&apos;activité CNPS CI.
        </p>
      </div>

      {/* Éléments de rémunération */}
      <div className="rounded-lg border bg-white p-4">
        <h4 className="text-sm font-semibold mb-3">
          Éléments de rémunération brute
        </h4>
        <LigneRow label="01 Salaire de base" montant={salaireBrut} type="gain" />
        {(sursalaire ?? 0) > 0 && (
          <LigneRow label="02 Sursalaire" montant={sursalaire!} type="gain" />
        )}
        {(primeAnciennete ?? 0) > 0 && (
          <LigneRow
            label="03 Prime d'ancienneté"
            montant={primeAnciennete!}
            type="gain"
          />
        )}
        {(primeExceptionnelle ?? 0) > 0 && (
          <LigneRow
            label="04 Prime exceptionnelle"
            montant={primeExceptionnelle!}
            type="gain"
          />
        )}
        {(primeSalissure ?? 0) > 0 && (
          <LigneRow
            label="05 Prime de salissure"
            montant={primeSalissure!}
            type="gain"
          />
        )}
        {(primeDepassement ?? 0) > 0 && (
          <LigneRow
            label="06 Prime de dépassement"
            montant={primeDepassement!}
            type="gain"
          />
        )}
        {(primeFonction ?? 0) > 0 && (
          <LigneRow
            label="07 Prime de fonction"
            montant={primeFonction!}
            type="gain"
          />
        )}
        {(primeTransport ?? 0) > 0 && (
          <LigneRow
            label="08 Indemnité transport (non imposable)"
            montant={primeTransport!}
            type="gain"
          />
        )}
        <div className="flex items-center justify-between py-2 mt-1 border-t">
          <span className="text-sm font-semibold">Total brut</span>
          <span className="text-sm font-bold">{fmt(totalBrut)}</span>
        </div>
      </div>

      {/* Retenues salariales */}
      <div className="rounded-lg border bg-white p-4">
        <h4 className="text-sm font-semibold mb-3 text-red-700">
          Retenues salariales (à la charge du salarié)
        </h4>
        <LigneRow
          label="CNPS retraite salarié (6,3%)"
          montant={bulletin.cnps_salarie}
          type="retenue_salarie"
        />
        <LigneRow
          label="CMU salariale (forfait 1 600 FCFA)"
          montant={bulletin.cmu}
          type="retenue_salarie"
        />
        <LigneRow
          label="ITS (barème progressif)"
          montant={bulletin.its}
          type="retenue_salarie"
        />
        <div className="flex items-center justify-between py-2 mt-1 border-t">
          <span className="text-sm font-semibold text-red-700">
            Total retenues salariales
          </span>
          <span className="text-sm font-bold text-red-700">
            − {fmt(bulletin.total_retenues)}
          </span>
        </div>
        <div className="flex items-center justify-between py-2 border-t border-dashed">
          <span className="text-sm font-semibold text-emerald-700">
            Salaire net à payer
          </span>
          <span className="text-sm font-bold text-emerald-700">
            {fmt(bulletin.salaire_net)}
          </span>
        </div>
      </div>

      {/* Charges patronales */}
      <div className="rounded-lg border bg-white p-4">
        <h4 className="text-sm font-semibold mb-3 text-orange-700">
          Charges patronales CNPS CI (à la charge de l&apos;entreprise)
        </h4>
        <LigneRow
          label="Retraite patronale (7,7% — plafond 1 647 315 FCFA)"
          montant={chargesPatronales.retraite}
          type="charge_patronale"
        />
        <LigneRow
          label="Prestations familiales (5% — plafond 70 000 FCFA)"
          montant={chargesPatronales.familiales}
          type="charge_patronale"
        />
        <LigneRow
          label="Accidents maternité (0,75%)"
          montant={chargesPatronales.maternite}
          type="charge_patronale"
        />
        <LigneRow
          label="AT/MP (3% taux moyen)"
          montant={chargesPatronales.at_mp}
          type="charge_patronale"
        />
        <LigneRow
          label="FDFP (1%)"
          montant={chargesPatronales.fdfp}
          type="charge_patronale"
        />
        <LigneRow
          label="CMU patronale (forfait 1 600 FCFA)"
          montant={chargesPatronales.cmu}
          type="charge_patronale"
        />
        <div className="flex items-center justify-between py-2 mt-1 border-t">
          <span className="text-sm font-semibold text-orange-700">
            Total charges patronales
          </span>
          <span className="text-sm font-bold text-orange-700">
            + {fmt(chargesPatronales.total)}
          </span>
        </div>
      </div>

      {/* Synthèse coût total */}
      <div className="rounded-lg border-2 border-slate-200 bg-slate-50 p-4">
        <h4 className="text-sm font-semibold text-slate-800 mb-3">
          Synthèse — Coût réel employeur
        </h4>
        <div className="space-y-1.5 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Brut total</span>
            <span className="font-medium">{fmt(totalBrut)}</span>
          </div>
          <div className="flex justify-between text-orange-600">
            <span>+ Charges patronales</span>
            <span className="font-medium">+ {fmt(chargesPatronales.total)}</span>
          </div>
          <div className="flex justify-between pt-2 border-t border-slate-200">
            <span className="font-bold text-slate-800 text-base">
              Coût total employeur
            </span>
            <span className="font-bold text-slate-800 text-base">
              {fmt(coutTotalEmployeur)}
            </span>
          </div>
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>dont net salarié</span>
            <span>{fmt(bulletin.salaire_net)}</span>
          </div>
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>dont charges totales (salarié + patronal)</span>
            <span>
              {fmt(bulletin.total_retenues + chargesPatronales.total)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
