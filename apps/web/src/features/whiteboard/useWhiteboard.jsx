import React, { useState, useRef, useEffect } from 'react';
import { CURRENT_USER, GROUP_MEMBERS, SEED_NOTES } from './whiteboardSeed';
import {
    parseTextWithMentions as parseMentions,
    extractMentions as findMentions,
    formatDate,
    formatRelativeTime,
} from './whiteboardText';
import { useNoteActions } from './useNoteActions';

/**
 * 7.4 -- Whiteboard's state, seed data and handlers, lifted verbatim so the
 * component is left composing sections. Behaviour-preserving.
 *
 * The seeded notes and member list still live here; the Phase 3 seam replaces
 * them with whiteboard endpoints when those land (6.2 / 8.2).
 */
export const useWhiteboard = (groupId) => {
    const currentUser = CURRENT_USER;
    const groupMembers = GROUP_MEMBERS;

    const [notes, setNotes] = useState(SEED_NOTES);

    // Bound to this group's members so callers keep the (text, mentions) shape.
    const parseTextWithMentions = (text, mentions) =>
        parseMentions(text, mentions, groupMembers);
    const extractMentions = (text) => findMentions(text, groupMembers);

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
    // 7.4: note mutations live in their own hook.
    const {
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
    } = useNoteActions({
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
    });

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

    // Format relative time

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
