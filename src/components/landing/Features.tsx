import { Icons } from "../../assets/icons"
import { useLanguage } from "../../contexts/LanguageContext"

export default function Features() {
  const { t } = useLanguage()
  const featureCards = [
    {
      id: 1,
      icon: Icons.squareLibrary,
      title: t('landing.features.f1_title'),
      description: t('landing.features.f1_desc'),
      link: t('landing.features.f1_link'),
      highlight: false,
    },
    {
      id: 2,
      icon: Icons.gauge,
      title: t('landing.features.f2_title'),
      description: t('landing.features.f2_desc'),
      link: null,
      highlight: true,
    },
    {
      id: 3,
      icon: Icons.bug,
      title: t('landing.features.f3_title'),
      description: t('landing.features.f3_desc'),
      link: null,
      highlight: false,
    },
    {
      id: 4,
      icon: Icons.clipboardClock,
      title: t('landing.features.f4_title'),
      description: t('landing.features.f4_desc'),
      link: null,
      highlight: false,
    },
  ]

  return (
    <section className="py-20 px-4 bg-gray-50">
      <div className="container-custom">
        <div className="text-center mb-16">
          <h2 className="text-4xl lg:text-5xl font-bold mb-4">{t('landing.features.title')}</h2>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            {t('landing.features.desc')}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {featureCards.map((card) => {
            const IconComponent = card.icon
            return (
              <div
                key={card.id}
                className={`rounded-2xl p-8 transition-all duration-200 ${
                  card.highlight
                    ? "bg-primary text-white shadow-xl lg:col-span-1 lg:row-span-2 flex flex-col justify-between"
                    : "bg-white border border-gray-200 hover:shadow-lg"
                }`}
              >
                <div>
                  <div className="mb-4">
                    <IconComponent className="w-10 h-10" style={{ color: card.highlight ? "white" : "#2563eb" }} />
                  </div>
                  <h3 className="text-2xl font-bold mb-3">{card.title}</h3>
                  <p className={card.highlight ? "text-blue-100" : "text-gray-600"}>
                    {card.description}
                  </p>
                </div>
                {card.link && (
                  <div className="mt-6">
                    <a href="#" className={card.highlight ? "text-white font-semibold hover:text-blue-100" : "text-primary font-semibold hover:text-blue-700"}>
                      {card.link}
                    </a>
                  </div>
                )}
              </div>
            )
          })}

          <div className="bg-white border border-gray-200 rounded-2xl p-8 hover:shadow-lg transition-all duration-200 flex items-center justify-center">
            <div className="text-center">
              <div className="mb-4">
                <Icons.badgePlus className="w-12 h-12 mx-auto text-primary" />
              </div>
              <p className="text-gray-600 font-semibold">{t('landing.features.add_more')}</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
