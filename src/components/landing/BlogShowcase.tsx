import { useEffect, useState } from 'react';
import { Icons } from '../../assets/icons';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import { blogService, type PublicBlog } from '../../services/blog.service';

export default function BlogShowcase() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [blogs, setBlogs] = useState<PublicBlog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBlogs = async () => {
      try {
        const data = await blogService.getLatestBlogs(3);
        setBlogs(data);
      } catch (error) {
        console.error("Failed to fetch featured blogs:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchBlogs();
  }, []);

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric'
    });
  };

  if (!loading && blogs.length === 0) {
    return null;
  }

  return (
    <section className="py-24 px-4 bg-white relative overflow-hidden">
      {/* Abstract background shape for the yellow header style */}
      <div className="absolute top-0 left-0 w-full h-[60%] md:h-[50%] bg-[#ffecb3] -skew-y-2 origin-top-left -z-10" />

      <div className="container-custom relative z-10">
        <div className="mb-12 max-w-3xl">
          <p className="text-sm font-bold text-foreground uppercase tracking-wider mb-3">
            {t('landing.blogshowcase.header')}
          </p>
          <h2 className="text-4xl md:text-5xl font-extrabold text-foreground tracking-tight mb-4 leading-tight">
            {t('landing.blogshowcase.title')}
          </h2>
          <p className="text-lg text-foreground font-medium">
            {t('landing.blogshowcase.subtitle')}
          </p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 min-h-[400px]">
            <div className="bg-white rounded-2xl shadow-xl border border-border p-8 flex items-center justify-center col-span-1 md:col-span-2">
              <Icons.refreshCw className="w-8 h-8 text-primary animate-spin" />
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div 
              onClick={() => navigate(`/blog/${blogs[0].id}`)}
              className="bg-white rounded-2xl shadow-xl border border-border overflow-hidden flex flex-col md:flex-row col-span-1 md:col-span-2 hover:shadow-2xl transition-all duration-300 group cursor-pointer"
            >
              <div className="md:w-3/5 h-64 md:h-auto bg-muted relative overflow-hidden">
                {blogs[0].thumbnailUrl ? (
                  <img src={blogs[0].thumbnailUrl} alt={blogs[0].title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-muted text-muted-foreground">
                    <Icons.image className="w-16 h-16 opacity-50" />
                  </div>
                )}
              </div>
              <div className="p-8 md:p-10 flex flex-col justify-center md:w-2/5">
                <div className="flex items-center gap-3 mb-4">
                  {blogs[0].tags?.[0] && (
                    <span className="px-3 py-1 bg-primary/20 text-primary text-xs font-bold rounded-full uppercase tracking-wider">
                      {blogs[0].tags[0]}
                    </span>
                  )}
                  <span className="text-sm font-medium text-muted-foreground">{formatDate(blogs[0].publishAt)}</span>
                </div>
                <h3 className="text-2xl md:text-3xl font-bold text-foreground mb-4 group-hover:text-primary transition-colors">
                  {blogs[0].title}
                </h3>
                <p className="text-muted-foreground line-clamp-3 mb-6">
                  {blogs[0].excerpt || "Read more to find out what our team has been working on..."}
                </p>
                <div className="mt-auto flex items-center text-primary font-bold group-hover:translate-x-1 transition-transform">
                  {t('landing.blogshowcase.readArticle')} <Icons.arrowRight className="w-4 h-4 ml-2" />
                </div>
              </div>
            </div>

            {/* Smaller Posts Grid */}
            {blogs.slice(1, 3).map((blog) => (
              <div 
                key={blog.id} 
                onClick={() => navigate(`/blog/${blog.id}`)}
                className="bg-white rounded-2xl shadow-xl border border-border overflow-hidden hover:shadow-2xl transition-all duration-300 group flex flex-col cursor-pointer"
              >
                <div className="h-48 bg-muted relative overflow-hidden">
                  {blog.thumbnailUrl ? (
                    <img src={blog.thumbnailUrl} alt={blog.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-muted text-muted-foreground">
                      <Icons.image className="w-12 h-12 opacity-50" />
                    </div>
                  )}
                </div>
                <div className="p-8 flex flex-col flex-1">
                  <div className="flex items-center gap-3 mb-4">
                    {blog.tags?.[0] && (
                      <span className="px-3 py-1 bg-primary/20 text-primary text-xs font-bold rounded-full uppercase tracking-wider">
                        {blog.tags[0]}
                      </span>
                    )}
                    <span className="text-sm font-medium text-muted-foreground">{formatDate(blog.publishAt)}</span>
                  </div>
                  <h3 className="text-xl font-bold text-foreground mb-3 group-hover:text-primary transition-colors line-clamp-2">
                    {blog.title}
                  </h3>
                  <p className="text-muted-foreground line-clamp-2 mb-6">
                    {blog.excerpt || "Read more about this exciting update."}
                  </p>
                  <div className="mt-auto flex items-center text-primary font-bold group-hover:translate-x-1 transition-transform">
                    {t('landing.blogshowcase.readArticle')} <Icons.arrowRight className="w-4 h-4 ml-2" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
