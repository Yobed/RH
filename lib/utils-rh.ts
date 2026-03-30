// Utilitaires partagés pour les évaluations RH
export function scoreLabel(score: number | null): string {
  if (score === null) return "Non noté";
  if (score >= 90) return "Exceptionnel";
  if (score >= 75) return "Très satisfaisant";
  if (score >= 60) return "Satisfaisant";
  if (score >= 40) return "À améliorer";
  return "Insuffisant";
}

export function scoreVariant(score: number | null): "default" | "secondary" | "outline" | "destructive" {
  if (score === null) return "outline";
  if (score >= 75) return "default";
  if (score >= 40) return "secondary";
  return "destructive";
}
