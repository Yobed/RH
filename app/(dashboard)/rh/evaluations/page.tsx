import PerformanceReviewManager from "@/components/rh/PerformanceReviewManager";
import { Suspense } from "react";

export const metadata = {
  title: "Performance & Évaluations — RH Manager CI",
  description: "Gestion des entretiens périodiques, des périodes d'essai et de la mobilité interne.",
};

export default function EvaluationsPage() {
  return (
    <div className="container mx-auto p-4 lg:p-8">
      <Suspense fallback={
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      }>
        <PerformanceReviewManager />
      </Suspense>
    </div>
  );
}
