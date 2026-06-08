import Header from "../components/landing/Header"
import Hero from "../components/landing/Hero"
import BlogShowcase from "../components/landing/BlogShowcase"
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
    <div className="min-h-screen bg-background">
      <Header />
      {!user && (
        <main>
          <Hero />
          <BlogShowcase />
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
