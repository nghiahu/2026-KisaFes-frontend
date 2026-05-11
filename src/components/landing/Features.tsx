import { Icons } from "../../assets/icons"

export default function Features() {
  const featureCards = [
    {
      id: 1,
      icon: Icons.squareLibrary,
      title: "Visual Pipeline Management",
      description: "Our industrial Kanban boards support nested tasks, custom workflows, and automated state transitions. Map your team's unique process with zero friction.",
      link: "Explore Boards →",
      highlight: false,
    },
    {
      id: 2,
      icon: Icons.gauge,
      title: "Blazing Performance",
      description: "Built for speed. Our 60FPS interface ensures you never wait for a page load or state update. Experience the precision of local-first interaction.",
      link: null,
      highlight: true,
    },
    {
      id: 3,
      icon: Icons.bug,
      title: "Advanced Issue Tracking",
      description: "Deep integration with Git and CI/CD tools. Automatic bug linking and smart prioritization for engineering teams.",
      link: null,
      highlight: false,
    },
    {
      id: 4,
      icon: Icons.clipboardClock,
      title: "Real-time Analytics",
      description: "Velocity charts, burn-down reports, and resource allocation heatmaps updated in real-time as your team completes work.",
      link: null,
      highlight: false,
    },
  ]

  return (
    <section className="py-20 px-4 bg-gray-50">
      <div className="container-custom">
        <div className="text-center mb-16">
          <h2 className="text-4xl lg:text-5xl font-bold mb-4">Engineered for focus</h2>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            Stop juggling tabs. Kisafres consolidates your entire project lifecycle into a single, high-fidelity command center.
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
                    ? "bg-blue-600 text-white shadow-xl lg:col-span-1 lg:row-span-2 flex flex-col justify-between"
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
                    <a href="#" className={card.highlight ? "text-white font-semibold hover:text-blue-100" : "text-blue-600 font-semibold hover:text-blue-700"}>
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
                <Icons.badgePlus className="w-12 h-12 mx-auto text-blue-600" />
              </div>
              <p className="text-gray-600 font-semibold">Add 20+ more features</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
