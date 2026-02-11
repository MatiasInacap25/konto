import { Navbar, Hero, Features, Pricing, FAQ, Contact, Suggestions, Footer } from "@/components/landing";

// Force dynamic rendering - esta página depende del estado de auth
export const dynamic = "force-dynamic";

export default async function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        <Hero />
        <Features />
        <Pricing />
        <FAQ />
        <Contact />
        <Suggestions />
      </main>
      <Footer />
    </div>
  );
}
