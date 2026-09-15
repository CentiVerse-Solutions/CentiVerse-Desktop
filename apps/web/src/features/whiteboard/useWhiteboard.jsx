import { AtSign } from 'lucide-react';
import React, { useState, useRef, useEffect } from 'react';

/**
 * 7.4 -- Whiteboard's state, seed data and handlers, lifted verbatim so the
 * component is left composing sections. Behaviour-preserving.
 *
 * The seeded notes and member list still live here; the Phase 3 seam replaces
 * them with whiteboard endpoints when those land (6.2 / 8.2).
 */
export const useWhiteboard = (groupId) => {
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


    return {
        allTags,
        currentUser,
        editingNoteId,
        editingNoteText,
        fileInputRef,
        filteredMembers,
        filteredNotes,
        formatRelativeTime,
        groupMembers,
        handleAddComment,
        handleAddNote,
        handleAddTag,
        handleDeleteNote,
        handleEditNote,
        handleFileUpload,
        handleMarkAsSeen,
        handleRemoveTag,
        handleSelectMention,
        handleTagToggle,
        handleToggleLike,
        lastCursorPosition,
        mentionMenuRef,
        newComment,
        newNote,
        newNoteAttachments,
        noteInputRef,
        noteOptionsId,
        notes,
        parseTextWithMentions,
        replyToComment,
        saveEditedNote,
        searchQuery,
        selectedFilter,
        selectedTags,
        setEditingNoteId,
        setEditingNoteText,
        setNewComment,
        setNewNote,
        setNewNoteAttachments,
        setNoteOptionsId,
        setReplyToComment,
        setSearchQuery,
        setSelectedFilter,
        setShowComments,
        setShowMentionUsers,
        setViewingAttachment,
        showComments,
        showMentionUsers,
        viewingAttachment,
    };
};
