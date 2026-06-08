import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import { blogService, type PublicBlog } from '../../services/blog.service';
import { Icons } from '../../assets/icons';
import MarkdownPreview from '@uiw/react-markdown-preview';

export default function BlogDetail() {
  const { id } = useParams<{ id: string }>();
  const { t } = useLanguage();
  const [blog, setBlog] = useState<PublicBlog | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    window.scrollTo(0, 0);

    const fetchBlog = async () => {
      if (!id) return;
      try {
        const data = await blogService.getBlogById(id);
        setBlog(data);
      } catch (error) {
        console.error('Failed to fetch blog detail:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchBlog();
  }, [id]);

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Icons.refreshCw className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  if (!blog) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 px-4">
        <Icons.fileText className="w-16 h-16 text-slate-300 mb-4" />
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Blog not found</h1>
        <p className="text-slate-500 mb-6 text-center">The article you are looking for does not exist or has been removed.</p>
        <Link to="/software/kisa" className="text-blue-600 font-semibold hover:underline flex items-center gap-2">
          <Icons.chevronLeft className="w-4 h-4" /> {t('landing.blogDetail.back')}
        </Link>
      </div>
    );
  }

  return (
    <article className="min-h-screen bg-slate-50 pb-20">
      {/* Header / Hero */}
      <div className="bg-white border-b border-slate-200 pt-16 pb-12 px-4 relative overflow-hidden">
        {/* Subtle background abstract shape */}
        <div className="absolute top-0 left-0 w-full h-[60%] md:h-[50%] bg-[#ffecb3] -skew-y-2 origin-top-left -z-10 opacity-30" />
        
        <div className="container-custom max-w-4xl mx-auto relative z-10">
          <Link to="/software/kisa" className="inline-flex items-center text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors mb-8">
            <Icons.chevronLeft className="w-4 h-4 mr-1" /> {t('landing.blogDetail.back')}
          </Link>
          
          <div className="flex items-center gap-3 mb-6">
            {blog.tags?.map(tag => (
              <span key={tag} className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-bold rounded-full uppercase tracking-wider">
                {tag}
              </span>
            ))}
            <span className="text-sm font-medium text-slate-500 flex items-center gap-1.5">
              <Icons.calendar className="w-4 h-4" /> {formatDate(blog.publishAt)}
            </span>
          </div>

          <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 leading-tight mb-6">
            {blog.title}
          </h1>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center overflow-hidden border border-slate-300">
              {/* Fallback to generic user icon if author has no avatar, since we only get authorName */}
              <Icons.user className="w-5 h-5 text-slate-500" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900">{blog.authorName || 'KisaFres Team'}</p>
              <p className="text-xs text-slate-500">Author</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container-custom max-w-4xl mx-auto px-4 mt-12">
        {blog.thumbnailUrl && (
          <div className="w-full aspect-video md:aspect-[21/9] rounded-2xl overflow-hidden mb-12 shadow-lg border border-slate-200 bg-white">
            <img src={blog.thumbnailUrl} alt={blog.title} className="w-full h-full object-cover" />
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 md:p-12">
          {blog.content ? (
            <MarkdownPreview 
              source={blog.content} 
              wrapperElement={{
                "data-color-mode": "light"
              }}
              className="prose prose-slate prose-lg max-w-none prose-headings:font-bold prose-a:text-blue-600 hover:prose-a:text-blue-700 prose-img:rounded-xl prose-img:shadow-md"
            />
          ) : (
            <p className="text-slate-500 italic text-center py-8">Content is empty.</p>
          )}
        </div>
      </div>
    </article>
  );
}
