import { Button } from '@/components/ui/Button';
import { useLanguage } from "../../contexts/LanguageContext"

export default function CTA() {
  const { t } = useLanguage()
  return (
    <section className="py-20 px-4">
      <div className="container-custom">
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-3xl p-12 md:p-20 text-center text-white space-y-8">
          <h2 className="text-4xl md:text-5xl font-bold leading-tight">
            {t('landing.cta.title')}
          </h2>
          <p className="text-xl text-blue-100 max-w-2xl mx-auto">
            {t('landing.cta.desc')}
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Button className="px-8 py-4 bg-white text-primary font-semibold rounded-lg hover:bg-primary/10 transition duration-200">
              {t('landing.cta.btn_create')}
            </Button>
            <Button className="px-8 py-4 border-2 border-white text-white font-semibold rounded-lg hover:bg-primary/90 transition duration-200">
              {t('landing.cta.btn_sales')}
            </Button>
          </div>
          <p className="text-sm text-blue-100">
            {t('landing.cta.note')}
          </p>
        </div>
      </div>
    </section>
  )
}
