/**
 * 7.4 -- the whiteboard's note mutations: tags, attachments, add/edit/delete,
 * comments, likes and seen-state. Lifted out of useWhiteboard verbatim.
 *
 * Takes the state it mutates as arguments rather than owning it, so the note
 * list stays in one place while the handlers live here.
 */
export const useNoteActions = ({
    notes,
    setNotes,
    currentUser,
    newNote,
    setNewNote,
    newNoteAttachments,
    setNewNoteAttachments,
    extractMentions,
    editingNoteId,
    setEditingNoteId,
    editingNoteText,
    setEditingNoteText,
    newComment,
    setNewComment,
    replyToComment,
    setReplyToComment,
    setNoteOptionsId,
    fileInputRef,
}) => {
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

    return {
        handleAddTag,
        handleRemoveTag,
        handleFileUpload,
        handleAddNote,
        handleAddComment,
        handleDeleteNote,
        handleEditNote,
        saveEditedNote,
        handleToggleLike,
        handleMarkAsSeen,
    };
};
