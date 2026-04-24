# Phase 2: Paie Avancée - Context

**Status:** Ready for planning

<domain>
## Phase Boundary
**Goal:** Les RH peuvent calculer les heures supplémentaires, les soldes de fin de contrat (CDI et CDD), produire la masse salariale mensuelle et exporter le journal de paie pour le comptable — tout en respectant les décrets CI en vigueur.
</domain>

<decisions>
## Implementation Decisions

### Heures supplémentaires

- Calculer selon le décret CI n°96-203.
- Gérer 3 taux de majoration : 15%, 50%, 75%.

### Fins de contrat

- Les règles CI appliquent le préavis, l'indemnité de licenciement, et le solde des congés non pris pour les CDI.
- L'indemnité de précarité de 3% s'applique pour les CDD non renouvelés.

### Masse Salariale & Export

- Tableau de bord avec coût réel des salariés (brut + charges).
- Interface d'export du journal d'un mois en CSV ou Excel (pour le comptable).

### Multi-conventions

- Possibilité d'utiliser différentes conventions (CCI, BTP, Commerce) avec une table `fiscal_params` en base.
</decisions>

<canonical_refs>

## Canonical References

- `ROADMAP.md` — Phase 2: Paie Avancée (PAI-01 to PAI-07)
</canonical_refs>

<specifics>
## Specific Ideas
- Implémenter les méthodes pures de calcul dans `lib/paie-ci.ts` (comme `calculerHeuresSup` et `calculerSoldeDeCompte`).
- Afficher les nouveaux calculs en temps réel dans `PaieDialog`.
- Côté base de données, configurer la table `fiscal_params` et l'associer à une gestion de conventions collectives dans `ParametresForm`.
</specifics>

<deferred>
## Deferred Ideas
None
</deferred>
