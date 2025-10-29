import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "./Social.css";

export default function Social() {
  const navigate = useNavigate();
  const token =
    localStorage.getItem("token_student") || localStorage.getItem("token");

  const [me, setMe] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [text, setText] = useState("");
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const [editPost, setEditPost] = useState(null);
  const [editText, setEditText] = useState("");

  const fileInputRef = useRef();

  // Fetch current user & posts
  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }
    fetchMe();
    fetchPosts();
  }, [token]);

  async function fetchMe() {
    try {
      const res = await fetch("https://neuraliftx.onrender.com/api/profile", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch profile");
      const data = await res.json();
      setMe(data.user);
    } catch (err) {
      console.error("Profile error:", err);
    }
  }

  async function fetchPosts() {
    setLoading(true);
    try {
      const res = await fetch("https://neuraliftx.onrender.com/api/posts", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch posts");
      const data = await res.json();
      setPosts(data.posts || []);
    } catch (err) {
      console.error("Fetch posts error:", err);
    } finally {
      setLoading(false);
    }
  }

  // File preview
  function handleFileChange(e) {
    const f = e.target.files[0];
    setFile(f || null);
    if (!f) return setPreviewUrl(null);
    const url = URL.createObjectURL(f);
    setPreviewUrl(url);
  }

  // Create new post
  async function handleSubmitPost() {
    if (!text.trim() && !file) {
      alert("Please write something or attach a file.");
      return;
    }
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append("text", text);
      if (file) fd.append("media", file);

      const res = await fetch("https://neuraliftx.onrender.com/api/posts", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to post");
      }
      const data = await res.json();
      setPosts((prev) => [data.post, ...prev]);
      setText("");
      setFile(null);
      setPreviewUrl(null);
      if (fileInputRef.current) fileInputRef.current.value = null;
    } catch (err) {
      console.error("Post error:", err);
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  // Like/unlike
  async function toggleLike(postId) {
    setPosts((prev) =>
      prev.map((p) =>
        p._id === postId
          ? {
              ...p,
              likedByMe: !p.likedByMe,
              likeCount: (p.likeCount || 0) + (p.likedByMe ? -1 : 1),
            }
          : p
      )
    );
    try {
      const res = await fetch(
        `https://neuraliftx.onrender.com/api/posts/${postId}/like`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (!res.ok) throw new Error("Like failed");
      const data = await res.json();
      setPosts((p) =>
        p.map((post) =>
          post._id === postId
            ? { ...post, likedByMe: data.action === "liked", likeCount: data.likeCount }
            : post
        )
      );
    } catch (err) {
      console.error("Like error:", err);
      fetchPosts();
    }
  }

  // Comment
  async function addComment(postId, commentText, setLocalInput) {
    if (!commentText.trim()) return;
    try {
      const res = await fetch(
        `https://neuraliftx.onrender.com/api/posts/${postId}/comment`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ text: commentText }),
        }
      );
      if (!res.ok) throw new Error("Comment failed");
      const data = await res.json();
      setPosts((prev) =>
        prev.map((post) =>
          post._id === postId
            ? {
                ...post,
                comments: [...(post.comments || []), data.comment],
                commentCount: data.commentCount,
              }
            : post
        )
      );
      setLocalInput("");
    } catch (err) {
      console.error("Comment error:", err);
      alert("Unable to comment.");
    }
  }

  // Share
  async function sharePost(postId) {
    try {
      const res = await fetch(
        `https://neuraliftx.onrender.com/api/posts/${postId}/share`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (!res.ok) throw new Error("Share failed");
      const data = await res.json();
      setPosts((p) =>
        p.map((post) =>
          post._id === postId ? { ...post, shareCount: data.shareCount } : post
        )
      );
      alert("Shared successfully!");
    } catch (err) {
      console.error("Share error:", err);
    }
  }

  // Edit Post
  async function handleEditSubmit() {
    try {
      const res = await fetch(
        `https://neuraliftx.onrender.com/api/posts/${editPost._id}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ text: editText }),
        }
      );
      if (!res.ok) throw new Error("Failed to edit post");
      const data = await res.json();
      setPosts((p) =>
        p.map((post) => (post._id === editPost._id ? data.post : post))
      );
      setEditPost(null);
      setEditText("");
    } catch (err) {
      console.error("Edit error:", err);
      alert(err.message);
    }
  }

  // Delete Post
  async function handleDelete(postId) {
    if (!window.confirm("Are you sure you want to delete this post?")) return;
    try {
      const res = await fetch(
        `https://neuraliftx.onrender.com/api/posts/${postId}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (!res.ok) throw new Error("Delete failed");
      setPosts((prev) => prev.filter((p) => p._id !== postId));
    } catch (err) {
      console.error("Delete error:", err);
      alert(err.message);
    }
  }

  // Media renderer
  function MediaRenderer({ media }) {
    if (!media || !media.fileUrl) return null;
    const url = `https://neuraliftx.onrender.com${media.fileUrl}`;
    if (media.mimeType?.startsWith("image/")) {
      return <img src={url} alt={media.originalName} className="post-media-image" />;
    }
    if (media.mimeType?.startsWith("video/")) {
      return (
        <video className="post-media-video" controls>
          <source src={url} type={media.mimeType} />
        </video>
      );
    }
    return (
      <div className="post-media-file">
        <a href={url} target="_blank" rel="noreferrer">
          📄 {media.originalName || "View Document"}
        </a>
      </div>
    );
  }

  // Post card
  function PostCard({ post }) {
    const [showComments, setShowComments] = useState(false);
    const [commentInput, setCommentInput] = useState("");
    const [menuOpen, setMenuOpen] = useState(false);

    const author = post.user || {};
    const comments = post.comments || [];

    const isOwner = me && author && me._id === author._id;

    return (
      <div className="post-card">
        <div className="post-header">
          <img
            src={
              author.profilePicUrl
                ? `https://neuraliftx.onrender.com${author.profilePicUrl}`
                : "https://via.placeholder.com/40"
            }
            alt="avatar"
            className="avatar-small"
          />
          <div className="post-meta">
            <div className="post-author">
              {author.firstName} {author.lastName}
            </div>
            <div className="post-time">
              {new Date(post.createdAt).toLocaleString()}
            </div>
          </div>

          {isOwner && (
            <div className="post-menu">
              <span
                className="menu-trigger"
                onClick={() => setMenuOpen((prev) => !prev)}
              >
                ⋮
              </span>
              {menuOpen && (
                <div className="menu-dropdown">
                  <button
                    onClick={() => {
                      setEditPost(post);
                      setEditText(post.text);
                      setMenuOpen(false);
                    }}
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => {
                      handleDelete(post._id);
                      setMenuOpen(false);
                    }}
                  >
                    Delete
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="post-body">
          {post.text && <div className="post-text">{post.text}</div>}
          {post.media && <MediaRenderer media={post.media} />}
        </div>

        <div className="post-actions">
          <button
            className={`action-btn ${post.likedByMe ? "liked" : ""}`}
            onClick={() => toggleLike(post._id)}
          >
            👍 {post.likeCount || 0}
          </button>
          <button className="action-btn" onClick={() => setShowComments(!showComments)}>
            💬 {post.commentCount || comments.length || 0}
          </button>
          <button className="action-btn" onClick={() => sharePost(post._id)}>
            ↪️ {post.shareCount || 0}
          </button>
        </div>

        {showComments && (
          <div className="comments-section">
            {comments.map((c) => (
              <div className="comment" key={c._id}>
                <img
                  src={
                    c.user?.profilePicUrl
                      ? `https://neuraliftx.onrender.com${c.user.profilePicUrl}`
                      : "https://via.placeholder.com/40"
                  }
                  alt="commenter"
                  className="avatar-comment"
                />
                <div className="comment-body">
                  <div className="comment-author">
                    {c.user?.firstName} {c.user?.lastName}
                  </div>
                  <div className="comment-text">{c.text}</div>
                </div>
              </div>
            ))}
            <div className="comment-input">
              <input
                type="text"
                placeholder="Write a comment..."
                value={commentInput}
                onChange={(e) => setCommentInput(e.target.value)}
                onKeyDown={(e) =>
                  e.key === "Enter" &&
                  addComment(post._id, commentInput, setCommentInput)
                }
              />
              <button onClick={() => addComment(post._id, commentInput, setCommentInput)}>
                Post
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // UI
  return (
    <div className="social-root">
      <div className="social-container">
        <div className="create-card">
          <div className="create-left">
            <img
              src={
                me?.profilePicUrl
                  ? `https://neuraliftx.onrender.com${me.profilePicUrl}`
                  : "https://via.placeholder.com/40"
              }
              alt="me"
              className="avatar-small"
            />
          </div>
          <div className="create-right">
            <textarea
              placeholder="Share an update, idea, file, or story..."
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={3}
            />
            {previewUrl && (
              <div className="preview-box">
                {file?.type.startsWith("image/") && (
                  <img src={previewUrl} alt="preview" className="preview-img" />
                )}
                {file?.type.startsWith("video/") && (
                  <video src={previewUrl} controls className="preview-video" />
                )}
                {file?.type === "application/pdf" && <div>📄 {file.name}</div>}
              </div>
            )}
            <div className="create-actions">
              <input
                type="file"
                accept="image/*,video/*,application/pdf"
                onChange={handleFileChange}
                ref={fileInputRef}
              />
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  className="primary-btn"
                  onClick={handleSubmitPost}
                  disabled={submitting}
                >
                  {submitting ? "Posting..." : "Post"}
                </button>
                <button
                  className="secondary-btn"
                  onClick={() => {
                    setText("");
                    setFile(null);
                    setPreviewUrl(null);
                    if (fileInputRef.current) fileInputRef.current.value = null;
                  }}
                >
                  Clear
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Edit Modal */}
        {editPost && (
          <div className="modal-overlay">
            <div className="modal">
              <h3>Edit Post</h3>
              <textarea
                rows={4}
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
              />
              <div className="modal-actions">
                <button className="primary-btn" onClick={handleEditSubmit}>
                  Save
                </button>
                <button className="secondary-btn" onClick={() => setEditPost(null)}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="feed">
          {loading ? (
            <p>Loading feed...</p>
          ) : posts.length === 0 ? (
            <p>No posts yet — be the first to post!</p>
          ) : (
            posts.map((p) => <PostCard key={p._id} post={p} />)
          )}
        </div>
      </div>
    </div>
  );
}
