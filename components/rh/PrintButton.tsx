"use client";

import { useEffect } from "react";
import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";

export function PrintButton() {
  useEffect(() => {
    // Impression automatique à l'ouverture de la page
    window.print();
  }, []);

  return (
    <Button onClick={() => window.print()} variant="default">
      <Printer className="mr-2 h-4 w-4" />
      Imprimer
    </Button>
  );
}
