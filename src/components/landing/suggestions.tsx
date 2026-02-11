"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { MessageSquare, Send } from "lucide-react";

export function Suggestions() {
  const [suggestion, setSuggestion] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!suggestion.trim()) {
      setMessage({ type: "error", text: "Por favor escribí una sugerencia" });
      return;
    }

    setIsSubmitting(true);
    setMessage(null);

    // Por ahora solo muestra un mensaje de éxito
    // TODO: Implementar guardado en base de datos
    setTimeout(() => {
      setMessage({ type: "success", text: "¡Gracias por tu sugerencia! La tendremos en cuenta." });
      setSuggestion("");
      setIsSubmitting(false);
    }, 1000);
  };

  return (
    <section id="suggestions" className="border-t bg-muted/30 py-20">
      <div className="container mx-auto max-w-3xl px-4">
        <div className="flex flex-col items-center text-center">
          {/* Icon */}
          <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <MessageSquare className="h-8 w-8 text-primary" />
          </div>

          {/* Header */}
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Ayudanos a mejorar
          </h2>
          <p className="mt-4 max-w-2xl text-lg text-muted-foreground">
            Esta aplicación está en desarrollo activo. Tu opinión es fundamental para crear la mejor experiencia.
          </p>

          {/* Form */}
          <form onSubmit={handleSubmit} className="mt-8 w-full">
            <div className="space-y-4">
              <div className="space-y-2 text-left">
                <Label htmlFor="suggestion">
                  ¿Qué te gustaría que agreguemos o mejoremos?
                </Label>
                <Textarea
                  id="suggestion"
                  placeholder="Contanos tu idea, sugerencia o lo que necesités..."
                  value={suggestion}
                  onChange={(e) => setSuggestion(e.target.value)}
                  className="min-h-32 resize-none"
                  disabled={isSubmitting}
                />
              </div>

              <Button
                type="submit"
                size="lg"
                disabled={isSubmitting}
                className="w-full sm:w-auto"
              >
                {isSubmitting ? (
                  "Enviando..."
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Enviar sugerencia
                  </>
                )}
              </Button>

              {message && (
                <p
                  className={`text-sm ${
                    message.type === "success" ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {message.text}
                </p>
              )}
            </div>
          </form>
        </div>
      </div>
    </section>
  );
}
