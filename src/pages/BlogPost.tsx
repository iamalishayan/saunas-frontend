import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getPostBySlug, getPublishedPosts } from '../services/api';
import { ServicePost } from '../types';
import './BlogPost.css';

const BlogPost: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [post, setPost] = useState<ServicePost | null>(null);
  const [relatedPosts, setRelatedPosts] = useState<ServicePost[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  const contentRef = useRef<HTMLElement>(null);
  const relatedPostsRef = useRef<HTMLElement>(null);

  // Scroll to top when component mounts or slug changes
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [slug]);

  useEffect(() => {
    const fetchPost = async () => {
      if (!slug) return;
      
      try {
        setLoading(true);
        setError(null);
        
        // Fetch the blog post by slug
        const postData = await getPostBySlug(slug);
        setPost(postData);
        
        // Fetch related posts from the same category
        const relatedResponse = await getPublishedPosts({ 
          category: postData.category,
          limit: 3 
        });
        
        // Filter out the current post from related posts
        const filtered = relatedResponse.posts.filter((p: ServicePost) => p._id !== postData._id);
        setRelatedPosts(filtered.slice(0, 3));
        
      } catch (err: any) {
        console.error('Error fetching blog post:', err);
        setError(err.message || 'Failed to load blog post');
      } finally {
        setLoading(false);
      }
    };

    fetchPost();
  }, [slug]);

  // Scroll animation observer
  useEffect(() => {
    if (!post) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('animate-in');
          }
        });
      },
      {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
      }
    );

    const sections = [
      contentRef.current,
      relatedPostsRef.current
    ].filter(Boolean) as Element[];

    // Add sidebar animation after a slight delay
    const sidebarElement = document.querySelector('.blog-detail-sidebar');
    if (sidebarElement) {
      setTimeout(() => {
        sidebarElement.classList.add('animate-in');
      }, 300);
    }

    sections.forEach(section => observer.observe(section));

    return () => {
      sections.forEach(section => observer.unobserve(section));
    };
  }, [post, relatedPosts]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const handleRelatedPostClick = (relatedSlug: string) => {
    navigate(`/services/${relatedSlug}`);
  };

  if (loading) {
    return (
      <div className="blog-post-page">
        <div className="page-content">
          <div className="container">
            <div className="loading-state">
              <div className="loading-spinner"></div>
              <p>Loading post...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="blog-post-page">
        <div className="page-content">
          <div className="container">
            <div className="error-state">
              <h2>Post Not Found</h2>
              <p>{error || 'The blog post you are looking for does not exist.'}</p>
              <button onClick={() => navigate('/services')} className="btn btn-primary">
                Back to Services
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="blog-post-page">
      {/* Hero Section with Post Image */}
      <section className="blog-post-hero" style={{ backgroundImage: post.image ? `url(${post.image})` : undefined }}>
        <div className="blog-post-hero-overlay"></div>
        <div className="blog-post-hero-content">
          <div className="breadcrumb">
            <button onClick={() => navigate('/services')} className="breadcrumb-link">
              Services
            </button>
            <span className="breadcrumb-separator">/</span>
            <span className="breadcrumb-current">{post.title}</span>
          </div>
          <h1>{post.title}</h1>
          <div className="post-meta-hero">
            <span className="post-category-badge">{post.category}</span>
            <span className="post-date">{formatDate(post.createdAt)}</span>
            <span className="post-read-time">{post.readTime}</span>
            {post.featured && <span className="featured-badge">Featured</span>}
          </div>
        </div>
      </section>

      {/* Main Content */}
      <div className="page-content">
        <div className="blog-detail-container">
          <article ref={contentRef} className="blog-detail-content">
            {/* Excerpt */}
            <div className="post-excerpt-box">
              <p className="post-excerpt-large">{post.excerpt}</p>
            </div>

            {/* Post Content */}
            <div className="post-body">
              {post.content.split('\n\n').map((paragraph, index) => (
                <p key={index}>{paragraph}</p>
              ))}
            </div>

            {/* Post Footer */}
            <div className="post-footer">
              <div className="post-author-info">
                <div className="author-avatar">
                  {post.author?.name?.[0]?.toUpperCase() || 'H'}
                </div>
                <div className="author-details">
                  <p className="author-name">{post.author?.name || 'Havn Saunas Team'}</p>
                  <p className="author-role">Published on {formatDate(post.createdAt)}</p>
                </div>
              </div>
            </div>
          </article>

          {/* Sidebar */}
          <aside className="blog-detail-sidebar">
            <div className="sidebar-widget">
              <h4>About This Post</h4>
              <div className="post-info">
                <div className="info-item">
                  <span className="info-label">Category:</span>
                  <span className="info-value">{post.category}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Read Time:</span>
                  <span className="info-value">{post.readTime}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Views:</span>
                  <span className="info-value">{post.views || 0}</span>
                </div>
              </div>
            </div>

            <div className="sidebar-widget">
              <h4>Quick Actions</h4>
              <div className="quick-actions">
                <button onClick={() => navigate('/booking')} className="btn btn-primary">
                  Book Now
                </button>
                <button onClick={() => navigate('/contact')} className="btn btn-outline">
                  Contact Us
                </button>
              </div>
            </div>
          </aside>
        </div>

        {/* Related Posts */}
        {relatedPosts.length > 0 && (
          <section ref={relatedPostsRef} className="related-posts-section">
            <h2>Related Posts</h2>
            <div className="related-posts-grid">
              {relatedPosts.map((relatedPost) => (
                <article 
                  key={relatedPost._id} 
                  className="related-post-card"
                  onClick={() => handleRelatedPostClick(relatedPost.slug)}
                >
                  {relatedPost.image && (
                    <div className="related-post-image">
                      <img src={relatedPost.image} alt={relatedPost.title} />
                    </div>
                  )}
                  <div className="related-post-content">
                    <h3>{relatedPost.title}</h3>
                    <p>{relatedPost.excerpt}</p>
                    <div className="related-post-meta">
                      <span className="post-category">{relatedPost.category}</span>
                      <span className="post-read-time">{relatedPost.readTime}</span>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
};

export default BlogPost;
