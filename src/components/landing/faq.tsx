"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    question: "¿Puedo usar Konto gratis para siempre?",
    answer:
      "Sí, el plan Básico es gratuito sin límite de tiempo. Puedes registrar todos los ingresos y gastos que quieras. Solo si necesitas categorías, dashboard con gráficos o multi-negocio, pasarías a un plan de pago.",
  },
  {
    question: "¿Mis datos están seguros?",
    answer:
      "Absolutamente. Usamos encriptación de nivel bancario y tus datos nunca se comparten con terceros. La base de datos está alojada en servidores seguros con backups automáticos.",
  },
  {
    question: "¿Puedo exportar mis datos?",
    answer:
      "Sí. En el plan Pro puedes exportar a CSV, y en el plan Business también a PDF y Excel. Tus datos siempre son tuyos.",
  },
  {
    question: "¿Qué pasa si quiero cambiar de plan?",
    answer:
      "Puedes subir o bajar de plan en cualquier momento. Si subes, se te cobra la diferencia proporcional. Si bajas, el cambio aplica en el siguiente ciclo de facturación.",
  },
  {
    question: "¿Konto se conecta con mi banco?",
    answer:
      "Por ahora no. Konto está diseñado para registro manual, lo que te da control total y consciencia de cada transacción. Estamos evaluando integraciones bancarias para el futuro.",
  },
  {
    question: "¿Sirve para llevar contabilidad formal?",
    answer:
      "Konto es una herramienta de gestión financiera personal y de negocios, no un software contable. Es ideal para tener claridad sobre tu dinero, pero para declaraciones de impuestos te recomendamos trabajar con un contador.",
  },
];

export function FAQ() {
  return (
    <section id="faq" className="py-20 md:py-28">
      <div className="container mx-auto max-w-3xl px-4">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Preguntas frecuentes
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Todo lo que necesitas saber sobre Konto
          </p>
        </div>

        <Accordion type="single" collapsible className="mt-12">
          {faqs.map((faq, index) => (
            <AccordionItem key={index} value={`item-${index}`}>
              <AccordionTrigger className="text-left">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
