import WhiteboardNote from './WhiteboardNote';
import { FileText } from 'lucide-react';

/**
 * 7.4 -- extracted from Whiteboard verbatim (behaviour-preserving).
 */
const NotesFeed = ({
    currentUser,
    editingNoteId,
    editingNoteText,
    filteredMembers,
    filteredNotes,
    formatRelativeTime,
    groupMembers,
    handleAddComment,
    handleAddTag,
    handleDeleteNote,
    handleEditNote,
    handleMarkAsSeen,
    handleRemoveTag,
    handleSelectMention,
    handleToggleLike,
    mentionMenuRef,
    newComment,
    noteInputRef,
    noteOptionsId,
    notes,
    parseTextWithMentions,
    replyToComment,
    saveEditedNote,
    setEditingNoteId,
    setEditingNoteText,
    setNewComment,
    setNoteOptionsId,
    setReplyToComment,
    setShowComments,
    setViewingAttachment,
    showComments,
    showMentionUsers,
}) => (
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
                    <WhiteboardNote
                        key={note.id}
                        note={note}
                        currentUser={currentUser}
                        editingNoteId={editingNoteId}
                        editingNoteText={editingNoteText}
                        filteredMembers={filteredMembers}
                        formatRelativeTime={formatRelativeTime}
                        groupMembers={groupMembers}
                        handleAddComment={handleAddComment}
                        handleAddTag={handleAddTag}
                        handleDeleteNote={handleDeleteNote}
                        handleEditNote={handleEditNote}
                        handleMarkAsSeen={handleMarkAsSeen}
                        handleRemoveTag={handleRemoveTag}
                        handleSelectMention={handleSelectMention}
                        handleToggleLike={handleToggleLike}
                        mentionMenuRef={mentionMenuRef}
                        newComment={newComment}
                        noteInputRef={noteInputRef}
                        noteOptionsId={noteOptionsId}
                        parseTextWithMentions={parseTextWithMentions}
                        replyToComment={replyToComment}
                        saveEditedNote={saveEditedNote}
                        setEditingNoteId={setEditingNoteId}
                        setEditingNoteText={setEditingNoteText}
                        setNewComment={setNewComment}
                        setNoteOptionsId={setNoteOptionsId}
                        setReplyToComment={setReplyToComment}
                        setShowComments={setShowComments}
                        setViewingAttachment={setViewingAttachment}
                        showComments={showComments}
                        showMentionUsers={showMentionUsers}
                    />
                ))}
            </div>
        )}
    </div>
);

export default NotesFeed;
