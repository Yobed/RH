-- ================================================================
-- SEED v2 -- Documents juridiques CI pour l''Agent RAG
-- Sources verifiees :
--   - Code du Travail CI (Loi n°2015-532, mis a jour 2025)
--   - Convention Collective Interprofessionnelle AICI-UGTCI
--   - Decret n°96-200, 96-201, 96-203 du 7 mars 1996
--   - Decret n°2022-986 (SMIG 75 000 FCFA au 01/01/2023)
-- Genere le 2026-03-24
-- ================================================================

INSERT INTO legal_documents (source, titre, contenu, company_id) VALUES

-- ── SMIG ─────────────────────────────────────────────────────────────
('Decret n°2022-986 du Ministere de l''Emploi CI',
 'SMIG -- Salaire Minimum Interprofessionnel Garanti',
 'Le Salaire Minimum Interprofessionnel Garanti (SMIG) est fixe a 75 000 FCFA par mois depuis le 1er janvier 2023.
Source legale : Decret n°2022-986.
Le SMIG est la remuneration minimale que tout employeur doit verser a ses salaries. Aucun salaire ne peut etre inferieur au SMIG.
Le SMIG peut etre revise par decret du Ministere charge du Travail. Toujours verifier le decret en vigueur.
Calcul horaire du SMIG : 75 000 FCFA / 173,33 heures = environ 433 FCFA/heure.',
NULL),

-- ── CDD ──────────────────────────────────────────────────────────────
('Code du Travail CI -- Loi n°2015-532, Art. 12 a 14',
 'CDD -- Duree, renouvellement et conversion en CDI',
 'Le contrat de travail a duree determinee (CDD) ne peut etre conclu que pour l''execution d''une tache precise et temporaire. Sa duree maximale est de deux (2) ans, renouvellements inclus.
Le CDD peut etre renouvele deux (2) fois. Au-dela de deux renouvellements, ou si le salarie continue a travailler apres l''echeance du terme, le contrat est requalifie de plein droit en contrat a duree indeterminee (CDI).
La requalification entraine le droit a l''indemnite de licenciement et a tous avantages reserves aux salaries permanents.
Source : Art. 12, 13 et 14 du Code du Travail CI (Loi n°2015-532)',
NULL),

-- ── Periode d''essai ──────────────────────────────────────────────────
('Code du Travail CI -- Loi n°2015-532, Art. 14',
 'Periode d''essai -- Duree par categorie professionnelle',
 'La periode d''essai est la phase initiale du contrat pendant laquelle chaque partie peut mettre fin au contrat sans preavis ni indemnite.
Durees maximales legales :
- Ouvriers et employes (categories 1 a 5) : 1 mois
- Agents de maitrise et techniciens (categories 6 a 8) : 3 mois
- Cadres et assimiles (categories 9 et au-dessus) : 6 mois
La periode d''essai peut etre renouvelee une fois pour une duree egale. Le renouvellement doit etre expressement prevu au contrat ou par convention collective.
Pendant la periode d''essai, chaque partie peut rompre librement le contrat sans preavis ni indemnite, sauf stipulation contraire de la convention collective.
Source : Art. 14 Code du Travail CI (Loi n°2015-532)',
NULL),

-- ── Preavis CDI ───────────────────────────────────────────────────────
('Decret n°96-200 du 7 mars 1996 -- Convention Collective Interprofessionnelle Art. 34',
 'Preavis de rupture du CDI -- Licenciement et demission',
 'En cas de rupture du contrat a duree indeterminee (CDI), un preavis doit etre respecte. Sa duree varie selon la categorie professionnelle et l''anciennete :
- Ouvriers et employes (categories 1 a 5) : minimum 8 jours, maximum 4 mois selon anciennete
- Agents de maitrise, techniciens (categorie 6 et au-dessus) : minimum 3 mois, maximum 4 mois selon anciennete
- Cadres, ingenieurs, directeurs : minimum 3 mois, maximum 4 mois selon anciennete
Le preavis s''applique aussi bien au licenciement qu''a la demission. Pendant le preavis, le salarie a droit a 2 jours de liberte par semaine pour chercher un emploi, payes par l''employeur.
L''employeur peut dispenser le salarie d''effectuer le preavis, mais doit lui payer une indemnite compensatrice equivalente a la remuneration due pour la duree du preavis.
Source : Decret n°96-200 du 7 mars 1996 / Convention Collective Interprofessionnelle Art. 34',
NULL),

-- ── Indemnite licenciement ────────────────────────────────────────────
('Decret n°96-201 du 7 mars 1996 -- Convention Collective Interprofessionnelle Art. 39',
 'Indemnite de licenciement -- Calcul par paliers d''anciennete',
 'Tout salarie licencie sans faute lourde a droit a une indemnite de licenciement.
BASE DE CALCUL : salaire global mensuel moyen des 12 mois d''activite qui ont precede la date de licenciement (et non le salaire actuel seul).
Calcul par paliers d''anciennete :
- De 1 a 5 ans d''anciennete : 30% du salaire moyen mensuel par annee de service
- De 6 a 10 ans d''anciennete : 35% du salaire moyen mensuel par annee de service
- 11 ans et plus d''anciennete : 40% du salaire moyen mensuel par annee de service
Exemple : salarie avec 8 ans d''anciennete, salaire moyen 200 000 FCFA :
- 5 premieres annees : 5 x (200 000 x 30%) = 300 000 FCFA
- 3 annees suivantes : 3 x (200 000 x 35%) = 210 000 FCFA
- Total : 510 000 FCFA
Cas particulier : indemnite de depart a la retraite plafonnee a 25 fois le SMIG annuel (calcule sur 2080 heures).
L''indemnite de licenciement n''est pas due en cas de faute lourde.
Source : Decret n°96-201 du 7 mars 1996 / Convention Collective Interprofessionnelle Art. 39',
NULL),

-- ── Licenciement abusif ───────────────────────────────────────────────
('Code du Travail CI -- Loi n°2015-532, Art. 75 a 78',
 'Licenciement abusif -- Definition et reparation',
 'Est abusif tout licenciement effectue sans motif valable, sans respect de la procedure, ou pour des motifs discriminatoires.
Motifs interdits : appartenance syndicale, activite syndicale, opinion politique, religion, sexe, grossesse, etat de sante, origine nationale.
Procedure de licenciement pour motif personnel : l''employeur doit convoquer le salarie a un entretien prealable par lettre recommandee (au moins 5 jours avant), exposer les motifs, recueillir les explications, puis notifier la decision par ecrit.
En cas de licenciement abusif, le Tribunal du Travail peut condamner l''employeur a des dommages et interets (minimum 3 mois de salaire), sans prejudice des indemnites de licenciement et de preavis.
Delai pour saisir l''Inspection du Travail : 15 jours a compter du licenciement.
Prescription des actions en justice : 2 ans.
Source : Art. 75, 76, 77, 78 Code du Travail CI (Loi n°2015-532)',
NULL),

-- ── Conges payes ─────────────────────────────────────────────────────
('Ordonnance n°2021-902 (Art. 25.2 CT-CI) -- Convention Collective Interprofessionnelle Art. 69',
 'Conges payes annuels -- Droits, calcul et majorations d''anciennete',
 'Tout salarie a droit a des conges payes apres une periode minimale de service effectif.
Acquisition des conges : 2,2 jours ouvrables de conge par mois de service effectif, soit 26,4 jours par an pour un plein exercice.
Majorations pour anciennete (jours supplementaires par annee complete) :
- A partir de 5 ans : +1 jour
- A partir de 10 ans : +2 jours
- A partir de 15 ans : +3 jours
- A partir de 20 ans : +5 jours
- A partir de 25 ans : +7 jours
- A partir de 30 ans : +8 jours
Les meres salariees ont droit a 2 jours supplementaires par enfant a charge.
Indemnite de conges payes : salaire mensuel divise par 26 jours ouvrables, multiplie par le nombre de jours de conge acquis.
En cas de rupture du contrat, le salarie recoit une indemnite compensatrice de conges payes proportionnelle aux droits acquis.
Source : Ordonnance n°2021-902 / Convention Collective Interprofessionnelle Art. 69',
NULL),

-- ── Conges evenements familiaux ───────────────────────────────────────
('Convention Collective Interprofessionnelle AICI-UGTCI -- Art. 69',
 'Permissions exceptionnelles -- Evenements familiaux',
 'Des permissions exceptionnelles payees sont accordees pour evenements familiaux. Limite globale : 10 jours ouvrables par an.
Tableau des permissions :
- Mariage du salarie : 4 jours
- Mariage d''un enfant du salarie : 2 jours
- Mariage d''un frere ou d''une soeur du salarie : 2 jours
- Deces du conjoint : 5 jours
- Deces d''un enfant : 5 jours
- Deces du pere ou de la mere du salarie : 5 jours
- Deces d''un frere ou d''une soeur : 2 jours
- Deces du beau-pere ou de la belle-mere : 2 jours
- Naissance d''un enfant : 2 jours
- Bapteme ou premiere communion d''un enfant : 1 jour
- Demenagement : 1 jour
Ces permissions sont accordees sous reserve de justificatifs et ne se cumulent pas avec les conges annuels.
Source : Convention Collective Interprofessionnelle AICI-UGTCI Art. 69',
NULL),

-- ── Conge maternite ───────────────────────────────────────────────────
('Code du Travail CI -- Loi n°2015-532, Art. 23',
 'Conge de maternite -- Duree et remuneration',
 'La salariee enceinte a droit a un conge de maternite de 14 semaines : 6 semaines avant l''accouchement et 8 semaines apres.
En cas de naissance multiple (jumeaux, triplees, etc.) : le conge est prolonge de 2 semaines supplementaires.
Pendant le conge de maternite, le contrat de travail est suspendu. La salariee est remuneree par la CNPS (indemnites journalieres de maternite).
Il est interdit de licencier une salariee pendant son conge de maternite et durant les 4 semaines qui suivent.
La salariee qui allaite dispose d''une heure par jour pendant les 15 premiers mois suivant la naissance.
Source : Art. 23 et suivants Code du Travail CI (Loi n°2015-532)',
NULL),

-- ── Heures supplementaires ────────────────────────────────────────────
('Decret n°96-203 du 7 mars 1996',
 'Heures supplementaires -- Duree legale et majorations',
 'La duree legale du travail est fixee a 40 heures par semaine (8 heures par jour sur 5 jours) pour les entreprises non agricoles.
Les heures supplementaires sont les heures effectuees au-dela de 40 heures par semaine.
Majorations obligatoires (Decret n°96-203) :
- De la 41e a la 46e heure en semaine : majoration de 15%
- Au-dela de la 46e heure en semaine : majoration de 50%
- Dimanche : majoration de 75%
- Jours feries : majoration de 75%
- Heures de nuit (periode de 8 heures consecutives entre 21h et 5h) : majoration de 75%
- Dimanche et jours feries de nuit : majoration de 100%
Calcul du taux horaire normal : salaire mensuel brut divise par 173,33 heures (40h x 52 / 12).
Le plafond d''heures supplementaires autorisees est de 20 heures par semaine, sauf derogation de l''Inspection du Travail.
Source : Decret n°96-203 du 7 mars 1996 portant duree du travail',
NULL),

-- ── CNPS ─────────────────────────────────────────────────────────────
('CNPS CI -- Reglementation en vigueur',
 'CNPS -- Cotisations et couverture sociale',
 'La Caisse Nationale de Prevoyance Sociale (CNPS) gere les regimes de retraite, de prevoyance et de famille en Cote d''Ivoire.
Branches principales : retraite, prevoyance invalidite-deces, prestations familiales, accidents du travail.
Le SMIG est fixe a 75 000 FCFA/mois (Decret n°2022-986 du 01/01/2023).
Plafond de cotisation : non specifie explicitement dans le CT-CI 2025. Se baser sur les textes reglementaires CNPS en vigueur.
Les cotisations sont dues des le premier jour d''embauche et versees mensuellement a la CNPS.
Tout employeur doit immatriculer ses salaries aupres de la CNPS des l''embauche.
Accident du travail : doit etre declare a la CNPS dans les 48 heures.
Source : Reglementation CNPS CI -- a verifier directement aupres de la CNPS pour les taux exacts',
NULL),

-- ── ITS ───────────────────────────────────────────────────────────────
('CGI CI -- Code General des Impots, Art. 116 et suivants',
 'ITS -- Impot sur les Traitements et Salaires',
 'L''Impot sur les Traitements et Salaires (ITS) est retenu a la source par l''employeur et reverse a la Direction Generale des Impots (DGI) avant le 15 du mois suivant.
Le Code du Travail CI 2025 mentionne l''obligation de retenue a la source mais ne detaille pas le bareme. Le bareme ITS figure dans le Code General des Impots (CGI CI).
La base imposable est calculee apres deduction des cotisations salariales (CNPS) et d''un abattement forfaitaire au titre des frais professionnels.
Le bareme ITS est progressif et peut etre revise chaque annee par la Loi de Finances.
Obligation de l''employeur : declarer et verser l''ITS avant le 15 du mois suivant la paie.
Source : Art. 116 et suivants CGI CI -- verifier le bareme avec la Loi de Finances de l''annee en cours aupres de la DGI CI',
NULL),

-- ── Inspection du Travail ─────────────────────────────────────────────
('Code du Travail CI -- Loi n°2015-532, Art. 91 a 100',
 'Inspection du Travail -- Role, saisine et procedure',
 'L''Inspection du Travail est l''organe de controle charge de veiller a l''application de la legislation du travail.
Missions : controle des conditions de travail, mediation en cas de litige, autorisation des licenciements economiques collectifs.
Procedure de saisine pour litige individuel :
1. Tentative de conciliation amiable (recommandee)
2. Depot de la plainte aupres de l''Inspecteur du Travail territorialement competent
3. Convocation des parties pour tentative de conciliation
4. En cas d''echec, le dossier est transmis au Tribunal du Travail
Delais importants :
- Saisine de l''Inspection apres un licenciement : 15 jours
- Prescription en paiement de salaires : 2 ans
- Prescription en responsabilite : 3 ans
Le Tribunal du Travail est competent pour tous les litiges nes du contrat de travail.
Source : Art. 80, 82, 91 a 100 Code du Travail CI (Loi n°2015-532)',
NULL),

-- ── Greve ─────────────────────────────────────────────────────────────
('Code du Travail CI -- Loi n°2015-532, Art. 81 a 90',
 'Greve -- Droit de greve, procedure et consequences',
 'Le droit de greve est un droit constitutionnel reconnu aux salaries en Cote d''Ivoire.
Conditions de legalite d''une greve :
- Preavis obligatoire de 6 jours francs adresse a l''employeur et a l''Inspection du Travail
- Tentative prealable de conciliation devant l''Inspection du Travail
- La greve doit porter sur des revendications professionnelles (salaires, conditions de travail)
Consequences de la greve legale :
- Suspension (et non rupture) du contrat de travail
- Pas de licenciement pour fait de greve legale
- Retenue sur salaire proportionnelle aux heures non travaillees
Greve illicite : engage la responsabilite des grevistes, peut constituer une faute grave.
Lock-out : L''employeur peut fermer l''entreprise en cas de greve illicite ou de force majeure.
Source : Art. 81 a 90 Code du Travail CI (Loi n°2015-532)',
NULL),

-- ── Convention Collective ──────────────────────────────────────────────
('Convention Collective Interprofessionnelle AICI-UGTCI',
 'Convention Collective Interprofessionnelle -- Principes et classification',
 'La Convention Collective Interprofessionnelle (CCI) AICI-UGTCI s''applique a l''ensemble des salaries et employeurs des secteurs prive et semi-public, sauf dispositions plus favorables prevues par des conventions sectorielles.
Classification professionnelle :
- Categories 1 a 5 : Ouvriers et employes
- Categorie 6 et au-dessus : Agents de maitrise, techniciens, cadres
Avantages minimum conventionnels :
- Prime d''anciennete : 2% du salaire categoriel par annee d''anciennete a partir de la 2e annee, plafonnee a 25%
- Indemnite de transport : selon bareme conventionnel
- Prime de fin d''annee (13e mois) : selon entreprise et convention sectorielle
La convention s''applique des lors que ses dispositions sont plus favorables que la loi.
En cas de conflit entre loi et convention, la disposition la plus favorable au salarie prevaut.
Source : Convention Collective Interprofessionnelle AICI-UGTCI',
NULL),

-- ── Hygiene et securite ───────────────────────────────────────────────
('Code du Travail CI -- Loi n°2015-532, Art. 41 a 55',
 'Hygiene, securite et sante au travail',
 'L''employeur est responsable de la sante et de la securite de ses salaries sur les lieux de travail.
Obligations de l''employeur :
- Mettre en place un Comite d''Hygiene, de Securite et des Conditions de Travail (CHSCT) dans les entreprises de 50 salaries et plus
- Fournir des equipements de protection individuelle (EPI) adaptes aux risques
- Declarer tout accident du travail a la CNPS dans les 48 heures
- Assurer la visite medicale d''embauche et les visites periodiques annuelles
Accidents du Travail :
- Tout accident survenu par le fait ou a l''occasion du travail est presume accident du travail
- Le salarie victime conserve son salaire pendant l''arret (pris en charge CNPS)
- Les maladies professionnelles ouvrent droit aux memes indemnisations
Medecine du Travail :
- Visite medicale obligatoire avant l''embauche
- Visite annuelle de controle pour tous les salaries
Source : Art. 41 a 55 Code du Travail CI (Loi n°2015-532)',
NULL);
