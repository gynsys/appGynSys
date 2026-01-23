import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { blogService } from '../../modules/blog/services/blogService'
import BlogCard from '../../modules/blog/components/BlogCard'

import SectionCard from '../common/SectionCard'

export default function BlogSection({ doctor, primaryColor, cardShadow = true, containerShadow = true, containerBgColor, theme }) {
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (doctor?.slug_url) {
      loadPosts()
    }
  }, [doctor?.slug_url])

  const loadPosts = async () => {
    try {
      const allPosts = await blogService.getPublicPosts(doctor.slug_url)
      // Filter out posts linked to services (they appear in Services section)
      const blogPosts = allPosts.filter(post => !post.is_service_content)
      // Take only the latest 3 posts
      setPosts(blogPosts.slice(0, 3))
    } catch (error) {
      console.error("Error loading blog posts:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading || posts.length === 0) return null

  return (
    <SectionCard
      id="blog"
      scrollMargin="scroll-mt-32"
      containerBgColor={containerBgColor}
      theme={theme}
    >
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Contenido Destacado</h2>
        <Link
          to={`/dr/${doctor.slug_url}/blog`}
          className="text-indigo-600 hover:text-indigo-800 font-medium flex items-center transition-colors"
          style={{ color: primaryColor }}
        >
          Ver todo <span aria-hidden="true" className="ml-1">&rarr;</span>
        </Link>
      </div>

      <div className="grid gap-8 max-w-lg mx-auto lg:grid-cols-3 lg:max-w-5xl">
        {posts.map((post) => (
          <BlogCard key={post.id} post={post} doctor={doctor} shadow={cardShadow} />
        ))}
      </div>
    </SectionCard>
  )
}
