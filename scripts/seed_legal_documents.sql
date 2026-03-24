-- ============================================================
-- SEED -- Documents juridiques CI pour l''Agent RAG
-- Sources : Code du Travail CI (Loi n°2015-532 du 20 juillet 2015)
--           CGI CI, Decrets CNPS, Conventions Collectives CI
-- Les embeddings seront generes par n8n (company_id = NULL = partage)
-- ============================================================

INSERT INTO legal_documents (source, titre, contenu, company_id) VALUES

('Code du Travail CI - Loi n2015-532, Art. 12 a 14',
 'CDD - Duree, renouvellement et conversion en CDI',
 'Le contrat de travail a duree determinee (CDD) ne peut etre conclu que pour l''execution d''une tache precise et temporaire. Sa duree maximale est de deux (2) ans, renouvellements inclus.
Le CDD peut etre renouvele deux (2) fois. Au-dela de deux renouvellements, ou si le salarie continue a travailler apres l''echeance du terme, le contrat est requalifie de plein droit en contrat a duree indeterminee (CDI), avec tous les droits qui en decoulent.
La requalification entraine le droit a l''indemnite de licenciement et a tous avantages reserves aux salaries permanents.
Source : Art. 12, 13 et 14 du Code du Travail CI (Loi n2015-532)',
NULL),

('Code du Travail CI - Loi n2015-532, Art. 14',
 'Periode d''essai - Duree par categorie professionnelle',
 'La periode d''essai est la phase initiale du contrat pendant laquelle chaque partie peut mettre fin au contrat sans preavis ni indemnite.
Durees maximales legales :
- Ouvriers et employes : 1 mois
- Agents de maitrise et techniciens : 3 mois
- Cadres et assimiles : 6 mois
La periode d''essai peut etre renouvelee une fois pour une duree egale. Le renouvellement doit etre expressement prevu au contrat ou par convention collective.
Pendant la periode d''essai, chaque partie peut rompre librement le contrat sans preavis ni indemnite, sauf stipulation contraire de la convention collective.
Source : Art. 14 Code du Travail CI (Loi n2015-532)',
NULL),

('Code du Travail CI - Loi n2015-532, Art. 16',
 'Preavis de rupture du CDI - Licenciement et demission',
 'En cas de rupture du contrat a duree indeterminee (CDI), un preavis doit etre respecte. Sa duree varie selon la categorie professionnelle :
- Periode d''essai : 8 jours
- Ouvriers et employes (toutes categories) : 1 mois
- Agents de maitrise, techniciens, dessinateurs, agents commerciaux : 2 mois
- Cadres, ingenieurs, directeurs, assimiles : 3 mois
Le preavis s''applique aussi bien au licenciement qu''a la demission. Pendant le preavis, le salarie a droit a 2 jours de liberte par semaine pour chercher un emploi, payes par l''employeur.
L''employeur peut dispenser le salarie d''effectuer le preavis, mais doit lui payer une indemnite compensatrice equivalente a la remuneration due pour la duree du preavis.
Source : Art. 16 Code du Travail CI (Loi n2015-532)',
NULL),

('Code du Travail CI - Loi n2015-532, Art. 74',
 'Indemnite de licenciement - Calcul par paliers d''anciennete',
 'Tout salarie licencie sans faute lourde a droit a une indemnite de licenciement calculee en fonction de son anciennete et de son salaire brut mensuel.
Calcul par paliers d''anciennete :
- De 1 a 5 ans d''anciennete : 30 % du salaire mensuel brut par annee de service
- De 6 a 10 ans d''anciennete : 35 % du salaire mensuel brut par annee de service
- 11 ans et plus d''anciennete : 40 % du salaire mensuel brut par annee de service
Exemple : Un salarie avec 8 ans d''anciennete et 200 000 FCFA de salaire brut mensuel percoit :
- 5 premieres annees : 5 x (200 000 x 30%) = 300 000 FCFA
- 3 annees suivantes : 3 x (200 000 x 35%) = 210 000 FCFA
- Total : 510 000 FCFA
Cette indemnite est due en cas de licenciement non fautif, de depart a la retraite, ou de fermeture de l''entreprise. Elle n''est pas due en cas de faute lourde.
Source : Art. 74 Code du Travail CI (Loi n2015-532)',
NULL),

('Code du Travail CI - Loi n2015-532, Art. 75 a 78',
 'Licenciement abusif - Definition et reparation',
 'Est abusif tout licenciement effectue sans motif valable, sans respect de la procedure, ou pour des motifs discriminatoires.
Motifs interdits : appartenance syndicale, activite syndicale, opinion politique, religion, sexe, grossesse, etat de sante, origine nationale.
Procedure de licenciement pour motif personnel : l''employeur doit convoquer le salarie a un entretien prealable par lettre recommandee (au moins 5 jours avant), exposer les motifs, recueillir les explications du salarie, puis notifier la decision par ecrit.
En cas de licenciement abusif, le Tribunal du Travail peut condamner l''employeur a payer des dommages et interets dont le montant minimum equivaut a 3 mois de salaire, sans prejudice des indemnites de licenciement et de preavis.
Delai pour saisir l''Inspection du Travail : 15 jours a compter du licenciement.
Delai de prescription des actions en justice : 2 ans.
Source : Art. 75, 76, 77, 78, 80, 82 Code du Travail CI (Loi n2015-532)',
NULL),

('Code du Travail CI - Loi n2015-532, Art. 25',
 'Conges payes annuels - Droits et calcul',
 'Tout salarie a droit a des conges payes apres une periode minimale de service effectif.
Acquisition des conges :
- 2,2 jours ouvrables de conge par mois de service effectif, soit 26,4 jours par an pour un plein exercice
- Les jours feries tombant pendant les conges ne sont pas comptabilises dans le decompte
Conditions :
- 1 mois de service minimum pour ouvrir droit aux conges
- Le conge doit etre pris dans les 12 mois suivant l''acquisition
Indemnite de conges payes :
- Calculee sur la base du salaire mensuel divise par 26 jours ouvrables, multiplie par le nombre de jours de conge
- En cas de rupture du contrat, le salarie recoit une indemnite compensatrice de conges payes proportionnelle aux droits acquis
Conges speciaux (evenements familiaux) :
- Mariage du salarie : 5 jours
- Naissance d''un enfant (paternite) : 10 jours
- Deces conjoint ou enfant : 5 jours
- Deces pere, mere, beau-parent : 3 jours
Conge maternite : 14 semaines (6 semaines avant et 8 semaines apres l''accouchement), remunere par la CNPS.
Source : Art. 25 et suivants Code du Travail CI (Loi n2015-532)',
NULL),

('Code du Travail CI - Decret n96-287 du 3 avril 1996',
 'Heures supplementaires - Duree legale et majorations',
 'La duree legale du travail est fixee a 40 heures par semaine (8 heures par jour sur 5 jours).
Les heures supplementaires sont celles accomplies au-dela de 40 heures par semaine. Elles doivent etre autorisees par l''Inspection du Travail pour les depassements prolonges.
Majorations applicables :
- 41e a 48e heure (jours ouvrables de semaine) : majoration de 15 % du taux horaire
- Heures effectuees le samedi apres les 40 heures hebdomadaires : majoration de 35 %
- Heures effectuees le dimanche et jours feries : majoration de 50 %
- Heures de nuit (22h a 5h) : majoration specifique selon convention collective
Calcul du taux horaire normal : salaire mensuel brut divise par 173,33 heures (40h x 52 semaines / 12 mois)
Le maximum d''heures supplementaires autorisees est de 20 heures par semaine, sauf derogation de l''Inspection du Travail.
Source : Decret n96-287 du 3 avril 1996 portant duree du travail et heures supplementaires en CI',
NULL),

('CNPS CI - Decret n2012-894 et reglementation en vigueur',
 'CNPS - Taux de cotisations salariales et patronales',
 'La Caisse Nationale de Prevoyance Sociale (CNPS) gere les regimes de retraite, de prevoyance et de famille en Cote d''Ivoire.
Cotisations salariales (prelevees sur le salaire de l''employe) :
- Retraite : 3,2 % du salaire brut
- Prevoyance (invalidite, deces) : 1,2 % du salaire brut
- Total salarie : 4,4 % du salaire brut
Cotisations patronales (a la charge de l''employeur) :
- Retraite : 7,7 % du salaire brut
- Prevoyance : 1,6 % du salaire brut
- Prestations familiales : 5,75 % du salaire brut
- Accidents du travail et maladies professionnelles : 2 a 5 % selon activite
Plafond de cotisation mensuel : 45 fois le SMIG en vigueur
(Sur la base du SMIG de 36 607 FCFA : plafond = 1 647 315 FCFA - a verifier en cas de revision du SMIG)
Les cotisations sont dues des le premier jour d''embauche et versees mensuellement a la CNPS.
Source : Decret n2012-894 du 26 septembre 2012 - CNPS CI',
NULL),

('CGI CI - Code General des Impots, Art. 116 et suivants',
 'ITS - Impot sur les Traitements et Salaires (bareme progressif)',
 'L''Impot sur les Traitements et Salaires (ITS) est retenu a la source par l''employeur et reverse a la Direction Generale des Impots.
Base imposable : Salaire brut moins cotisations CNPS salarie moins abattement forfaitaire de 15 % (frais professionnels)
Bareme progressif mensuel (base sur les tranches annuelles du CGI CI divisees par 12) :
- De 0 a 75 000 FCFA/mois : 0 %
- De 75 001 a 200 000 FCFA/mois : 12 %
- De 200 001 a 350 000 FCFA/mois : 18 %
- De 350 001 a 600 000 FCFA/mois : 25 %
- Au-dela de 600 000 FCFA/mois : 32 %
Attention : Le bareme peut etre revise chaque annee par la Loi de Finances. Verifier la Loi de Finances en vigueur.
L''ITS doit etre declare et verse avant le 15 du mois suivant.
Source : Art. 116 et suivants CGI CI - a verifier avec la Loi de Finances de l''annee en cours',
NULL),

('Code du Travail CI - Loi n2015-532, Art. 91 a 100',
 'Inspection du Travail - Role, saisine et procedure',
 'L''Inspection du Travail est l''organe de controle charge de veiller a l''application de la legislation du travail.
Missions principales :
- Controle des conditions de travail et de securite
- Mediation en cas de litige individuel ou collectif
- Autorisation des licenciements economiques collectifs
Procedure de saisine pour litige individuel :
1. Tentative de conciliation amiable (recommandee avant toute saisine)
2. Depot de la plainte aupres de l''Inspecteur du Travail du ressort geographique
3. Convocation des parties pour tentative de conciliation
4. En cas d''echec, le dossier est transmis au Tribunal du Travail
Delais importants :
- Delai pour saisir l''Inspection du Travail apres un licenciement : 15 jours
- Prescription des actions en paiement de salaires : 2 ans
- Prescription des actions en responsabilite : 3 ans
Le Tribunal du Travail est competent pour tous les litiges nes du contrat de travail.
Source : Art. 80, 82, 91 a 100 Code du Travail CI (Loi n2015-532)',
NULL),

('Code du Travail CI - Loi n2015-532, Art. 81 a 90',
 'Greve - Droit de greve, procedure et consequences',
 'Le droit de greve est un droit constitutionnel reconnu aux salaries en Cote d''Ivoire.
Conditions de legalite d''une greve :
- Preavis obligatoire de 6 jours francs adresse a l''employeur et a l''Inspection du Travail
- Tentative prealable de conciliation devant l''Inspection du Travail
- La greve doit porter sur des revendications professionnelles (salaires, conditions de travail)
Consequences de la greve legale :
- Suspension (et non rupture) du contrat de travail
- Pas de licenciement pour fait de greve legale
- Retenue sur salaire proportionnelle aux heures non travaillees
Greve illicite : engage la responsabilite des grevistes et peut constituer une faute grave justifiant le licenciement.
Lock-out : L''employeur peut fermer l''entreprise en cas de greve illicite ou de force majeure. Il reste tenu de verser les salaires en cas de lock-out fautif.
Source : Art. 81 a 90 Code du Travail CI (Loi n2015-532)',
NULL),

('Convention Collective Interprofessionnelle CI - Revisee',
 'Convention Collective Interprofessionnelle - Principes et application',
 'La Convention Collective Interprofessionnelle (CCI) de Cote d''Ivoire s''applique a l''ensemble des salaries et employeurs des secteurs prive et semi-public, sauf dispositions plus favorables prevues par des conventions sectorielles.
Classification professionnelle :
- Categorie 1-5 : Ouvriers et employes
- Categorie 6-8 : Agents de maitrise et techniciens
- Categorie 9-12 : Cadres, ingenieurs et assimiles
Avantages minimum conventionnels :
- Prime d''anciennete : 2 % du salaire categoriel par annee d''anciennete a partir de la 2e annee, plafonnee a 25 %
- Indemnite de transport : selon bareme conventionnel, exoneree d''ITS dans les limites legales
- Prime de fin d''annee (13e mois) : versee avant le 31 decembre, equivalente a 1/12 du salaire annuel brut (selon entreprise et convention sectorielle)
Les dispositions de la convention collective s''appliquent des lors qu''elles sont plus favorables que la loi. En cas de conflit, la disposition la plus favorable au salarie prevaut.
Source : Convention Collective Interprofessionnelle CI - Ministere de l''Emploi CI',
NULL),

('Code du Travail CI - Loi n2015-532, Art. 41 a 55',
 'Hygiene, securite et sante au travail',
 'L''employeur est responsable de la sante et de la securite de ses salaries sur les lieux de travail.
Obligations de l''employeur :
- Mettre en place un Comite d''Hygiene, de Securite et des Conditions de Travail (CHSCT) dans les entreprises de 50 salaries et plus
- Fournir des equipements de protection individuelle (EPI) adaptes aux risques
- Declarer tout accident du travail a la CNPS dans les 48 heures
- Assurer la visite medicale d''embauche et les visites periodiques annuelles
Accidents du Travail :
- Tout accident survenu par le fait ou a l''occasion du travail est presume accident du travail
- Le salarie victime conserve son salaire pendant l''arret de travail (pris en charge CNPS)
- Les maladies professionnelles ouvrent droit aux memes indemnisations
Medecine du Travail :
- Visite medicale obligatoire avant l''embauche
- Visite annuelle de controle pour tous les salaries
- Le medecin du travail peut prononcer l''inaptitude au poste
Source : Art. 41 a 55 Code du Travail CI (Loi n2015-532)',
NULL);
