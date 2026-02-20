import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { getPublishedPosts, getFeaturedPosts, getCategories } from "../services/api";
import { ServicePost, Category } from "../types";
import "./Services.css";

const Services: React.FC = () => {
  const navigate = useNavigate();
  const [selectedYear, setSelectedYear] = useState<string>("all");
  const [posts, setPosts] = useState<ServicePost[]>([]);
  const [featuredPosts, setFeaturedPosts] = useState<ServicePost[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  const featuredSectionRef = useRef<HTMLDivElement>(null);
  const regularPostsRef = useRef<HTMLDivElement>(null);
  const sidebarRef = useRef<HTMLElement>(null);

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Fetch data from backend
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch all data in parallel
        const [postsResponse, featuredResponse, categoriesResponse] = await Promise.all([
          getPublishedPosts({ limit: 50 }), // Get more posts initially
          getFeaturedPosts(3),
          getCategories()
        ]);

        setPosts(postsResponse.posts || []);
        setFeaturedPosts(featuredResponse || []);
        setCategories(categoriesResponse || []);
      } catch (err: any) {
        console.error('Error fetching services data:', err);
        setError(err.message || 'Failed to load services');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Scroll animation observer
  useEffect(() => {
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
      featuredSectionRef.current,
      regularPostsRef.current,
      sidebarRef.current
    ].filter(Boolean) as Element[];

    sections.forEach(section => observer.observe(section));

    return () => {
      sections.forEach(section => observer.unobserve(section));
    };
  }, [posts, featuredPosts]);

  // Get unique years from posts
  const years = Array.from(
    new Set(posts.map((post) => new Date(post.createdAt).getFullYear()))
  ).sort((a, b) => b - a);

  // Filter posts by selected year
  const filteredPosts =
    selectedYear === "all"
      ? posts
      : posts.filter(
          (post) =>
            new Date(post.createdAt).getFullYear().toString() === selectedYear
        );

  // Sort posts by date (newest first)
  const sortedPosts = filteredPosts.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const handlePostClick = (slug: string) => {
    navigate(`/services/${slug}`);
  };

  if (loading) {
    return (
      <div className="page-content">
        <div className="container">
          <div className="loading-state">
            <p>Loading services...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-content">
        <div className="container">
          <div className="error-state">
            <p>Error: {error}</p>
            <button onClick={() => window.location.reload()}>Try Again</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="services-page">
      {/* Hero Section with Background Image */}
      <section className="services-hero">
        <div className="services-hero-overlay"></div>
        <div className="services-hero-content">
          <h1>Our Services & Updates</h1>
          <p>
            Discover our latest service offerings, updates, and wellness
            experiences. Stay informed about new features, seasonal packages,
            and special promotions.
          </p>
        </div>
      </section>

      {/* Main Content with Solid Background */}
      <div className="page-content">
        <div className="container">

        <div className="services-layout">
          {/* Main Content */}
          <div className="services-main">
            {/* Featured Posts */}
            {featuredPosts.length > 0 && (
              <div ref={featuredSectionRef} className="featured-posts">
                <h2>Featured Posts</h2>
                <div className="featured-posts-grid">
                  {featuredPosts.map((post) => (
                    <article 
                      key={post._id} 
                      className="featured-post"
                      onClick={() => handlePostClick(post.slug)}
                      style={{ cursor: 'pointer' }}
                    >
                      {post.image && (
                        <div className="post-image">
                          <img src={post.image} alt={post.title} />
                        </div>
                      )}
                      <div className="post-header">
                        <h3 className="post-title">{post.title}</h3>
                        <span className="featured-badge">Featured</span>
                      </div>
                      <p className="post-excerpt">{post.excerpt}</p>
                      <div className="post-meta">
                        <span className="post-date">{formatDate(post.createdAt)}</span>
                        <span className="post-category">{post.category}</span>
                        <span className="post-read-time">{post.readTime}</span>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            )}

            {/* Regular Posts */}
            <div ref={regularPostsRef} className="service-posts">
              <h2>Standard Posts</h2>
              {sortedPosts
                .filter((post) => !post.featured)
                .map((post) => (
                  <article 
                    key={post._id} 
                    className="service-post"
                    onClick={() => handlePostClick(post.slug)}
                    style={{ cursor: 'pointer' }}
                  >
                    {post.image && (
                      <div className="post-image">
                        <img src={post.image} alt={post.title} />
                      </div>
                    )}
                    <div className="post-header">
                      <h3 className="post-title">{post.title}</h3>
                    </div>
                    <p className="post-excerpt">{post.excerpt}</p>
                    <div className="post-meta">
                      <span className="post-date">{formatDate(post.createdAt)}</span>
                      <span className="post-category">{post.category}</span>
                      <span className="post-read-time">{post.readTime}</span>
                    </div>
                  </article>
                ))}

              {sortedPosts.filter((post) => !post.featured).length === 0 && (
                <div className="no-posts">
                  <p>No posts found for the selected year.</p>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <aside ref={sidebarRef} className="services-sidebar">
            <div className="sidebar-widget">
              <h4>Filter by Year</h4>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="year-filter"
              >
                <option value="all">All Years</option>
                {years.map((year) => (
                  <option key={year} value={year.toString()}>
                    {year}
                  </option>
                ))}
              </select>
            </div>

            <div className="sidebar-widget">
              <h4>Service Categories</h4>
              <ul className="category-list">
                {categories.map((cat) => (
                  <li key={cat.category}>
                    <a href={`#${cat.category.toLowerCase().replace(/\s+/g, '-')}`}>
                      {cat.category.replace(/\b\w/g, char => char.toUpperCase())} ({cat.count})
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </aside>
        </div>
        </div>
      </div>
    </div>
  );
};

export default Services;
