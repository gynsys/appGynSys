import { useState, useEffect } from 'react'
import { sanitizeHtml } from '../../../lib/sanitize'
import { useParams, Link } from 'react-router-dom'
import { arkoService } from '../services/arkoService'
import BlogLayout from '../components/BlogLayout'
import GynSysLoader from '../../../components/common/GynSysLoader'
import { getImageUrl } from '../../../lib/imageUtils'



export default function ArkoPostEditor() {
  const { postSlug } = useParams()
  const [post, setPost] = useState(null)
  const [loading, setLoading] = useState(true)
  const [comments, setComments] = useState([])
  const [loadingComments, setLoadingComments] = useState(false)
  const [newComment, setNewComment] = useState({ author_name: '', content: '' })
  const [submitting, setSubmitting] = useState(false)
  const [submitMessage, setSubmitMessage] = useState({ type: '', text: '' })

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)

        const postData = await arkoService.getPostBySlug(postSlug)
        setPost(postData)

        // Load comments if it's not service content
        if (!postData.is_service_content) {
          loadComments()
        }
      } catch (err) {
        console.error('Error loading data:', err)
      } finally {
        setLoading(false)
      }
    }

    if (postSlug) {
      loadData()
    }
  }, [postSlug])

  const loadComments = async () => {
    try {
      setLoadingComments(true)
      const data = [] // await arkoService.getComments(postSlug)
      setComments(data)
    } catch (err) {
      console.error('Error loading comments:', err)
    } finally {
      setLoadingComments(false)
    }
  }

  const handleCommentSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setSubmitMessage({ type: '', text: '' })

    try {
      // await arkoService.createComment(postSlug, newComment)
      setSubmitMessage({ type: 'success', text: '¡Comentario publicado exitosamente!' })
      setNewComment({ author_name: '', content: '' })
      loadComments()
    } catch (err) {
      setSubmitMessage({ type: 'error', text: 'Error al publicar el comentario. Intenta nuevamente.' })
    } finally {
      setSubmitting(false)
    }
  }

  const [relatedPosts, setRelatedPosts] = useState([])
  const [loadingRelated, setLoadingRelated] = useState(false)

  useEffect(() => {
    if (postSlug) {
      loadRelatedPosts()
    }
  }, [postSlug])

  const loadRelatedPosts = async () => {
    try {
      setLoadingRelated(true)
      // Fetch all public posts
      const allPosts = await arkoService.getPublicPosts()

      // Filter out the current post and take top 5
      const others = allPosts
        .filter(p => p.slug !== postSlug) // Exclude current
        .slice(0, 5)

      setRelatedPosts(others)
    } catch (error) {
      console.error("Error loading related posts:", error)
    } finally {
      setLoadingRelated(false)
    }
  }

  if (loading) return <GynSysLoader text="Cargando artículo..." />
  if (!post) return <BlogLayout><div className="text-center py-10">Artículo no encontrado</div></BlogLayout>

  const isDarkTheme = false;

  return (
    <BlogLayout>
      <div className="py-12 px-0 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-12 gap-12">

          {/* Main Content Column */}
          <div className="lg:col-span-8">
            <div
              className={`p-4 sm:p-8 rounded-xl shadow-sm transition-colors duration-200 ${isDarkTheme ? 'bg-white dark:bg-gray-800 border dark:border-gray-700' : (!doctor?.theme_container_bg_color ? 'bg-white' : '')
                }`}
              style={(!isDarkTheme && doctor?.theme_container_bg_color) ? { backgroundColor: doctor.theme_container_bg_color } : {}}
            >
              <div className="mb-8">
                <Link to={`/arko360/blog`} className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300 font-medium">
                  &larr; Volver al Blog
                </Link>
              </div>

              {post.cover_image && (
                <img
                  src={getImageUrl(post.cover_image)}
                  alt={post.title}
                  className="w-full h-auto rounded-xl shadow-lg mb-8"
                />
              )}

              <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white mb-4 leading-tight">{post.title}</h1>

              <div className="flex items-center text-gray-500 dark:text-gray-400 text-sm mb-8 border-b dark:border-gray-700 pb-8">
                <time dateTime={post.published_at}>
                  Publicado el {new Date(post.published_at || post.created_at).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}
                </time>
              </div>

              <div className="prose prose-indigo dark:prose-invert prose-lg lg:prose-xl mx-auto text-gray-700 dark:text-gray-300 mb-16">
                <div dangerouslySetInnerHTML={{
                  __html: sanitizeHtml(post.content)
                }} />
              </div>



              {/* Comments Section */}
              {!post.is_service_content && (
                <div className="border-t dark:border-gray-700 pt-10">
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-8">Comentarios ({comments.length})</h3>

                  {/* Comments List */}
                  <div className="space-y-8 mb-12">
                    {loadingComments ? (
                      <GynSysLoader fullScreen={false} text="Cargando comentarios..." color={doctor?.theme_primary_color} />
                    ) : comments.length > 0 ? (
                      comments.map((comment) => (
                        <div key={comment.id} className="flex space-x-4">
                          <div className="flex-shrink-0">
                            <div className="h-10 w-10 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center text-indigo-600 dark:text-indigo-300 font-bold text-lg">
                              {comment.author_name.charAt(0).toUpperCase()}
                            </div>
                          </div>
                          <div className="flex-grow">
                            <div className="text-sm font-medium text-gray-900 dark:text-white">{comment.author_name}</div>
                            <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                              {new Date(comment.created_at).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </div>
                            <div className="text-gray-700 dark:text-gray-300 text-sm whitespace-pre-line">
                              {comment.content}
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-500 dark:text-gray-400 text-center italic">No hay comentarios aún. ¡Sé el primero en comentar!</p>
                    )}
                  </div>

                  {/* Comment Form */}
                  <div className="bg-gray-50 dark:bg-gray-700 p-6 rounded-lg transition-colors duration-200">
                    <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Deja un comentario</h4>

                    {submitMessage.text && (
                      <div className={`p-4 mb-4 rounded-md ${submitMessage.type === 'success' ? 'bg-green-50 text-green-800 dark:bg-green-900 dark:text-green-100' : 'bg-red-50 text-red-800 dark:bg-red-900 dark:text-red-100'}`}>
                        {submitMessage.text}
                      </div>
                    )}

                    <form onSubmit={handleCommentSubmit}>
                      <div className="mb-4">
                        <label htmlFor="author_name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nombre</label>
                        <input
                          type="text"
                          id="author_name"
                          required
                          className="w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-3"
                          value={newComment.author_name}
                          onChange={(e) => setNewComment({ ...newComment, author_name: e.target.value })}
                          placeholder="Tu nombre"
                        />
                      </div>
                      <div className="mb-4">
                        <label htmlFor="content" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Comentario</label>
                        <textarea
                          id="content"
                          required
                          rows={4}
                          className="w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-3"
                          value={newComment.content}
                          onChange={(e) => setNewComment({ ...newComment, content: e.target.value })}
                          placeholder="Escribe tu comentario aquí..."
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={submitting}
                        className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                      >
                        {submitting ? 'Enviando...' : 'Publicar comentario'}
                      </button>
                    </form>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar Column */}
          <div className="lg:col-span-4 space-y-8 sticky top-24 self-start">
            {/* Related Posts Widget */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 border-l-4 pl-3" style={{ borderColor: '#4F46E5' }}>
                Artículos Relacionados
              </h3>

              {loadingRelated ? (
                <div className="space-y-4">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="animate-pulse flex space-x-4">
                      <div className="bg-gray-200 dark:bg-gray-700 h-16 w-16 rounded-lg"></div>
                      <div className="flex-1 space-y-2 py-1">
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : relatedPosts.length > 0 ? (
                <div className="space-y-6">
                  {relatedPosts.map(relPost => (
                    <Link to={`/arko360/blog/${relPost.slug}`} key={relPost.id} className="group flex space-x-4">
                      <div className="flex-shrink-0 relative overflow-hidden rounded-lg h-20 w-20">
                        {relPost.cover_image ? (
                          <img
                            src={getImageUrl(relPost.cover_image)}
                            alt={relPost.title}
                            className="h-full w-full object-cover transition duration-300 group-hover:scale-110"
                          />
                        ) : (
                          <div className="h-full w-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-gray-400">
                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-semibold text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition line-clamp-2 leading-snug">
                          {relPost.title}
                        </h4>
                        <time className="text-xs text-gray-500 dark:text-gray-400 mt-1 block">
                          {new Date(relPost.published_at || relPost.created_at).toLocaleDateString('es-ES', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </time>
                      </div>
                    </Link>
                  ))}
                  <div className="pt-4 border-t border-gray-100 dark:border-gray-700">
                    <Link to={`/arko360/blog`} className="text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 flex items-center justify-center">
                      Ver todos los artículos &rarr;
                    </Link>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-500 dark:text-gray-400 italic">No hay otros artículos por ahora.</p>
              )}
            </div>

            {/* Optional: About Doctor Widget could go here too */}
          </div>

        </div>
      </div>

    </BlogLayout>
  )
}
