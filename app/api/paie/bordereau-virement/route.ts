import { createServerClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { z } from "zod";

export const dynamic = "force-dynamic";

const schema = z.object({
  periode: z.string().regex(/^\d{4}-\d{2}$/, "Format YYYY-MM"),
  format_export: z.enum(["CSV", "XML_SCT", "OFX"]).default("CSV"),
  banque_destinatrice: z.string().max(120).optional(),
});

interface BulletinRow {
  employee_id: string;
  net_to_pay: number | null;
  salaire_net: number | null;
}

interface EmployeeRow {
  id: string;
  matricule: string;
  full_name: string;
  rib: string | null;
  mobile_money: string | null;
}

function escapeCsv(v: string): string {
  if (v == null) return "";
  const s = String(v);
  if (s.includes(";") || s.includes("\"") || s.includes("\n")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function buildCsv(periode: string, lines: Array<{ employee: EmployeeRow; montant: number }>): string {
  const rows = [
    ["Matricule", "Beneficiaire", "RIB_IBAN", "Mobile_Money", "Montant_FCFA", "Libelle"].join(";"),
  ];
  for (const l of lines) {
    rows.push(
      [
        escapeCsv(l.employee.matricule),
        escapeCsv(l.employee.full_name),
        escapeCsv(l.employee.rib ?? ""),
        escapeCsv(l.employee.mobile_money ?? ""),
        Math.round(l.montant).toString(),
        escapeCsv(`Salaire ${periode}`),
      ].join(";")
    );
  }
  const total = lines.reduce((s, l) => s + Math.round(l.montant), 0);
  rows.push("");
  rows.push(`#;TOTAL;${lines.length} virements;;${total};Salaires ${periode}`);
  return rows.join("\n");
}

function buildXmlSct(periode: string, lines: Array<{ employee: EmployeeRow; montant: number }>, debtor: { name: string; iban: string | null }): string {
  const total = lines.reduce((s, l) => s + Math.round(l.montant), 0);
  const msgId = `RHM-${periode}-${Date.now()}`;
  const txs = lines
    .filter((l) => l.employee.rib)
    .map((l, i) => {
      return `      <CdtTrfTxInf>
        <PmtId><EndToEndId>${msgId}-${String(i + 1).padStart(4, "0")}</EndToEndId></PmtId>
        <Amt><InstdAmt Ccy="XOF">${Math.round(l.montant)}</InstdAmt></Amt>
        <CdtrAcct><Id><IBAN>${l.employee.rib}</IBAN></Id></CdtrAcct>
        <Cdtr><Nm>${escapeXml(l.employee.full_name)}</Nm></Cdtr>
        <RmtInf><Ustrd>Salaire ${periode} - ${escapeXml(l.employee.matricule)}</Ustrd></RmtInf>
      </CdtTrfTxInf>`;
    })
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<Document xmlns="urn:iso:std:iso:20022:tech:xsd:pain.001.001.03">
  <CstmrCdtTrfInitn>
    <GrpHdr>
      <MsgId>${msgId}</MsgId>
      <CreDtTm>${new Date().toISOString()}</CreDtTm>
      <NbOfTxs>${lines.filter((l) => l.employee.rib).length}</NbOfTxs>
      <CtrlSum>${total}</CtrlSum>
      <InitgPty><Nm>${escapeXml(debtor.name)}</Nm></InitgPty>
    </GrpHdr>
    <PmtInf>
      <PmtInfId>${msgId}-PMT</PmtInfId>
      <PmtMtd>TRF</PmtMtd>
      <ReqdExctnDt>${new Date().toISOString().slice(0, 10)}</ReqdExctnDt>
      <Dbtr><Nm>${escapeXml(debtor.name)}</Nm></Dbtr>
      <DbtrAcct><Id>${debtor.iban ? `<IBAN>${debtor.iban}</IBAN>` : "<Othr><Id>UNKNOWN</Id></Othr>"}</Id></DbtrAcct>
${txs}
    </PmtInf>
  </CstmrCdtTrfInitn>
</Document>`;
}

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export async function POST(req: Request): Promise<NextResponse> {
  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  let body: unknown;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "Corps invalide" }, { status: 400 });
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
  }
  const { periode, format_export, banque_destinatrice } = parsed.data;

  const { data: companyId } = await supabase.rpc("get_user_company_id");
  if (!companyId) return NextResponse.json({ error: "Entreprise introuvable" }, { status: 403 });

  const { data: company } = await supabase
    .from("companies")
    .select("name, raison_sociale")
    .eq("id", companyId as string)
    .single();

  // Récupérer les bulletins du mois
  const { data: bulletins } = await supabase
    .from("bulletins_paie")
    .select("employee_id, net_to_pay, salaire_net")
    .eq("company_id", companyId as string)
    .eq("periode", periode);

  if (!bulletins || bulletins.length === 0) {
    return NextResponse.json(
      { error: `Aucun bulletin pour la période ${periode}.` },
      { status: 422 }
    );
  }

  const employeeIds = Array.from(new Set(bulletins.map((b) => b.employee_id)));
  const { data: employees } = await supabase
    .from("employees")
    .select("id, matricule, full_name, rib, mobile_money")
    .in("id", employeeIds);

  const empById = new Map((employees ?? []).map((e) => [e.id, e as EmployeeRow]));

  const lines = (bulletins as BulletinRow[])
    .map((b) => {
      const emp = empById.get(b.employee_id);
      if (!emp) return null;
      const montant = Number(b.net_to_pay ?? b.salaire_net ?? 0);
      return montant > 0 ? { employee: emp, montant } : null;
    })
    .filter((l): l is { employee: EmployeeRow; montant: number } => l !== null);

  const nbRibManquants = lines.filter((l) => !l.employee.rib && !l.employee.mobile_money).length;
  const total = lines.reduce((s, l) => s + Math.round(l.montant), 0);

  let content = "";
  let mime = "text/csv; charset=utf-8";
  let ext = "csv";
  if (format_export === "XML_SCT") {
    content = buildXmlSct(periode, lines, {
      name: company?.raison_sociale ?? company?.name ?? "Entreprise",
      iban: null,
    });
    mime = "application/xml; charset=utf-8";
    ext = "xml";
  } else {
    content = buildCsv(periode, lines);
  }

  // Archiver
  const { data: bordereau, error } = await supabase
    .from("bank_transfers")
    .upsert(
      {
        company_id: companyId as string,
        periode,
        format_export,
        total_montant: total,
        nb_virements: lines.length,
        nb_rib_manquants: nbRibManquants,
        banque_destinatrice: banque_destinatrice ?? null,
        date_generation: new Date().toISOString(),
        created_by: user.id,
        details: { warnings: nbRibManquants },
      },
      { onConflict: "company_id,periode,format_export" }
    )
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const filename = `bordereau_${periode}.${ext}`;
  return new NextResponse(content, {
    status: 200,
    headers: {
      "Content-Type": mime,
      "Content-Disposition": `attachment; filename="${filename}"`,
      "X-Bordereau-Id": bordereau.id,
      "X-Total": String(total),
      "X-RIB-Missing": String(nbRibManquants),
    },
  });
}

export async function GET(): Promise<NextResponse> {
  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  const { data: companyId } = await supabase.rpc("get_user_company_id");
  if (!companyId) return NextResponse.json({ error: "Entreprise introuvable" }, { status: 403 });

  const { data } = await supabase
    .from("bank_transfers")
    .select("*")
    .eq("company_id", companyId as string)
    .order("date_generation", { ascending: false })
    .limit(50);
  return NextResponse.json(data ?? []);
}
