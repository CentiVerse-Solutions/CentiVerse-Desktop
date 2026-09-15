import { useWhiteboard } from '../../../features/whiteboard/useWhiteboard';
import './Whiteboard.css';
import WhiteboardHeader from '../../../features/whiteboard/components/WhiteboardHeader';
import NoteComposer from '../../../features/whiteboard/components/NoteComposer';
import NotesFeed from '../../../features/whiteboard/components/NotesFeed';
import AttachmentViewer from '../../../features/whiteboard/components/AttachmentViewer';

const Whiteboard = ({ groupId }) => {
    const {
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
    } = useWhiteboard(groupId);

    return (
        <div className="wb-container">
            {/* Header */}
            <WhiteboardHeader
                allTags={allTags}
                handleTagToggle={handleTagToggle}
                notes={notes}
                searchQuery={searchQuery}
                selectedFilter={selectedFilter}
                selectedTags={selectedTags}
                setSearchQuery={setSearchQuery}
                setSelectedFilter={setSelectedFilter}
            />

            {/* New Note Input */}
            <NoteComposer
                fileInputRef={fileInputRef}
                filteredMembers={filteredMembers}
                handleAddNote={handleAddNote}
                handleFileUpload={handleFileUpload}
                handleSelectMention={handleSelectMention}
                lastCursorPosition={lastCursorPosition}
                mentionMenuRef={mentionMenuRef}
                newNote={newNote}
                newNoteAttachments={newNoteAttachments}
                noteInputRef={noteInputRef}
                setNewNote={setNewNote}
                setNewNoteAttachments={setNewNoteAttachments}
                setShowMentionUsers={setShowMentionUsers}
                showMentionUsers={showMentionUsers}
            />

            {/* Notes Feed */}
            <NotesFeed
                currentUser={currentUser}
                editingNoteId={editingNoteId}
                editingNoteText={editingNoteText}
                filteredMembers={filteredMembers}
                filteredNotes={filteredNotes}
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
                notes={notes}
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

            {/* Attachment Viewer Modal */}
            {viewingAttachment && (
                <AttachmentViewer
                    setViewingAttachment={setViewingAttachment}
                    viewingAttachment={viewingAttachment}
                />
            )}
        </div>
    );
};

export default Whiteboard;