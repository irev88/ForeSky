import React, { useState, useEffect } from 'react';
import apiClient from '../api';

function DashboardPage() {
    const [notes, setNotes] = useState([]);
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [error, setError] = useState('');

    const fetchNotes = async () => {
        try {
            const response = await apiClient.get('/users/me/notes/');
            setNotes(response.data);
        } catch (err) {
            setError('Could not fetch notes.');
        }
    };

    useEffect(() => {
        fetchNotes();
    }, []);

    const handleAddNote = async (e) => {
        e.preventDefault();
        try {
            await apiClient.post('/users/me/notes/', { title, content });
            setTitle('');
            setContent('');
            fetchNotes(); // Refresh notes list
        } catch (err) {
            setError('Could not add note.');
        }
    };

    return (
        <div>
            <h2>My Dashboard</h2>
            <h3>Add a New Note</h3>
            <form onSubmit={handleAddNote}>
                <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title" required />
                <textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder="Content"></textarea>
                <button type="submit">Add Note</button>
            </form>
            {error && <p style={{ color: 'red' }}>{error}</p>}

            <h3>My Notes</h3>
            <ul>
                {notes.map(note => (
                    <li key={note.id}>
                        <strong>{note.title}</strong>: {note.content}
                    </li>
                ))}
            </ul>
        </div>
    );
}

export default DashboardPage;