import React, { useState, useEffect } from 'react';
import { 
  getAllBlogPosts, 
  createBlogPost, 
  updateBlogPost, 
  deleteBlogPost
} from '../../services/api';
import { ServicePost, BlogPostFormData } from '../../types';
import './BlogManagement.css';

interface BlogManagementProps {
  isOpen: boolean;
  onClose: () => void;
}

const BlogManagement: React.FC<BlogManagementProps> = ({ isOpen, onClose }) => {
  const [posts, setPosts] = useState<ServicePost[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [processingPost, setProcessingPost] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState<boolean>(false);
  const [editingPost, setEditingPost] = useState<ServicePost | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploadMethod, setUploadMethod] = useState<'file' | 'url'>('file');
  const [formData, setFormData] = useState<BlogPostFormData>({
    title: '',
    excerpt: '',
    content: '',
    readTime: '',
    category: 'general',
    image: '',
    featured: false,
    published: false
  });

  useEffect(() => {
    if (isOpen) {
      fetchPosts();
    }
  }, [isOpen, categoryFilter, statusFilter]);

  const fetchPosts = async (searchTerm?: string) => {
    setLoading(true);
    try {
      const params: {
        category?: string;
        published?: boolean;
        search?: string;
      } = {};
      
      if (categoryFilter) params.category = categoryFilter;
      if (statusFilter) {
        params.published = statusFilter === 'published';
      }
      if (searchTerm || search) params.search = searchTerm || search;
      
      const response = await getAllBlogPosts(params);
      setPosts(response.posts);
      setLoading(false);
    } catch (err: any) {
      setError(err.message || 'Failed to load blog posts');
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchPosts(search);
  };

  const resetForm = () => {
    setFormData({
      title: '',
      excerpt: '',
      content: '',
      readTime: '',
      category: 'general',
      image: '',
      featured: false,
      published: false
    });
    setImageFile(null);
    setImagePreview(null);
    setUploadMethod('file');
    setEditingPost(null);
    setShowCreateForm(false);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProcessingPost('form');
    try {
      const submitData: any = { ...formData };
      
      // Use file upload if available, otherwise use URL or null
      if (imageFile) {
        submitData.image = imageFile;
      } else if (formData.image === null) {
        // Explicitly set to null to remove image
        submitData.image = null;
      } else if (!formData.image && !editingPost) {
        // For new posts without image, delete the field
        delete submitData.image;
      }
      
      if (editingPost) {
        await updateBlogPost(editingPost._id, submitData);
        setSuccessMessage('Blog post updated successfully');
      } else {
        await createBlogPost(submitData);
        setSuccessMessage('Blog post created successfully');
      }
      
      resetForm();
      fetchPosts();
      
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to save blog post');
    } finally {
      setProcessingPost(null);
    }
  };

  const handleEdit = (post: ServicePost) => {
    setFormData({
      title: post.title,
      excerpt: post.excerpt,
      content: post.content,
      readTime: post.readTime,
      category: post.category,
      image: post.image || '',
      featured: post.featured,
      published: post.published
    });
    setImagePreview(post.image || null);
    setImageFile(null);
    setUploadMethod(post.image ? 'url' : 'file');
    setEditingPost(post);
    setShowCreateForm(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    
    if (!file) {
      setImageFile(null);
      setImagePreview(null);
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('File size must be less than 5MB');
      setTimeout(() => setError(null), 3000);
      return;
    }

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      setError('Only JPEG, PNG, WebP, and GIF images are allowed');
      setTimeout(() => setError(null), 3000);
      return;
    }

    setImageFile(file);
    
    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
    setFormData({ ...formData, image: null as any });
  };

  const handleDelete = async (post: ServicePost) => {
    if (!confirm(`Are you sure you want to delete "${post.title}"?`)) {
      return;
    }

    setProcessingPost(post._id);
    try {
      await deleteBlogPost(post._id);
      setPosts(prevPosts => prevPosts.filter(p => p._id !== post._id));
      setSuccessMessage('Blog post deleted successfully');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to delete blog post');
    } finally {
      setProcessingPost(null);
    }
  };

  const handleToggleFeatured = async (post: ServicePost) => {
    setProcessingPost(post._id);
    try {
      // Use updateBlogPost instead of PATCH endpoint to avoid CORS issues
      await updateBlogPost(post._id, { featured: !post.featured });
      setPosts(prevPosts => prevPosts.map(p => 
        p._id === post._id ? { ...p, featured: !p.featured } : p
      ));
      setSuccessMessage(`Post ${!post.featured ? 'featured' : 'unfeatured'} successfully`);
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to toggle featured status');
    } finally {
      setProcessingPost(null);
    }
  };

  const handleTogglePublished = async (post: ServicePost) => {
    setProcessingPost(post._id);
    try {
      // Use updateBlogPost instead of PATCH endpoint to avoid CORS issues
      await updateBlogPost(post._id, { published: !post.published });
      setPosts(prevPosts => prevPosts.map(p => 
        p._id === post._id ? { ...p, published: !p.published } : p
      ));
      setSuccessMessage(`Post ${!post.published ? 'published' : 'unpublished'} successfully`);
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to toggle published status');
    } finally {
      setProcessingPost(null);
    }
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="blog-management-modal">
        <div className="modal-header">
          <h2>Blog Management</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        
        <div className="modal-content">
          {/* Action Bar */}
          <div className="action-bar">
            <button 
              className="btn btn-primary"
              onClick={() => setShowCreateForm(true)}
            >
              + Create New Post
            </button>
          </div>

          {/* Create/Edit Form */}
          {showCreateForm && (
            <div className="blog-form-section">
              <h3>{editingPost ? 'Edit Post' : 'Create New Post'}</h3>
              <form onSubmit={handleSubmit} className="blog-form">
                <div className="form-grid">
                  <div className="form-group">
                    <label htmlFor="title">Title *</label>
                    <input
                      type="text"
                      id="title"
                      value={formData.title}
                      onChange={(e) => setFormData({...formData, title: e.target.value})}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="category">Category</label>
                    <select
                      id="category"
                      value={formData.category}
                      onChange={(e) => setFormData({...formData, category: e.target.value})}
                    >
                      <option value="trailer-sauna">Trailer Sauna</option>
                      <option value="boat-sauna">Boat Sauna</option>
                      <option value="wellness">Wellness</option>
                      <option value="events">Events</option>
                      <option value="tips">Tips</option>
                      <option value="general">General</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label htmlFor="readTime">Read Time</label>
                    <input
                      type="text"
                      id="readTime"
                      value={formData.readTime}
                      onChange={(e) => setFormData({...formData, readTime: e.target.value})}
                      placeholder="5 min read"
                    />
                  </div>
                </div>

                {/* Image Upload Section */}
                <div className="form-group">
                  <label>Image</label>
                  <div className="upload-method-selector">
                    <button
                      type="button"
                      className={`method-btn ${uploadMethod === 'file' ? 'active' : ''}`}
                      onClick={() => setUploadMethod('file')}
                    >
                      📁 Upload File
                    </button>
                    <button
                      type="button"
                      className={`method-btn ${uploadMethod === 'url' ? 'active' : ''}`}
                      onClick={() => setUploadMethod('url')}
                    >
                      🔗 Use URL
                    </button>
                  </div>

                  {uploadMethod === 'file' ? (
                    <div className="file-upload-section">
                      <input
                        type="file"
                        id="imageFile"
                        accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
                        onChange={handleFileChange}
                        style={{ display: 'none' }}
                      />
                      <label htmlFor="imageFile" className="file-upload-label">
                        {imageFile ? imageFile.name : 'Choose image file (max 5MB)'}
                      </label>
                      <small className="form-hint">Supported: JPEG, PNG, WebP, GIF (max 5MB)</small>
                    </div>
                  ) : (
                    <input
                      type="url"
                      id="imageUrl"
                      value={formData.image}
                      onChange={(e) => {
                        setFormData({...formData, image: e.target.value});
                        setImagePreview(e.target.value);
                      }}
                      placeholder="https://example.com/image.jpg"
                    />
                  )}

                  {imagePreview && (
                    <div className="image-preview-container">
                      <img 
                        src={imagePreview} 
                        alt="Preview" 
                        className="image-preview"
                        width="800"
                        height="600"
                        style={{ width: '100%', height: 'auto' }}
                      />
                      <button
                        type="button"
                        className="remove-image-btn"
                        onClick={handleRemoveImage}
                      >
                        ✕ Remove Image
                      </button>
                    </div>
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor="excerpt">Excerpt *</label>
                  <textarea
                    id="excerpt"
                    value={formData.excerpt}
                    onChange={(e) => setFormData({...formData, excerpt: e.target.value})}
                    rows={3}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="content">Content *</label>
                  <textarea
                    id="content"
                    value={formData.content}
                    onChange={(e) => setFormData({...formData, content: e.target.value})}
                    rows={8}
                    required
                  />
                </div>

                <div className="form-checkboxes">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={formData.featured}
                      onChange={(e) => setFormData({...formData, featured: e.target.checked})}
                    />
                    Featured Post
                  </label>

                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={formData.published}
                      onChange={(e) => setFormData({...formData, published: e.target.checked})}
                    />
                    Published
                  </label>
                </div>

                <div className="form-actions">
                  <button 
                    type="button" 
                    className="btn btn-secondary"
                    onClick={resetForm}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="btn btn-primary"
                    disabled={processingPost === 'form'}
                  >
                    {processingPost === 'form' ? 'Saving...' : (editingPost ? 'Update Post' : 'Create Post')}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Filter Bar */}
          <div className="filter-bar">
            <form onSubmit={handleSearch} className="search-form">
              <input
                type="text"
                placeholder="Search by title or excerpt"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="search-input"
              />
              <button type="submit" className="search-btn">Search</button>
            </form>
            
            <div className="filters">
              <select 
                value={categoryFilter} 
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="filter-select"
              >
                <option value="">All Categories</option>
                <option value="general">General</option>
                <option value="boat-sauna">Boat Sauna</option>
                <option value="wellness">Wellness</option>
                <option value="events">Events</option>
                <option value="tips">Tips</option>
              </select>
              
              <select 
                value={statusFilter} 
                onChange={(e) => setStatusFilter(e.target.value)}
                className="filter-select"
              >
                <option value="">All Status</option>
                <option value="published">Published</option>
                <option value="draft">Draft</option>
              </select>
            </div>
          </div>

          {successMessage && (
            <div className="success-message">
              <p>{successMessage}</p>
            </div>
          )}

          {loading ? (
            <div className="loading-container">
              <div className="loading-spinner"></div>
              <p>Loading blog posts...</p>
            </div>
          ) : error ? (
            <div className="error-message">
              <p>{error}</p>
              <button onClick={() => fetchPosts()}>Retry</button>
            </div>
          ) : (
            <>
              <div className="posts-count">
                <strong>{posts.length}</strong> posts found
              </div>
              
              <div className="posts-grid">
                {posts.length === 0 ? (
                  <div className="no-results">No blog posts found</div>
                ) : (
                  posts.map(post => (
                    <div key={post._id} className="post-card">
                      {post.image && (
                        <div className="post-image">
                          <img 
                            src={post.image} 
                            alt={post.title}
                            width="800"
                            height="600"
                            style={{ width: '100%', height: 'auto' }}
                          />
                        </div>
                      )}
                      <div className="post-content">
                        <div className="post-header">
                          <h4 className="post-title">{post.title}</h4>
                          <div className="post-badges">
                            {post.featured && <span className="badge badge-featured">Featured</span>}
                            <span className={`badge ${post.published ? 'badge-published' : 'badge-draft'}`}>
                              {post.published ? 'Published' : 'Draft'}
                            </span>
                          </div>
                        </div>
                        <p className="post-excerpt">{post.excerpt}</p>
                        <div className="post-meta">
                          <span>Category: {post.category}</span>
                          <span>Read Time: {post.readTime}</span>
                          <span>Created: {formatDate(post.createdAt)}</span>
                        </div>
                        <div className="post-actions">
                          <button 
                            className="action-btn edit-btn"
                            onClick={() => handleEdit(post)}
                          >
                            Edit
                          </button>
                          <button 
                            className={`action-btn ${post.featured ? 'unfeature-btn' : 'feature-btn'}`}
                            onClick={() => handleToggleFeatured(post)}
                            disabled={processingPost === post._id}
                          >
                            {processingPost === post._id ? '...' : (post.featured ? 'Unfeature' : 'Feature')}
                          </button>
                          <button 
                            className={`action-btn ${post.published ? 'unpublish-btn' : 'publish-btn'}`}
                            onClick={() => handleTogglePublished(post)}
                            disabled={processingPost === post._id}
                          >
                            {processingPost === post._id ? '...' : (post.published ? 'Unpublish' : 'Publish')}
                          </button>
                          <button 
                            className="action-btn delete-btn"
                            onClick={() => handleDelete(post)}
                            disabled={processingPost === post._id}
                          >
                            {processingPost === post._id ? '...' : 'Delete'}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default BlogManagement;