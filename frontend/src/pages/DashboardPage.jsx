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

  useEffect(() => {
    fetchNotes();
  }, []);

  const handleAddNote = async (e) => {
    e.preventDefault();
    setError(""); setSuccess("");
    try {
        await apiClient.post("/users/me/notes/", { 
            title, 
            content,
            tag_ids: selectedTags 
          });
      setTitle(""); setContent("");
      setSuccess("Note added ✨");
      fetchNotes();
    } catch {
      setError("Could not add note.");
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
      setTitle(""); setContent("");
      setSuccess("Note updated ✨");
      fetchNotes();
    } catch {
      setError("Failed to edit note.");
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
  const fetchTags = async () => {
    const res = await apiClient.get("/tags/");
    setTags(res.data);
  };

  useEffect(() => {
    fetchTags();
  }, []);

  const toggleTag = (tagId) => {
    setSelectedTags((prev) =>
      prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId]
    );
  };

  const handleAddCustomTag = async () => {
    if (!newTag) return;
    const res = await apiClient.post("/tags/", { name: newTag });
    setTags((prev) => [...prev, res.data]);
    setNewTag("");
  };

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
        <div className="tag-selector">
            {tags.map((tag) => (
                <span
                key={tag.id}
                className={`tag-chip ${selectedTags.includes(tag.id) ? "active" : ""}`}
                onClick={() => toggleTag(tag.id)}
                >
                #{tag.name}
                </span>
            ))}
            <input
                type="text"
                placeholder="Add custom tag"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddCustomTag()}
            />
        </div>
        <button type="submit">
          {editingNote ? "✏️ Update Note" : "➕ Add Note"}
        </button>
        {editingNote && (
          <button 
            type="button" 
            onClick={() => { setEditingNote(null); setTitle(""); setContent(""); }}
            style={{ background: "var(--color-danger)", marginTop: "0.5rem" }}
          >
            Cancel
          </button>
        )}
      </form>

      {error && <p className="error">{error}</p>}
      {success && <p className="success">{success}</p>}

      {/* Notes List */}
      <h3>Your Notes</h3>
      <div className="notes-grid">
        {filteredNotes.length === 0 && <p>No matching notes 😶</p>}
        {filteredNotes.map((note) => (
          <div key={note.id} className="note-card">
          <h4>{note.title}</h4>
          <p>{note.content}</p>
          
          {note.tags && note.tags.length > 0 && (
            <div className="tag-list">
                {note.tags.map(t => (
                <span key={t.id} className="tag-pill">#{t.name}</span>
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