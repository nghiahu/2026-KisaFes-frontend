export default function CTA() {
  return (
    <section className="py-20 px-4">
      <div className="container-custom">
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-3xl p-12 md:p-20 text-center text-white space-y-8">
          <h2 className="text-4xl md:text-5xl font-bold leading-tight">
            Ready to ship faster and work smarter?
          </h2>
          <p className="text-xl text-blue-100 max-w-2xl mx-auto">
            Join 5,000+ high-performance teams who have optimized their delivery pipeline with Kisafres.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <button className="px-8 py-4 bg-white text-blue-600 font-semibold rounded-lg hover:bg-blue-50 transition duration-200">
              Create My Project
            </button>
            <button className="px-8 py-4 border-2 border-white text-white font-semibold rounded-lg hover:bg-blue-700 transition duration-200">
              Contact Sales
            </button>
          </div>
          <p className="text-sm text-blue-100">
            No credit card required. 14-day free trial on all premium features.
          </p>
        </div>
      </div>
    </section>
  )
}
