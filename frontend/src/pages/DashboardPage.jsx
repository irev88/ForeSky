import React, { useState, useEffect } from "react";
import apiClient from "../api";
import ParticleBackground from "../components/ParticleBackground";
import "./Dashboard.css";

function DashboardPage() {
  const [notes, setNotes] = useState([]);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [editingNote, setEditingNote] = useState(null);
  const [tags, setTags] = useState([]);
  const [selectedTags, setSelectedTags] = useState([]);
  const [newTag, setNewTag] = useState("");
  const [editingTag, setEditingTag] = useState(null);
  const [editTagName, setEditTagName] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOrder, setSortOrder] = useState("newest");
  const [loading, setLoading] = useState(false);

  const fetchNotes = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get("/users/me/notes/");
      setNotes(response.data);
    } catch {
      setError("Could not fetch notes.");
    } finally {
      setLoading(false);
    }
  };

  const fetchTags = async () => {
    try {
      const res = await apiClient.get("/tags/");
      setTags(res.data);
    } catch {
      setError("Could not fetch tags.");
    }
  };

  useEffect(() => {
    fetchNotes();
    fetchTags();
  }, []);

  const handleAddNote = async (e) => {
    e.preventDefault();
    setError(""); 
    setSuccess("");
    
    try {
      await apiClient.post("/users/me/notes/", { 
        title, 
        content,
        tag_ids: selectedTags
      });
      
      setTitle(""); 
      setContent("");
      setSelectedTags([]);
      setSuccess("Note added successfully! ✨");
      fetchNotes();
    } catch {
      setError("Could not add note.");
    }
  };

  const handleUpdateNote = async (e) => {
    e.preventDefault();
    try {
      await apiClient.put(`/users/me/notes/${editingNote.id}`, {
        title, 
        content,
        tag_ids: selectedTags
      });
      
      setEditingNote(null);
      setTitle(""); 
      setContent("");
      setSelectedTags([]);
      setSuccess("Note updated successfully! ✨");
      fetchNotes();
    } catch {
      setError("Failed to edit note.");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this note?")) return;
    try {
      await apiClient.delete(`/users/me/notes/${id}`);
      setSuccess("Note deleted successfully! ✅");
      fetchNotes();
    } catch {
      setError("Failed to delete note.");
    }
  };

  const handleEdit = (note) => {
    setEditingNote(note);
    setTitle(note.title);
    setContent(note.content);
    setSelectedTags(note.tags ? note.tags.map(tag => tag.id) : []);
  };

  const toggleTag = (tagId) => {
    setSelectedTags((prev) =>
      prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId]
    );
  };

  const handleAddCustomTag = async () => {
    if (!newTag.trim()) return;
    
    try {
      const res = await apiClient.post("/tags/", { name: newTag.trim() });
      if (!tags.find(t => t.id === res.data.id)) {
        setTags((prev) => [...prev, res.data]);
      }
      setNewTag("");
      setSuccess("Tag created successfully! ✅");
    } catch {
      setError("Could not create tag.");
    }
  };

  const handleEditTag = async (tagId) => {
    if (!editTagName.trim()) return;
    
    try {
      const res = await apiClient.put(`/tags/${tagId}`, { name: editTagName.trim() });
      setTags(tags.map(t => t.id === tagId ? res.data : t));
      setEditingTag(null);
      setEditTagName("");
      setSuccess("Tag updated successfully! ✨");
      fetchNotes(); // Refresh notes to show updated tag names
    } catch (err) {
      setError(err.response?.data?.detail || "Could not update tag.");
    }
  };

  const handleDeleteTag = async (tagId) => {
    if (!window.confirm("Are you sure you want to delete this tag?")) return;
    
    try {
      await apiClient.delete(`/tags/${tagId}`);
      setTags(tags.filter(t => t.id !== tagId));
      setSuccess("Tag deleted successfully! ✅");
    } catch (err) {
      setError(err.response?.data?.detail || "Could not delete tag.");
    }
  };

  // Apply filters
  const filteredNotes = notes
    .filter((n) =>
      n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.tags?.some(tag => tag.name.toLowerCase().includes(searchQuery.toLowerCase()))
    )
    .sort((a, b) => {
      switch (sortOrder) {
        case "newest":
          return b.id - a.id;
        case "oldest":
          return a.id - b.id;
        case "az":
          return a.title.localeCompare(b.title);
        case "za":
          return b.title.localeCompare(a.title);
        default:
          return 0;
      }
    });

  // Calculate stats
  const totalNotes = notes.length;
  const totalTags = tags.length;
  const avgTagsPerNote = totalNotes > 0 
    ? (notes.reduce((sum, note) => sum + (note.tags?.length || 0), 0) / totalNotes).toFixed(1)
    : 0;

  return (
    <>
      <ParticleBackground />
      <div className="app-container">
        <div className="glass-container">
          <div className="dashboard-header">
            <h1 className="dashboard-title">My Dashboard</h1>
          </div>

          {/* Stats Cards */}
          <div className="stats-cards">
            <div className="stat-card">
              <div className="stat-number">{totalNotes}</div>
              <div className="stat-label">Total Notes</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">{totalTags}</div>
              <div className="stat-label">Total Tags</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">{avgTagsPerNote}</div>
              <div className="stat-label">Avg Tags/Note</div>
            </div>
          </div>

          {/* Search & Sort controls */}
          <div className="controls">
            <div className="search-input">
              <input
                type="text"
                placeholder="Search notes or tags..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <select value={sortOrder} onChange={(e) => setSortOrder(e.target.value)}>
              <option value="newest">📅 Newest First</option>
              <option value="oldest">📂 Oldest First</option>
              <option value="az">🔤 A → Z</option>
              <option value="za">🔤 Z → A</option>
            </select>
          </div>

          {/* Tag Manager */}
          <div className="tag-manager">
            <div className="tag-manager-header">
              <h3>Tag Manager</h3>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input
                  type="text"
                  placeholder="Create new tag..."
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddCustomTag();
                    }
                  }}
                  style={{ width: '200px', marginBottom: 0 }}
                />
                <button 
                  onClick={handleAddCustomTag}
                  style={{ width: 'auto', padding: '0.75rem 1.5rem' }}
                >
                  Add Tag
                </button>
              </div>
            </div>
            
            <div className="tags-grid">
              {tags.map((tag) => (
                <div key={tag.id} className={`tag-item ${editingTag === tag.id ? 'editing' : ''}`}>
                  {editingTag === tag.id ? (
                    <>
                      <input
                        type="text"
                        value={editTagName}
                        onChange={(e) => setEditTagName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleEditTag(tag.id);
                          } else if (e.key === 'Escape') {
                            setEditingTag(null);
                            setEditTagName("");
                          }
                        }}
                        autoFocus
                      />
                      <div className="tag-actions">
                        <button onClick={() => handleEditTag(tag.id)}>✓</button>
                        <button onClick={() => { setEditingTag(null); setEditTagName(""); }}>✗</button>
                      </div>
                    </>
                  ) : (
                    <>
                      <span>#{tag.name}</span>
                      <div className="tag-actions">
                        <button onClick={() => { setEditingTag(tag.id); setEditTagName(tag.name); }}>✏️</button>
                        <button onClick={() => handleDeleteTag(tag.id)}>🗑️</button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Add/Edit Form */}
          <form className="note-form" onSubmit={editingNote ? handleUpdateNote : handleAddNote}>
            <div className="form-header">
              <h3>{editingNote ? "Edit Note" : "Create New Note"}</h3>
            </div>
            
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Note Title"
              required
            />
            
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write your thoughts..."
              rows="4"
            />
            
            {/* Tag Selector */}
            <div>
              <label style={{ marginBottom: '0.5rem', display: 'block', color: 'var(--color-text-secondary)' }}>
                Select Tags:
              </label>
              <div className="tag-selector">
                {tags.length === 0 ? (
                  <span style={{ color: 'var(--color-text-secondary)' }}>No tags available. Create one above!</span>
                ) : (
                  tags.map((tag) => (
                    <span
                      key={tag.id}
                      className={`tag-chip ${selectedTags.includes(tag.id) ? "active" : ""}`}
                      onClick={() => toggleTag(tag.id)}
                    >
                      #{tag.name}
                    </span>
                  ))
                )}
              </div>
            </div>

            <div className="form-actions">
              <button type="submit">
                {editingNote ? "💾 Update Note" : "➕ Add Note"}
              </button>
              {editingNote && (
                <button 
                  type="button" 
                  className="danger"
                  onClick={() => { 
                    setEditingNote(null); 
                    setTitle(""); 
                    setContent(""); 
                    setSelectedTags([]);
                  }}
                >
                  Cancel
                </button>
              )}
            </div>
          </form>

          {error && <p className="error">{error}</p>}
          {success && <p className="success">{success}</p>}

          {/* Notes Section */}
          <div className="notes-section">
            <div className="notes-header">
              <h3>Your Notes</h3>
              <span className="notes-count">{filteredNotes.length} notes found</span>
            </div>
            
            {loading ? (
              <div className="loading">
                <div className="spinner"></div>
              </div>
            ) : filteredNotes.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">📝</div>
                <h3>No notes found</h3>
                <p>{searchQuery ? "Try a different search term" : "Create your first note above!"}</p>
              </div>
            ) : (
              <div className="notes-grid">
                {filteredNotes.map((note) => (
                  <div key={note.id} className="note-card">
                    <h4>{note.title}</h4>
                    <p>{note.content}</p>
                    
                    {note.tags && note.tags.length > 0 && (
                      <div className="note-tags">
                        {note.tags.map(tag => (
                          <span key={tag.id} className="tag-badge">
                            #{tag.name}
                          </span>
                        ))}
                      </div>
                    )}
                    
                    <div className="note-actions">
                      <button onClick={() => handleEdit(note)}>✏️ Edit</button>
                      <button onClick={() => handleDelete(note.id)}>🗑️ Delete</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

export default DashboardPage;