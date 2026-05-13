import Header from "../components/landing/Header"
import Hero from "../components/landing/Hero"
import Features from "../components/landing/Features"
import CTA from "../components/landing/CTA"
import Footer from "../components/landing/Footer"
import { useEffect, useState } from "react"
import WelcomeBack from "../pages/WelcomeBack"

export default function LandingLayout() {
  const [user, setUser] = useState<string | null>(null)
  
  useEffect(() => {
    const userData = localStorage.getItem("user")
    setUser(userData)
  }, [])
  return (
    <div className="min-h-screen bg-white">
      <Header />
      {!user && (
        <main>
          <Hero />
          <Features />
          <CTA />
        </main>
      )}
      {user && (
        <WelcomeBack />
      )}
      <Footer />
    </div>
  )
}
