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
  const [tags, setTags] = useState([]); // all tags from backend
  const [selectedTags, setSelectedTags] = useState([]);
  const [newTag, setNewTag] = useState("");

  // Search & sort
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOrder, setSortOrder] = useState("newest");

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
        tag_ids: selectedTags  // Include selected tags
      });
      
      setTitle(""); 
      setContent("");
      setSelectedTags([]); // Reset selected tags
      setSuccess("Note added ✨");
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
        tag_ids: selectedTags  // Include selected tags for update
      });
      
      setEditingNote(null);
      setTitle(""); 
      setContent("");
      setSelectedTags([]); // Reset selected tags
      setSuccess("Note updated ✨");
      fetchNotes();
    } catch {
      setError("Failed to edit note.");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this note?")) return;
    try {
      await apiClient.delete(`/users/me/notes/${id}`);
      setSuccess("Note deleted ✅");
      fetchNotes();
    } catch {
      setError("Failed to delete note.");
    }
  };

  const handleEdit = (note) => {
    setEditingNote(note);
    setTitle(note.title);
    setContent(note.content);
    // Set selected tags based on the note's existing tags
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
      setSuccess("Tag created ✅");
    } catch {
      setError("Could not create tag.");
    }
  };

  // Apply filters
  const filteredNotes = notes
    .filter((n) =>
      n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.content.toLowerCase().includes(searchQuery.toLowerCase())
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

  return (
    <div className="container">
      <h2>My Dashboard</h2>

      {/* Search & Sort controls */}
      <div className="controls">
        <input
          type="text"
          placeholder="🔍 Search notes..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <select value={sortOrder} onChange={(e) => setSortOrder(e.target.value)}>
          <option value="newest">📅 Newest</option>
          <option value="oldest">📂 Oldest</option>
          <option value="az">A → Z</option>
          <option value="za">Z → A</option>
        </select>
      </div>

      {/* Add/Edit Form */}
      <form className="note-form" onSubmit={editingNote ? handleUpdateNote : handleAddNote}>
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
          rows="3"
        />
        
        {/* Tag Selector */}
        <div className="tag-section">
          <label>Tags:</label>
          <div className="tag-selector">
            {tags.map((tag) => (
              <span
                key={tag.id}
                className={`tag-chip ${selectedTags.includes(tag.id) ? "active" : ""}`}
                onClick={() => toggleTag(tag.id)}
                style={{
                  cursor: 'pointer',
                  padding: '0.3rem 0.6rem',
                  margin: '0.2rem',
                  borderRadius: '15px',
                  background: selectedTags.includes(tag.id) ? 'var(--color-primary)' : 'var(--color-border)',
                  color: selectedTags.includes(tag.id) ? 'white' : 'var(--color-text)',
                  display: 'inline-block',
                  fontSize: '0.85rem'
                }}
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
              style={{ flex: 1 }}
            />
            <button 
              type="button" 
              onClick={handleAddCustomTag}
              style={{ width: 'auto', padding: '0.5rem 1rem' }}
            >
              Add Tag
            </button>
          </div>
        </div>

        <button type="submit">
          {editingNote ? "✏️ Update Note" : "➕ Add Note"}
        </button>
        {editingNote && (
          <button 
            type="button" 
            onClick={() => { 
              setEditingNote(null); 
              setTitle(""); 
              setContent(""); 
              setSelectedTags([]);
            }}
            style={{ background: "var(--color-danger)", marginTop: "0.5rem" }}
          >
            Cancel
          </button>
        )}
      </form>

      {error && <p className="error">{error}</p>}
      {success && <p className="success">{success}</p>}

      {/* Notes List */}
      <h3>Your Notes ({filteredNotes.length})</h3>
      <div className="notes-grid">
        {filteredNotes.length === 0 && <p>No matching notes 😶</p>}
        {filteredNotes.map((note) => (
          <div key={note.id} className="note-card">
            <h4>{note.title}</h4>
            <p>{note.content}</p>
            
            {/* Display tags */}
            {note.tags && note.tags.length > 0 && (
              <div className="note-tags" style={{ marginTop: '0.5rem' }}>
                {note.tags.map(tag => (
                  <span 
                    key={tag.id} 
                    className="tag-badge"
                    style={{
                      fontSize: '0.75rem',
                      padding: '0.2rem 0.5rem',
                      marginRight: '0.3rem',
                      borderRadius: '10px',
                      background: 'var(--color-accent)',
                      color: 'var(--color-text)',
                      display: 'inline-block'
                    }}
                  >
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
    </div>
  );
}

export default DashboardPage;