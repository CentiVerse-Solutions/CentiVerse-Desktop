import React, { useState, useRef, useEffect } from 'react';
import {
    Image,
    FileText,
    Paperclip,
    X,
    Plus,
    Search,
    Calendar,
    Tag,
    Download,
    Trash2,
    ChevronDown,
    Edit,
    Check,
    Copy,
    AtSign,
    EyeOff,
    MessageCircle,
    Heart,
    Share2,
    Camera,
    UserPlus
} from 'lucide-react';
import './Whiteboard.css';

const Whiteboard = ({ groupId }) => {
    // Mock current user
    const currentUser = {
        id: 1,
        name: "You",
        email: "you@example.com",
        avatar: "https://randomuser.me/api/portraits/men/32.jpg"
    };

    // Mock group members for tagging
    const groupMembers = [
        {
            id: 1,
            name: "You",
            email: "you@example.com",
            avatar: "https://randomuser.me/api/portraits/men/32.jpg"
        },
        {
            id: 2,
            name: "Rahul",
            email: "rahul@example.com",
            avatar: "https://randomuser.me/api/portraits/men/22.jpg"
        },
        {
            id: 3,
            name: "Priya",
            email: "priya@example.com",
            avatar: "https://randomuser.me/api/portraits/women/26.jpg"
        },
        {
            id: 4,
            name: "Amit",
            email: "amit@example.com",
            avatar: "https://randomuser.me/api/portraits/men/43.jpg"
        },
        {
            id: 5,
            name: "Neha",
            email: "neha@example.com",
            avatar: "https://randomuser.me/api/portraits/women/33.jpg"
        }
    ];

    // Sample notes with attachments, user info, and mentions
    const [notes, setNotes] = useState([
        {
            id: 1,
            text: "Everyone, I've uploaded the hotel booking receipt for our Thailand trip. @Rahul @Priya please check if the booking details are correct.",
            createdAt: "2025-01-06T10:30:00",
            author: {
                id: 1,
                name: "You",
                avatar: "https://randomuser.me/api/portraits/men/32.jpg"
            },
            attachments: [
                {
                    id: 101,
                    name: "thailand_hotel_receipt.jpg",
                    type: "image/jpeg",
                    size: "1.2 MB",
                    url: "/api/placeholder/800/500",
                }
            ],
            tags: ["receipt", "trip"],
            mentions: [2, 3], // IDs of mentioned users
            reactions: {
                likes: [2, 3, 4], // User IDs who liked
                seen: [2, 3, 4, 5] // User IDs who've seen
            },
            comments: [
                {
                    id: 201,
                    text: "Looks good! The check-in time is perfect.",
                    createdAt: "2025-01-06T11:42:00",
                    author: {
                        id: 2,
                        name: "Rahul",
                        avatar: "https://randomuser.me/api/portraits/men/22.jpg"
                    }
                }
            ]
        },
        {
            id: 2,
            text: "Remember to collect ₹500 from @Rahul for the dinner last week. I've attached the bill for reference.",
            createdAt: "2025-03-15T14:30:00",
            author: {
                id: 1,
                name: "You",
                avatar: "https://randomuser.me/api/portraits/men/32.jpg"
            },
            attachments: [
                {
                    id: 102,
                    name: "dinner_bill_march15.jpg",
                    type: "image/jpeg",
                    size: "0.8 MB",
                    url: "/api/placeholder/800/500",
                }
            ],
            tags: ["reminder", "payment", "dinner"],
            mentions: [2],
            reactions: {
                likes: [2],
                seen: [2, 3, 5]
            },
            comments: []
        },
        {
            id: 3,
            text: "I made the first payment for our upcoming cricket match tickets. @Amit @Rahul we need to split this 3 ways.",
            createdAt: "2025-03-12T16:20:00",
            author: {
                id: 3,
                name: "Priya",
                avatar: "https://randomuser.me/api/portraits/women/26.jpg"
            },
            attachments: [
                {
                    id: 103,
                    name: "cricket_tickets_payment.pdf",
                    type: "application/pdf",
                    size: "0.5 MB",
                    url: null,
                }
            ],
            tags: ["cricket", "tickets", "split"],
            mentions: [2, 4],
            reactions: {
                likes: [1, 2, 4],
                seen: [1, 2, 4, 5]
            },
            comments: [
                {
                    id: 202,
                    text: "I'll send you my share via UPI today.",
                    createdAt: "2025-03-12T17:05:00",
                    author: {
                        id: 4,
                        name: "Amit",
                        avatar: "https://randomuser.me/api/portraits/men/43.jpg"
                    }
                }
            ]
        }
    ]);

    const [searchQuery, setSearchQuery] = useState('');
    const [selectedTags, setSelectedTags] = useState([]);
    const [showMentionUsers, setShowMentionUsers] = useState(false);
    const [mentionSearchQuery, setMentionSearchQuery] = useState('');
    const [selectedFilter, setSelectedFilter] = useState('all');
    const [newNote, setNewNote] = useState('');
    const [newNoteAttachments, setNewNoteAttachments] = useState([]);
    const [editingNoteId, setEditingNoteId] = useState(null);
    const [editingNoteText, setEditingNoteText] = useState('');
    const [noteOptionsId, setNoteOptionsId] = useState(null);
    const [showComments, setShowComments] = useState(null);
    const [newComment, setNewComment] = useState('');
    const [viewingAttachment, setViewingAttachment] = useState(null);
    const [replyToComment, setReplyToComment] = useState(null);

    // Refs
    const fileInputRef = useRef(null);
    const noteInputRef = useRef(null);
    const mentionMenuRef = useRef(null);
    const lastCursorPosition = useRef(0);

    // Detect mentions in text input and show mention menu
    useEffect(() => {
        const checkForMentions = () => {
            if (!noteInputRef.current) return;

            const cursorPosition = noteInputRef.current.selectionStart;
            const text = noteInputRef.current.value;
            lastCursorPosition.current = cursorPosition;

            // Look for @ symbol before cursor
            let startOfMention = cursorPosition - 1;
            while (startOfMention >= 0 && text[startOfMention] !== '@' && text[startOfMention] !== ' ') {
                startOfMention--;
            }

            if (startOfMention >= 0 && text[startOfMention] === '@') {
                const query = text.substring(startOfMention + 1, cursorPosition).toLowerCase();
                if (query.length > 0 || startOfMention === cursorPosition - 1) {
                    setMentionSearchQuery(query);
                    setShowMentionUsers(true);
                    return;
                }
            }

            setShowMentionUsers(false);
        };

        // Add event listener for input changes
        const noteInput = noteInputRef.current;
        if (noteInput) {
            noteInput.addEventListener('input', checkForMentions);
            noteInput.addEventListener('click', checkForMentions);
            noteInput.addEventListener('keyup', checkForMentions);
        }

        return () => {
            if (noteInput) {
                noteInput.removeEventListener('input', checkForMentions);
                noteInput.removeEventListener('click', checkForMentions);
                noteInput.removeEventListener('keyup', checkForMentions);
            }
        };
    }, [newNote, editingNoteId]);

    // Close mention menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (mentionMenuRef.current && !mentionMenuRef.current.contains(event.target) &&
                noteInputRef.current && !noteInputRef.current.contains(event.target)) {
                setShowMentionUsers(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    // Process mentions
    const parseTextWithMentions = (text, mentions) => {
        if (!mentions || mentions.length === 0) return text;

        let result = text;
        // For each mentioned user
        groupMembers
            .filter(member => mentions.includes(member.id))
            .forEach(member => {
                // Replace @Username with styled version
                const regex = new RegExp(`@${member.name}`, 'g');
                result = result.replace(regex, `|MENTION:${member.id}:${member.name}|`);
            });

        // Then convert to JSX with styled mentions
        const parts = result.split('|');
        return parts.map((part, index) => {
            if (part.startsWith('MENTION:')) {
                const [_, userId, userName] = part.split(':');
                return (
                    <span key={index} className="wb-mention-tag">
                        <AtSign size={12} className="wb-mention-icon" />
                        {userName}
                    </span>
                );
            }
            return part;
        });
    };

    // Get all unique tags from notes
    const allTags = [...new Set(notes.flatMap(note => note.tags))];

    // Filter notes based on search query, tags, and filter type
    const filteredNotes = notes
        .filter(note => {
            // Text search
            const matchesSearch = searchQuery === '' ||
                note.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
                note.author.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                note.attachments.some(att => att.name.toLowerCase().includes(searchQuery.toLowerCase()));

            // Tag filter
            const matchesTags = selectedTags.length === 0 ||
                selectedTags.every(tag => note.tags.includes(tag));

            // Filter type
            const matchesFilter =
                selectedFilter === 'all' ||
                (selectedFilter === 'mentions' && note.mentions.includes(currentUser.id)) ||
                (selectedFilter === 'my-notes' && note.author.id === currentUser.id) ||
                (selectedFilter === 'has-attachments' && note.attachments.length > 0) ||
                (selectedFilter === 'unread' && !note.reactions.seen.includes(currentUser.id));

            return matchesSearch && matchesTags && matchesFilter;
        })
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)); // Sort by date, newest first

    // Add tag to note
    const handleAddTag = (noteId, tag) => {
        setNotes(notes.map(note => {
            if (note.id === noteId) {
                return {
                    ...note,
                    tags: note.tags.includes(tag) ? note.tags : [...note.tags, tag]
                };
            }
            return note;
        }));
        setNoteOptionsId(null);
    };

    // Remove tag from note
    const handleRemoveTag = (noteId, tagToRemove) => {
        setNotes(notes.map(note => {
            if (note.id === noteId) {
                return {
                    ...note,
                    tags: note.tags.filter(tag => tag !== tagToRemove)
                };
            }
            return note;
        }));
    };

    // Handle file upload for a new note
    const handleFileUpload = (e) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        const newFiles = Array.from(files).map(file => ({
            id: Date.now() + Math.random(),
            name: file.name,
            type: file.type,
            size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
            url: file.type.startsWith('image/')
                ? URL.createObjectURL(file)
                : null,
            file: file // Store the actual file object for upload
        }));

        setNewNoteAttachments([...newNoteAttachments, ...newFiles]);

        // Reset file input
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    // Extract mentions from text
    const extractMentions = (text) => {
        const mentionedUsers = [];

        groupMembers.forEach(member => {
            if (text.includes(`@${member.name}`)) {
                mentionedUsers.push(member.id);
            }
        });

        return mentionedUsers;
    };

    // Add a new note
    const handleAddNote = () => {
        if (newNote.trim() === '' && newNoteAttachments.length === 0) return;

        const mentions = extractMentions(newNote);

        const newNoteObj = {
            id: Date.now(),
            text: newNote,
            createdAt: new Date().toISOString(),
            author: currentUser,
            attachments: newNoteAttachments,
            tags: [],
            mentions: mentions,
            reactions: {
                likes: [],
                seen: [currentUser.id]
            },
            comments: []
        };

        setNotes([newNoteObj, ...notes]);
        setNewNote('');
        setNewNoteAttachments([]);
    };

    // Add comment to note
    const handleAddComment = (noteId) => {
        if (newComment.trim() === '') return;

        const comment = {
            id: Date.now(),
            text: newComment,
            createdAt: new Date().toISOString(),
            author: currentUser,
            replyTo: replyToComment
        };

        setNotes(notes.map(note => {
            if (note.id === noteId) {
                return {
                    ...note,
                    comments: [...note.comments, comment]
                };
            }
            return note;
        }));

        setNewComment('');
        setReplyToComment(null);
    };

    // Delete a note
    const handleDeleteNote = (noteId) => {
        // Show confirmation dialog
        if (window.confirm("Are you sure you want to delete this note?")) {
            setNotes(notes.filter(note => note.id !== noteId));
            setNoteOptionsId(null);
        }
    };

    // Edit a note
    const handleEditNote = (noteId) => {
        const noteToEdit = notes.find(note => note.id === noteId);
        if (noteToEdit) {
            setEditingNoteId(noteId);
            setEditingNoteText(noteToEdit.text);
            setNoteOptionsId(null);
        }
    };

    // Save edited note
    const saveEditedNote = () => {
        if (editingNoteText.trim() === '') return;

        const mentions = extractMentions(editingNoteText);

        setNotes(notes.map(note =>
            note.id === editingNoteId ? {
                ...note,
                text: editingNoteText,
                mentions: mentions
            } : note
        ));

        setEditingNoteId(null);
        setEditingNoteText('');
    };

    // Toggle like reaction
    const handleToggleLike = (noteId) => {
        setNotes(notes.map(note => {
            if (note.id === noteId) {
                const userLiked = note.reactions.likes.includes(currentUser.id);
                return {
                    ...note,
                    reactions: {
                        ...note.reactions,
                        likes: userLiked
                            ? note.reactions.likes.filter(id => id !== currentUser.id)
                            : [...note.reactions.likes, currentUser.id]
                    }
                };
            }
            return note;
        }));
    };

    // Mark note as seen
    const handleMarkAsSeen = (noteId) => {
        setNotes(notes.map(note => {
            if (note.id === noteId && !note.reactions.seen.includes(currentUser.id)) {
                return {
                    ...note,
                    reactions: {
                        ...note.reactions,
                        seen: [...note.reactions.seen, currentUser.id]
                    }
                };
            }
            return note;
        }));
    };

    // Toggle tag filter
    const handleTagToggle = (tag) => {
        if (selectedTags.includes(tag)) {
            setSelectedTags(selectedTags.filter(t => t !== tag));
        } else {
            setSelectedTags([...selectedTags, tag]);
        }
    };

    // Handle inserting mention
    const handleSelectMention = (user) => {
        if (!noteInputRef.current) return;

        const text = editingNoteId !== null ? editingNoteText : newNote;
        const cursorPosition = lastCursorPosition.current;

        // Find the @ symbol
        let startOfMention = cursorPosition - 1;
        while (startOfMention >= 0 && text[startOfMention] !== '@' && text[startOfMention] !== ' ') {
            startOfMention--;
        }

        if (startOfMention >= 0 && text[startOfMention] === '@') {
            const beforeMention = text.substring(0, startOfMention);
            const afterMention = text.substring(cursorPosition);
            const newText = `${beforeMention}@${user.name} ${afterMention}`;

            if (editingNoteId !== null) {
                setEditingNoteText(newText);
            } else {
                setNewNote(newText);
            }

            // Set focus back to input
            setTimeout(() => {
                noteInputRef.current.focus();
                // Set cursor position after the inserted mention
                const newPosition = startOfMention + user.name.length + 2; // +2 for @ and space
                noteInputRef.current.selectionStart = newPosition;
                noteInputRef.current.selectionEnd = newPosition;
                lastCursorPosition.current = newPosition;
            }, 0);
        }

        setShowMentionUsers(false);
    };

    // Format date
    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // Format relative time
    const formatRelativeTime = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffInSeconds = Math.floor((now - date) / 1000);

        if (diffInSeconds < 60) return 'just now';
        if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
        if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
        if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;

        return formatDate(dateString).split(',')[0]; // Just return the date part
    };

    // Filter group members for mention menu
    const filteredMembers = groupMembers.filter(member =>
        member.id !== currentUser.id &&
        (mentionSearchQuery === '' ||
            member.name.toLowerCase().includes(mentionSearchQuery.toLowerCase()))
    );

    return (
        <div className="wb-container">
            {/* Header */}
            <div className="wb-header">
                <div className="wb-header-content">
                    <h2 className="wb-header-title">Group Notes & Attachments</h2>

                    <div className="wb-search-container">
                        <Search className="wb-search-icon" />
                        <input
                            type="text"
                            placeholder="Search notes, attachments, or people..."
                            className="wb-search-input"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                {/* Filter options */}
                <div className="wb-filter-options">
                    <button
                        className={`wb-filter-btn ${selectedFilter === 'all' ? 'active' : ''}`}
                        onClick={() => setSelectedFilter('all')}
                    >
                        All
                    </button>

                    <button
                        className={`wb-filter-btn ${selectedFilter === 'mentions' ? 'active' : ''}`}
                        onClick={() => setSelectedFilter('mentions')}
                    >
                        <AtSign className="wb-filter-icon" />
                        Mentions
                    </button>

                    <button
                        className={`wb-filter-btn ${selectedFilter === 'my-notes' ? 'active' : ''}`}
                        onClick={() => setSelectedFilter('my-notes')}
                    >
                        My Notes
                    </button>

                    <button
                        className={`wb-filter-btn ${selectedFilter === 'has-attachments' ? 'active' : ''}`}
                        onClick={() => setSelectedFilter('has-attachments')}
                    >
                        <Paperclip className="wb-filter-icon" />
                        With Attachments
                    </button>

                    <button
                        className={`wb-filter-btn ${selectedFilter === 'unread' ? 'active' : ''}`}
                        onClick={() => setSelectedFilter('unread')}
                    >
                        <EyeOff className="wb-filter-icon" />
                        Unread
                    </button>
                </div>

                {/* Tags filter */}
                {allTags.length > 0 && (
                    <div className="wb-tags-filter">
                        <span className="wb-tags-label">Tags:</span>
                        {allTags.map(tag => (
                            <button
                                key={tag}
                                className={`wb-tag-btn ${selectedTags.includes(tag) ? 'active' : ''}`}
                                onClick={() => handleTagToggle(tag)}
                            >
                                #{tag}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* New Note Input */}
            <div className="wb-note-input-area">
                <div className="wb-note-input-container">
                    <div className="wb-textarea-wrapper">
                        <textarea
                            ref={noteInputRef}
                            placeholder="Write a note, @mention people..."
                            className="wb-note-textarea"
                            rows={3}
                            value={newNote}
                            onChange={(e) => setNewNote(e.target.value)}
                        />

                        {/* Mention menu */}
                        {showMentionUsers && filteredMembers.length > 0 && (
                            <div
                                ref={mentionMenuRef}
                                className="wb-mention-menu"
                                style={{
                                    bottom: newNoteAttachments.length > 0 ? '80px' : '50px',
                                    left: '20px'
                                }}
                            >
                                <div className="wb-mention-header">
                                    Mention someone
                                </div>
                                <div className="wb-mention-list">
                                    {filteredMembers.map(member => (
                                        <div
                                            key={member.id}
                                            className="wb-mention-item"
                                            onClick={() => handleSelectMention(member)}
                                        >
                                            <img
                                                src={member.avatar}
                                                alt={member.name}
                                                className="wb-mention-avatar"
                                            />
                                            <div className="wb-mention-user-info">
                                                <div className="wb-mention-user-name">{member.name}</div>
                                                <div className="wb-mention-user-email">{member.email}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Attachment previews */}
                    {newNoteAttachments.length > 0 && (
                        <div className="wb-attachment-preview-area">
                            <div className="wb-attachment-label">Attachments:</div>
                            <div className="wb-attachment-preview-list">
                                {newNoteAttachments.map((file, index) => (
                                    <div key={index} className="wb-attachment-preview-item">
                                        <div className="wb-attachment-thumbnail">
                                            {file.type.startsWith('image/') ? (
                                                <img
                                                    src={file.url}
                                                    alt={file.name}
                                                    className="wb-attachment-image"
                                                />
                                            ) : (
                                                <FileText className="wb-attachment-icon" />
                                            )}
                                        </div>
                                        <button
                                            className="wb-remove-attachment-btn"
                                            onClick={() => setNewNoteAttachments(newNoteAttachments.filter((_, i) => i !== index))}
                                        >
                                            <X className="wb-remove-icon" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="wb-note-actions">
                        <div className="wb-action-buttons">
                            <button
                                className="wb-action-btn"
                                onClick={() => fileInputRef.current.click()}
                                title="Add attachment"
                            >
                                <Paperclip className="wb-action-icon" />
                            </button>
                            <input
                                type="file"
                                ref={fileInputRef}
                                className="wb-hidden-input"
                                onChange={handleFileUpload}
                                multiple
                            />

                            <button
                                className="wb-action-btn"
                                onClick={() => {
                                    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
                                        // This is just a placeholder for camera functionality
                                        alert("Camera functionality would open here");
                                    }
                                }}
                                title="Take photo"
                            >
                                <Camera className="wb-action-icon" />
                            </button>

                            <button
                                className="wb-action-btn"
                                onClick={() => {
                                    setShowMentionUsers(true);
                                    noteInputRef.current.focus();
                                    const currentValue = noteInputRef.current.value;
                                    const newValue = currentValue + (currentValue.endsWith(' ') || currentValue === '' ? '@' : ' @');
                                    setNewNote(newValue);
                                    setTimeout(() => {
                                        noteInputRef.current.selectionStart = newValue.length;
                                        noteInputRef.current.selectionEnd = newValue.length;
                                        lastCursorPosition.current = newValue.length;
                                    }, 0);
                                }}
                                title="Mention someone"
                            >
                                <AtSign className="wb-action-icon" />
                            </button>
                        </div>

                        <button
                            className="wb-post-btn"
                            onClick={handleAddNote}
                            disabled={newNote.trim() === '' && newNoteAttachments.length === 0}
                        >
                            Post
                        </button>
                    </div>
                </div>
            </div>

            {/* Notes Feed */}
            <div className="wb-notes-feed">
                {filteredNotes.length === 0 ? (
                    <div className="wb-empty-notes">
                        <FileText className="wb-empty-icon" />
                        <p className="wb-empty-title">No notes found</p>
                        <p className="wb-empty-subtitle">Try changing your search or filters</p>
                    </div>
                ) : (
                    <div className="wb-notes-list">
                        {filteredNotes.map(note => (
                            <div
                                key={note.id}
                                className="wb-note-card"
                                onClick={() => handleMarkAsSeen(note.id)}
                            >
                                <div className="wb-note-content">
                                    {/* Note header */}
                                    <div className="wb-note-header">
                                        <div className="wb-note-author">
                                            <img
                                                src={note.author.avatar}
                                                alt={note.author.name}
                                                className="wb-author-avatar"
                                            />
                                            <div className="wb-author-info">
                                                <div className="wb-author-name">{note.author.name}</div>
                                                <div className="wb-note-time">{formatRelativeTime(note.createdAt)}</div>
                                            </div>
                                        </div>

                                        <div className="wb-note-controls">
                                            {!note.reactions.seen.includes(currentUser.id) && (
                                                <div className="wb-unread-indicator" title="Unread"></div>
                                            )}

                                            <div className="wb-note-menu-wrapper">
                                                <button
                                                    className="wb-note-menu-btn"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setNoteOptionsId(noteOptionsId === note.id ? null : note.id);
                                                    }}
                                                >
                                                    <ChevronDown className="wb-note-menu-icon" />
                                                </button>

                                                {noteOptionsId === note.id && (
                                                    <div className="wb-note-menu">
                                                        <div className="wb-note-menu-content">
                                                            {note.author.id === currentUser.id && (
                                                                <button
                                                                    className="wb-note-menu-item"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        handleEditNote(note.id);
                                                                    }}
                                                                >
                                                                    <Edit className="wb-menu-item-icon" />
                                                                    Edit Note
                                                                </button>
                                                            )}

                                                            <button
                                                                className="wb-note-menu-item"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    navigator.clipboard.writeText(note.text);
                                                                    setNoteOptionsId(null);
                                                                }}
                                                            >
                                                                <Copy className="wb-menu-item-icon" />
                                                                Copy Text
                                                            </button>

                                                            <div className="wb-menu-divider"></div>
                                                            <div className="wb-menu-section-title">Add tag:</div>
                                                            <div className="wb-tag-options">
                                                                {['receipt', 'payment', 'reminder', 'trip', 'dinner', 'important']
                                                                    .filter(tag => !note.tags.includes(tag))
                                                                    .slice(0, 6)
                                                                    .map(tag => (
                                                                        <button
                                                                            key={tag}
                                                                            className="wb-tag-option"
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                handleAddTag(note.id, tag);
                                                                            }}
                                                                        >
                                                                            #{tag}
                                                                        </button>
                                                                    ))}
                                                            </div>

                                                            {note.author.id === currentUser.id && (
                                                                <>
                                                                    <div className="wb-menu-divider"></div>
                                                                    <button
                                                                        className="wb-note-menu-item wb-delete-item"
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            handleDeleteNote(note.id);
                                                                        }}
                                                                    >
                                                                        <Trash2 className="wb-menu-item-icon" />
                                                                        Delete Note
                                                                    </button>
                                                                </>
                                                            )}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Note text */}
                                    <div className="wb-note-text-content">
                                        {editingNoteId === note.id ? (
                                            <div className="wb-edit-note-form">
                                                <textarea
                                                    ref={noteInputRef}
                                                    className="wb-edit-textarea"
                                                    rows={3}
                                                    value={editingNoteText}
                                                    onChange={(e) => setEditingNoteText(e.target.value)}
                                                    autoFocus
                                                />

                                                {/* Mention menu in edit mode */}
                                                {showMentionUsers && filteredMembers.length > 0 && (
                                                    <div
                                                        ref={mentionMenuRef}
                                                        className="wb-mention-menu wb-edit-mention-menu"
                                                    >
                                                        <div className="wb-mention-header">
                                                            Mention someone
                                                        </div>
                                                        <div className="wb-mention-list">
                                                            {filteredMembers.map(member => (
                                                                <div
                                                                    key={member.id}
                                                                    className="wb-mention-item"
                                                                    onClick={() => handleSelectMention(member)}
                                                                >
                                                                    <img
                                                                        src={member.avatar}
                                                                        alt={member.name}
                                                                        className="wb-mention-avatar"
                                                                    />
                                                                    <div className="wb-mention-user-info">
                                                                        <div className="wb-mention-user-name">{member.name}</div>
                                                                        <div className="wb-mention-user-email">{member.email}</div>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}

                                                <div className="wb-edit-actions">
                                                    <button
                                                        className="wb-cancel-btn"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setEditingNoteId(null);
                                                        }}
                                                    >
                                                        Cancel
                                                    </button>
                                                    <button
                                                        className="wb-save-btn"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            saveEditedNote();
                                                        }}
                                                    >
                                                        <Check className="wb-save-icon" />
                                                        Save
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <p className="wb-note-text">
                                                {parseTextWithMentions(note.text, note.mentions)}
                                            </p>
                                        )}
                                    </div>

                                    {/* Note attachments */}
                                    {note.attachments.length > 0 && (
                                        <div className="wb-note-attachments">
                                            {note.attachments.map((attachment, index) => (
                                                <div
                                                    key={attachment.id}
                                                    className="wb-note-attachment"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setViewingAttachment(attachment);
                                                    }}
                                                >
                                                    {attachment.type.startsWith('image/') ? (
                                                        <div className="wb-attachment-image-container">
                                                            <img
                                                                src={attachment.url}
                                                                alt={attachment.name}
                                                                className="wb-note-attachment-image"
                                                            />
                                                        </div>
                                                    ) : (
                                                        <div className="wb-attachment-file-container">
                                                            <div className="wb-file-content">
                                                                <FileText className="wb-file-icon" />
                                                                <div className="wb-file-info">
                                                                    <p className="wb-file-name">{attachment.name}</p>
                                                                    <p className="wb-file-size">{attachment.size}</p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* Tags */}
                                    {note.tags.length > 0 && (
                                        <div className="wb-note-tags">
                                            {note.tags.map(tag => (
                                                <div key={tag} className="wb-note-tag">
                                                    <span className="wb-tag-text">#{tag}</span>
                                                    {note.author.id === currentUser.id && (
                                                        <button
                                                            className="wb-remove-tag-btn"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleRemoveTag(note.id, tag);
                                                            }}
                                                        >
                                                            <X className="wb-remove-tag-icon" />
                                                        </button>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* Note actions */}
                                    <div className="wb-note-footer">
                                        <div className="wb-note-reactions">
                                            <button
                                                className={`wb-reaction-btn ${note.reactions.likes.includes(currentUser.id) ? 'liked' : ''}`}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleToggleLike(note.id);
                                                }}
                                            >
                                                <Heart className="wb-reaction-icon" fill={note.reactions.likes.includes(currentUser.id) ? "currentColor" : "none"} />
                                                <span className="wb-reaction-count">{note.reactions.likes.length > 0 && note.reactions.likes.length}</span>
                                            </button>

                                            <button
                                                className="wb-reaction-btn"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setShowComments(showComments === note.id ? null : note.id);
                                                }}
                                            >
                                                <MessageCircle className="wb-reaction-icon" />
                                                <span className="wb-reaction-count">{note.comments.length > 0 && note.comments.length}</span>
                                            </button>

                                            <button
                                                className="wb-reaction-btn"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    navigator.clipboard.writeText(window.location.href + '#note-' + note.id);
                                                    alert('Link copied to clipboard!');
                                                }}
                                            >
                                                <Share2 className="wb-reaction-icon" />
                                            </button>
                                        </div>

                                        <div className="wb-seen-by">
                                            <div className="wb-seen-avatars">
                                                {note.reactions.seen.slice(0, 3).map(userId => {
                                                    const user = groupMembers.find(m => m.id === userId);
                                                    return user ? (
                                                        <img
                                                            key={userId}
                                                            src={user.avatar}
                                                            alt={user.name}
                                                            className="wb-seen-avatar"
                                                            title={user.name}
                                                        />
                                                    ) : null;
                                                })}
                                            </div>
                                            {note.reactions.seen.length > 3 && (
                                                <span className="wb-seen-count">+{note.reactions.seen.length - 3} seen</span>
                                            )}
                                            {note.reactions.seen.length <= 3 && note.reactions.seen.length > 0 && (
                                                <span className="wb-seen-text">seen</span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Comments section */}
                                {showComments === note.id && (
                                    <div className="wb-comments-section">
                                        {note.comments.length > 0 ? (
                                            <div className="wb-comments-list">
                                                {note.comments.map(comment => (
                                                    <div key={comment.id} className="wb-comment">
                                                        <img
                                                            src={comment.author.avatar}
                                                            alt={comment.author.name}
                                                            className="wb-comment-avatar"
                                                        />
                                                        <div className="wb-comment-content">
                                                            <div className="wb-comment-bubble">
                                                                {comment.replyTo && (
                                                                    <div className="wb-reply-indicator">
                                                                        Replying to comment
                                                                    </div>
                                                                )}
                                                                <div className="wb-comment-header">
                                                                    <span className="wb-comment-author">{comment.author.name}</span>
                                                                    <span className="wb-comment-time">{formatRelativeTime(comment.createdAt)}</span>
                                                                </div>
                                                                <p className="wb-comment-text">{comment.text}</p>
                                                            </div>

                                                            <button
                                                                className="wb-reply-btn"
                                                                onClick={() => setReplyToComment(comment.id)}
                                                            >
                                                                Reply
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="wb-no-comments">
                                                No comments yet
                                            </div>
                                        )}

                                        {/* Add comment form */}
                                        <div className="wb-add-comment">
                                            <img
                                                src={currentUser.avatar}
                                                alt={currentUser.name}
                                                className="wb-comment-avatar"
                                            />
                                            <div className="wb-comment-form">
                                                {replyToComment && (
                                                    <div className="wb-reply-bar">
                                                        <span>Replying to comment</span>
                                                        <button className="wb-cancel-reply" onClick={() => setReplyToComment(null)}>
                                                            <X className="wb-cancel-icon" />
                                                        </button>
                                                    </div>
                                                )}
                                                <div className="wb-comment-input-wrapper">
                                                    <input
                                                        type="text"
                                                        placeholder="Write a comment..."
                                                        className="wb-comment-input"
                                                        value={newComment}
                                                        onChange={(e) => setNewComment(e.target.value)}
                                                        onKeyPress={(e) => {
                                                            if (e.key === 'Enter' && newComment.trim() !== '') {
                                                                handleAddComment(note.id);
                                                            }
                                                        }}
                                                    />
                                                    <button
                                                        className="wb-submit-comment"
                                                        onClick={() => handleAddComment(note.id)}
                                                        disabled={newComment.trim() === ''}
                                                    >
                                                        <Check className="wb-submit-icon" />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Attachment Viewer Modal */}
            {viewingAttachment && (
                <div className="wb-modal-overlay" onClick={() => setViewingAttachment(null)}>
                    <div className="wb-modal-container" onClick={e => e.stopPropagation()}>
                        <div className="wb-modal-header">
                            <h3 className="wb-modal-title">{viewingAttachment.name}</h3>
                            <button
                                className="wb-modal-close"
                                onClick={() => setViewingAttachment(null)}
                            >
                                <X className="wb-close-icon" />
                            </button>
                        </div>

                        <div className="wb-modal-content">
                            {viewingAttachment.type.startsWith('image/') ? (
                                <img
                                    src={viewingAttachment.url}
                                    alt={viewingAttachment.name}
                                    className="wb-modal-image"
                                />
                            ) : (
                                <div className="wb-file-preview">
                                    <FileText className="wb-preview-file-icon" />
                                    <p className="wb-preview-message">This file type cannot be previewed</p>
                                </div>
                            )}
                        </div>

                        <div className="wb-modal-footer">
                            <div className="wb-file-size">
                                {viewingAttachment.size}
                            </div>

                            <div className="wb-modal-actions">
                                <button className="wb-download-btn">
                                    <Download className="wb-download-icon" />
                                    Download
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Whiteboard;