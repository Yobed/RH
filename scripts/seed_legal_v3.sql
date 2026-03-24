-- ================================================================
-- SEED v3 -- Periode d''essai, CDD, discipline, interim
-- Sources :
--   - Code du Travail CI (Loi n°2015-532, 2025) Art. 14-15, 17
--   - Convention Collective Interprofessionnelle AICI-UGTCI Art. 14, 19, 21
--   - Decret n°96-195 du 7 mars 1996
-- Genere le 2026-03-24
-- ================================================================

INSERT INTO legal_documents (source, titre, contenu, company_id) VALUES

-- ── Periode d''essai detaillee ────────────────────────────────────────
('Decret n°96-195 du 7 mars 1996 -- Convention Collective Interprofessionnelle Art. 14',
 'Periode d''essai -- Durees, renouvellement et delais de prevenance',
 'La periode d''essai permet a chaque partie d''evaluer les competences et l''adequation au poste. Elle peut etre rompue sans preavis ni indemnite.
DUREES MAXIMALES INITIALES (Decret n°96-195) :
- Ouvriers et employes a la journee : 8 jours
- Ouvriers et employes au mois : 1 mois
- Agents de maitrise et techniciens : 2 mois
- Cadres et ingenieurs : 3 mois
- Cadres superieurs : 6 mois
RENOUVELLEMENT : autorise une seule fois, pour une duree egale a la periode initiale. Le renouvellement doit etre prevu au contrat ou par convention collective.
DELAIS DE PREVENANCE pour le renouvellement (informer l''autre partie avant la fin de l''essai) :
- Pour une periode de 8 jours : prevenance de 2 jours avant la fin
- Pour une periode de 1 mois : prevenance de 8 jours avant la fin
- Pour une periode de 2 a 3 mois : prevenance de 15 jours avant la fin
Si la periode d''essai n''est pas renouvelee dans les delais, le contrat devient definitif.
Source : Decret n°96-195 du 7 mars 1996 / Convention Collective Interprofessionnelle Art. 14',
NULL),

-- ── CDD -- Indemnite de fin de contrat ───────────────────────────────
('Code du Travail CI 2025 -- Art. 15.1 a 15.10',
 'CDD -- Indemnite de fin de contrat (prime de precarite)',
 'A l''expiration d''un contrat a duree determinee (CDD), le salarie a droit a une indemnite de fin de contrat dite prime de precarite.
TAUX : 3% de la somme totale des salaires bruts percus pendant toute la duree du contrat (Art. 15.8 CT-CI 2025).
DUREE MAXIMALE DU CDD : 24 mois (2 ans), renouvellements inclus. Au-dela, conversion automatique en CDI.
RENOUVELLEMENT : possible sans limite tant que la duree maximale de 24 mois est respectee.
EXCEPTIONS (cas ou l''indemnite n''est pas due) :
- Refus par le salarie d''un CDI propose par l''employeur avec remuneration au moins equivalente
- Rupture anticipee du CDD a l''initiative du salarie (sauf faute grave de l''employeur)
- Rupture consecutive a une faute lourde du travailleur
CALCUL EXEMPLE : salarie en CDD 12 mois a 200 000 FCFA/mois :
- Total salaires bruts = 12 x 200 000 = 2 400 000 FCFA
- Indemnite = 2 400 000 x 3% = 72 000 FCFA
Source : Code du Travail CI 2025, Titre I, Chapitre 5 (Art. 15.1 a 15.10)',
NULL),

-- ── Sanctions disciplinaires ─────────────────────────────────────────
('Code du Travail CI 2025 -- Art. 17.1 a 17.5',
 'Procedure disciplinaire -- Sanctions, delais et droits du salarie',
 'Tout manquement du salarie a ses obligations peut donner lieu a une sanction disciplinaire. L''employeur doit respecter une procedure stricte.
ECHELLE DES SANCTIONS (du moins grave au plus grave) :
1. Avertissement ecrit
2. Mise a pied temporaire sans salaire de 1 a 3 jours
3. Mise a pied temporaire sans salaire de 4 a 8 jours
4. Licenciement
PROCEDURE OBLIGATOIRE :
- Convocation du salarie pour explication verbale : au moins 72 heures a l''avance
- Droit du salarie d''etre assiste par 1 a 3 delegues du personnel lors de l''explication
- Notification de la sanction : dans les 15 jours ouvrables suivant l''explication
- Prescription de la faute : la faute ne peut etre sanctionnee si elle remonte a plus de 3 mois
- Effacement de la sanction anterieure : une sanction anterieure ne peut etre invoquee si elle date de plus de 6 mois
INTERDICTIONS FORMELLES :
- Les sanctions pecuniaires (amendes ou retenues sur salaire) sont interdites
- La double sanction pour une meme faute est interdite (non bis in idem)
Source : Code du Travail CI 2025, Titre I, Chapitre 7 (Art. 17.1 a 17.5)',
NULL),

-- ── Interim et changement d''emploi ───────────────────────────────────
('Convention Collective Interprofessionnelle AICI-UGTCI -- Art. 19 et 21',
 'Interim et promotion -- Duree maximale et reclassement',
 'Lorsqu''un salarie est appele a assurer temporairement un poste de categorie superieure a la sienne (interim), des regles strictes s''appliquent.
DUREES MAXIMALES D''INTERIM (au-dela desquelles la promotion devient obligatoire) :
- Ouvriers et employes : 1 mois
- Agents de maitrise et techniciens : 3 mois
- Cadres et ingenieurs : 4 mois
CONSEQUENCE AU-DELA DES DUREES : l''employeur est tenu, soit de reclasser definitivement le travailleur dans la categorie superieure, soit de le retablir dans ses anciennes fonctions et sa categorie d''origine.
MUTATION POUR RAISON MEDICALE : le travailleur mute dans une categorie inferieure en raison d''une maladie professionnelle ou d''un accident du travail peut refuser ce derogement. En cas de refus, l''employeur peut rompre le contrat (ce n''est pas un licenciement abusif dans ce cas specifique).
Source : Convention Collective Interprofessionnelle AICI-UGTCI Art. 19 et 21',
NULL),

-- ── Faute lourde et faute grave ──────────────────────────────────────
('Code du Travail CI 2025 -- Art. 16 et 17',
 'Faute grave et faute lourde -- Definition et consequences',
 'Le Code du Travail CI distingue la faute simple, la faute grave et la faute lourde.
FAUTE GRAVE : faute rendant impossible le maintien du salarie dans l''entreprise pendant la duree du preavis. Exemples : insubordination, absence injustifiee repetee, ivresse au travail, vol.
Consequence : licenciement sans preavis mais avec indemnite de licenciement (sauf si la faute est aussi lourde).
FAUTE LOURDE : faute d''une gravite exceptionnelle, impliquant la volonte de nuire a l''employeur ou a l''entreprise. Exemples : sabotage, violence physique, divulgation de secrets professionnels.
Consequences de la faute lourde :
- Rupture immediate du contrat sans preavis
- Pas d''indemnite de licenciement
- Pas d''indemnite de preavis
- La faute lourde prive le salarie de tous ses droits a indemnites, sauf les conges payes acquis
IMPORTANT : c''est a l''employeur de prouver la faute lourde. En cas de doute, le tribunal requalifie en licenciement abusif.
Source : Art. 16 et 17 Code du Travail CI 2025',
NULL);
