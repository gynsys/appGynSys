import { useState, useEffect } from 'react'
import { faqService } from '../../services/faqService'

import SectionCard from '../common/SectionCard'

export default function FAQSection({ doctorSlug, primaryColor = '#4F46E5', cardShadow = true, containerShadow = true, containerBgColor, theme }) {
  const [faqs, setFaqs] = useState([])
  const [loading, setLoading] = useState(true)
  const [openIndex, setOpenIndex] = useState(null)

  useEffect(() => {
    const fetchFAQs = async () => {
      try {
        setLoading(true)
        const data = await faqService.getPublicFAQs(doctorSlug)
        setFaqs(data || [])
      } catch (err) {
        console.error('Error fetching FAQs:', err)
        setFaqs([])
      } finally {
        setLoading(false)
      }
    }

    if (doctorSlug) {
      fetchFAQs()
    }
  }, [doctorSlug])

  const toggleFAQ = (index) => {
    setOpenIndex(openIndex === index ? null : index)
  }

  if (loading) {
    return (
      <SectionCard
        id="preguntas-frecuentes"
        // No extra scroll margin needed specifically? Or maybe stick to standard.
        // The other sections got scroll-mt-28 or 32. Let's start with default (scroll-mt-24 from SectionCard) or explicit.
        // User asked to adjust Loc and Testimonials. FAQ usually is below. 
        // I will let SectionCard use its default `scroll-mt-24` unless I see a reason to boost it.
        // Actually, for consistency, I'll use scroll-mt-28 or similar if needed. 
        // Let's stick to default for now unless specified.
        containerBgColor={containerBgColor}
        theme={theme}
      >
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto" style={{ borderColor: primaryColor }}></div>
        </div>
      </SectionCard>
    )
  }

  if (faqs.length === 0) {
    return null // Don't show section if no FAQs
  }

  return (
    <SectionCard
      id="preguntas-frecuentes"
      containerBgColor={containerBgColor}
      title="Preguntas Frecuentes"
      theme={theme}
    >
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12 -mt-6">
          <p className="text-lg text-gray-600 dark:text-gray-300">
            Encuentra respuestas a las preguntas más comunes
          </p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div
              key={faq.id}
              className={`bg-white dark:bg-gray-800 rounded-lg overflow-hidden transition-all duration-300 ${cardShadow ? 'shadow-md hover:shadow-lg' : 'border border-gray-200 dark:border-gray-700'}`}
            >
              <button
                onClick={() => toggleFAQ(index)}
                className="w-full px-6 py-5 text-left flex items-center justify-between focus:outline-none focus:ring-2 focus:ring-offset-2 rounded-lg transition-colors dark:text-white"
                style={{
                  backgroundColor: openIndex === index ? `${primaryColor}10` : '', // Let CSS handle default bg
                  focusRingColor: primaryColor,
                }}
              >
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white pr-4 flex-1">
                  {faq.question}
                </h3>
                <svg
                  className={`w-6 h-6 flex-shrink-0 transition-transform duration-300 ${openIndex === index ? 'transform rotate-180' : ''
                    }`}
                  style={{ color: primaryColor }}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>

              {openIndex === index && (
                <div
                  className="px-6 pb-5 pt-0 animate-fadeIn"
                  style={{ borderTop: `2px solid ${primaryColor}20` }}
                >
                  <div
                    className="pt-4 text-gray-700 dark:text-gray-300 leading-relaxed"
                  >
                    {faq.answer.split('\n').map((paragraph, pIndex) => (
                      <p key={pIndex} className="mb-3 last:mb-0">
                        {paragraph}
                      </p>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </SectionCard>
  )
}

