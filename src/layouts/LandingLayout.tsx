import Header from "../components/landing/Header"
import Hero from "../components/landing/Hero"
import Features from "../components/landing/Features"
import CTA from "../components/landing/CTA"
import Footer from "../components/landing/Footer"

export default function LandingLayout() {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      <main>
        <Hero />
        <Features />
        <CTA />
      </main>
      <Footer />
    </div>
  )
}
