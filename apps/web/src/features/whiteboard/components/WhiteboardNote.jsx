import NoteBody from './NoteBody';
import NoteComments from './NoteComments';
import { ChevronDown, Copy, Edit, Heart, MessageCircle, Share2, Trash2 } from 'lucide-react';

/**
 * 7.4 -- a single whiteboard note, lifted out of NotesFeed verbatim so both
 * stay under the 300-line limit. Behaviour-preserving.
 */
const WhiteboardNote = ({
    note,
    currentUser,
    editingNoteId,
    editingNoteText,
    filteredMembers,
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
        
            <NoteBody
                note={note}
                currentUser={currentUser}
                editingNoteId={editingNoteId}
                editingNoteText={editingNoteText}
                filteredMembers={filteredMembers}
                handleRemoveTag={handleRemoveTag}
                handleSelectMention={handleSelectMention}
                mentionMenuRef={mentionMenuRef}
                noteInputRef={noteInputRef}
                parseTextWithMentions={parseTextWithMentions}
                saveEditedNote={saveEditedNote}
                setEditingNoteId={setEditingNoteId}
                setEditingNoteText={setEditingNoteText}
                setViewingAttachment={setViewingAttachment}
                showMentionUsers={showMentionUsers}
            />
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
            <NoteComments
                note={note}
                currentUser={currentUser}
                formatRelativeTime={formatRelativeTime}
                handleAddComment={handleAddComment}
                newComment={newComment}
                replyToComment={replyToComment}
                setNewComment={setNewComment}
                setReplyToComment={setReplyToComment}
            />
        )}
    </div>
);

export default WhiteboardNote;
