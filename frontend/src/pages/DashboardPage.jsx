import React, { useState, useEffect } from "react";
import apiClient from "../api";
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
  const [stats, setStats] = useState({ notes_count: 0, tags_count: 0 });
  
  // UI State
  const [viewMode, setViewMode] = useState("grid");
  const [showFormSection, setShowFormSection] = useState(false);
  const [showTagManager, setShowTagManager] = useState(false);
  const [showStats, setShowStats] = useState(false);
  
  // Search & sort
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOrder, setSortOrder] = useState("newest");

  // Keep server awake
  useEffect(() => {
    const interval = setInterval(() => {
      fetch(`${import.meta.env.VITE_API_BASE_URL}/ping`).catch(() => {});
    }, 5 * 60 * 1000); // Ping every 5 minutes
    
    return () => clearInterval(interval);
  }, []);

  const fetchNotes = async () => {
    try {
      const response = await apiClient.get("/users/me/notes/");
      setNotes(response.data);
    } catch {
      setError("Could not fetch notes.");
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

  const fetchStats = async () => {
    try {
      const res = await apiClient.get("/users/me/stats");
      setStats(res.data);
    } catch {
      console.error("Could not fetch stats");
    }
  };

  useEffect(() => {
    fetchNotes();
    fetchTags();
    fetchStats();
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
      setSuccess("Note created successfully! ✨");
      setShowFormSection(false);
      fetchNotes();
      fetchStats();
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
      setShowFormSection(false);
      fetchNotes();
    } catch {
      setError("Failed to edit note.");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this note?")) return;
    try {
      await apiClient.delete(`/users/me/notes/${id}`);
      setSuccess("Note deleted successfully! 🗑️");
      fetchNotes();
      fetchStats();
    } catch {
      setError("Failed to delete note.");
    }
  };

  const handleEdit = (note) => {
    setEditingNote(note);
    setTitle(note.title);
    setContent(note.content);
    setSelectedTags(note.tags ? note.tags.map(tag => tag.id) : []);
    setShowFormSection(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
      setSuccess("Tag created! 🏷️");
      fetchStats();
    } catch {
      setError("Could not create tag.");
    }
  };

  const handleDeleteTag = async (tagId) => {
    if (!window.confirm("Delete this tag? (Only works if no notes use it)")) return;
    
    try {
      await apiClient.delete(`/tags/${tagId}`);
      setTags(tags.filter(t => t.id !== tagId));
      setSuccess("Tag deleted! 🗑️");
      fetchStats();
    } catch (err) {
      setError(err.response?.data?.detail || "Cannot delete tag");
    }
  };

  const handleEditTag = async (tagId) => {
    if (!editTagName.trim()) return;
    
    try {
      const res = await apiClient.put(`/tags/${tagId}`, { name: editTagName.trim() });
      setTags(tags.map(t => t.id === tagId ? res.data : t));
      setEditingTag(null);
      setEditTagName("");
      setSuccess("Tag renamed! ✏️");
      fetchNotes();
    } catch (err) {
      setError(err.response?.data?.detail || "Cannot edit tag");
    }
  };

  // Apply filters
  const filteredNotes = notes
    .filter((n) =>
      n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (n.tags && n.tags.some(t => t.name.toLowerCase().includes(searchQuery.toLowerCase())))
    )
    .sort((a, b) => {
      switch (sortOrder) {
        case "newest": return b.id - a.id;
        case "oldest": return a.id - b.id;
        case "az": return a.title.localeCompare(b.title);
        case "za": return b.title.localeCompare(a.title);
        default: return 0;
      }
    });

  return (
    <div className="dashboard-container">
      {/* Top Controls */}
      <div className="top-controls">
        <div className="search-bar">
          <input
            type="text"
            placeholder="Search notes or tags..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <select 
          className="sort-select"
          value={sortOrder} 
          onChange={(e) => setSortOrder(e.target.value)}
        >
          <option value="newest">📅 Newest First</option>
          <option value="oldest">📂 Oldest First</option>
          <option value="az">🔤 A → Z</option>
          <option value="za">🔤 Z → A</option>
        </select>
        <div className="view-toggle">
          <button 
            className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
            onClick={() => setViewMode('grid')}
          >
            Grid
          </button>
          <button 
            className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
            onClick={() => setViewMode('list')}
          >
            List
          </button>
        </div>
      </div>

      {/* Error/Success Messages */}
      {error && <p className="error">{error}</p>}
      {success && <p className="success">{success}</p>}

      {/* Notes Section (Primary Focus) */}
      <div className="notes-section">
      <div className="notes-header">
        <h2 className="title-with-emoji">
            <span className="emoji-icon">📝</span>
            <span className="bg-text">Your Notes</span>
        </h2>
        <span className="notes-count">{filteredNotes.length} notes</span>
      </div>
        
        <div className={viewMode === 'grid' ? 'notes-grid' : 'notes-list'}>
          {filteredNotes.length === 0 ? (
            <div className="glass-card" style={{ padding: '3rem', textAlign: 'center' }}>
              <h3>No notes found</h3>
              <p style={{ marginBottom: '1.5rem' }}>
                {searchQuery ? "Try different search terms" : "Create your first note below!"}
              </p>
              {!searchQuery && (
                <button 
                  className="btn btn-primary"
                  onClick={() => setShowFormSection(true)}
                  style={{ width: 'auto', padding: '0.8rem 2rem' }}
                >
                  Create First Note
                </button>
              )}
            </div>
          ) : (
            filteredNotes.map((note, index) => (
              <div key={note.id} className="note-card" style={{ animationDelay: `${Math.min(index * 0.05, 0.3)}s` }}>
                <h4>{note.title}</h4>
                <p className="note-content">{note.content}</p>
                
                {note.tags && note.tags.length > 0 && (
                  <div className="note-tags">
                    {note.tags.map(tag => (
                      <span key={tag.id} className="note-tag">
                        #{tag.name}
                      </span>
                    ))}
                  </div>
                )}
                
                <div className="note-actions">
                  <button className="note-edit-btn" onClick={() => handleEdit(note)}>
                    ✏️ Edit
                  </button>
                  <button className="note-delete-btn" onClick={() => handleDelete(note.id)}>
                    🗑️ Delete
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Collapsible Note Form */}
      <div className={`collapsible-section ${!showFormSection ? 'collapsed' : ''}`}>
        <div className="collapsible-header" onClick={() => setShowFormSection(!showFormSection)}>
        <div className="collapsible-title">
          <span className="emoji-icon">{editingNote ? '✏️' : '✨'}</span>
          <span>{editingNote ? 'Edit Note' : 'Create New Note'}</span>
        </div>
          <span className="collapse-icon">▼</span>
        </div>
        
        <div className="collapsible-content">
          <form className="form-grid" onSubmit={editingNote ? handleUpdateNote : handleAddNote}>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter note title..."
              required
            />
            
            <textarea
              className="note-textarea"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write your thoughts..."
              required
            />
            
            <div className="tag-selector">
              <label>Select Tags:</label>
              <div className="tag-chips">
                {tags.map((tag) => (
                  <span
                    key={tag.id}
                    className={`tag-chip ${selectedTags.includes(tag.id) ? "active" : ""}`}
                    onClick={() => toggleTag(tag.id)}
                  >
                    #{tag.name}
                  </span>
                ))}
              </div>
              
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
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
                />
                <button 
                  type="button" 
                  className="btn btn-secondary"
                  onClick={handleAddCustomTag}
                  style={{ width: 'auto', padding: '0.8rem 1.5rem' }}
                >
                  Add Tag
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem' }}>
              <button type="submit" className="btn btn-primary">
                {editingNote ? "Update Note" : "Create Note"}
              </button>
              {editingNote && (
                <button 
                  type="button" 
                  className="btn btn-danger"
                  onClick={() => { 
                    setEditingNote(null); 
                    setTitle(""); 
                    setContent(""); 
                    setSelectedTags([]);
                    setShowFormSection(false);
                  }}
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>
      </div>

      {/* Collapsible Tag Manager */}
      <div className={`collapsible-section ${!showTagManager ? 'collapsed' : ''}`}>
        <div className="collapsible-header" onClick={() => setShowTagManager(!showTagManager)}>
        <div className="collapsible-title">
            <span className="emoji-icon">🏷️</span>
            <span>Manage Tags</span>
            <span style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>
              ({tags.length} tags)
            </span>
          </div>
          <span className="collapse-icon">▼</span>
        </div>
        
        <div className="collapsible-content">
          <div className="tag-manager">
            <div className="tag-list">
              {tags.map(tag => (
                <div key={tag.id} className="tag-item">
                  {editingTag === tag.id ? (
                    <input
                      type="text"
                      value={editTagName}
                      onChange={(e) => setEditTagName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleEditTag(tag.id);
                        if (e.key === 'Escape') {
                          setEditingTag(null);
                          setEditTagName("");
                        }
                      }}
                      autoFocus
                      style={{ marginBottom: 0 }}
                    />
                  ) : (
                    <div className="tag-name">
                      <span className="tag-color"></span>
                      <span>{tag.name}</span>
                    </div>
                  )}
                  <div className="tag-actions">
                    {editingTag === tag.id ? (
                      <>
                        <button 
                          className="tag-btn tag-edit"
                          onClick={() => handleEditTag(tag.id)}
                        >
                          ✓
                        </button>
                        <button 
                          className="tag-btn tag-delete"
                          onClick={() => {
                            setEditingTag(null);
                            setEditTagName("");
                          }}
                        >
                          ✕
                        </button>
                      </>
                    ) : (
                      <>
                        <button 
                          className="tag-btn tag-edit"
                          onClick={() => {
                            setEditingTag(tag.id);
                            setEditTagName(tag.name);
                          }}
                        >
                          ✏️
                        </button>
                        <button 
                          className="tag-btn tag-delete"
                          onClick={() => handleDeleteTag(tag.id)}
                        >
                          🗑️
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Collapsible Stats */}
      <div className={`collapsible-section ${!showStats ? 'collapsed' : ''}`}>
        <div className="collapsible-header" onClick={() => setShowStats(!showStats)}>
        <div className="collapsible-title">
            <span className="emoji-icon">📊</span>
            <span>Statistics</span>
        </div>
          <span className="collapse-icon">▼</span>
        </div>
        
        <div className="collapsible-content">
          <div className="stats-mini">
            <div className="stat-mini">
              <div className="stat-mini-value">{stats.notes_count}</div>
              <div className="stat-mini-label">Total Notes</div>
            </div>
            <div className="stat-mini">
              <div className="stat-mini-value">{stats.tags_count}</div>
              <div className="stat-mini-label">Total Tags</div>
            </div>
            <div className="stat-mini">
              <div className="stat-mini-value">{filteredNotes.length}</div>
              <div className="stat-mini-label">Filtered</div>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Action Button */}
      <div className="fab-container">
        <button 
          className="fab"
          onClick={() => {
            setShowFormSection(true);
            setEditingNote(null);
            setTitle("");
            setContent("");
            setSelectedTags([]);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        >
          ➕
        </button>
      </div>
    </div>
  );
}

export default DashboardPage;