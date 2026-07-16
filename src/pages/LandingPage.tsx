import MarketingHeader from '../components/layout/MarketingHeader'
import MarketingFooter from '../components/layout/MarketingFooter'
import Hero from '../components/marketing/Hero'
import FeatureGrid from '../components/marketing/FeatureGrid'
import Testimonials from '../components/marketing/Testimonials'
import HowItWorks from '../components/marketing/HowItWorks'
import ReportsShowcase from '../components/marketing/ReportsShowcase'
import CtaBand from '../components/marketing/CtaBand'

type View = 'landing' | 'login' | 'signup'

interface LandingPageProps {
  onNavigate: (view: View) => void
}

export default function LandingPage({ onNavigate }: LandingPageProps) {
  return (
    <div className="bg-white">
      <MarketingHeader onNavigate={onNavigate} />
      <main>
        <Hero onNavigate={onNavigate} />
        <FeatureGrid onNavigate={onNavigate} />
        <Testimonials />
        <HowItWorks onNavigate={onNavigate} />
        <ReportsShowcase />
        <CtaBand onNavigate={onNavigate} />
      </main>
      <MarketingFooter />
    </div>
  )
}
