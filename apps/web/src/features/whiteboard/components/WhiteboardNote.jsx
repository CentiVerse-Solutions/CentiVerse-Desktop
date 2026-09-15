import { Check, ChevronDown, Copy, Edit, FileText, Heart, MessageCircle, Share2, Trash2, X } from 'lucide-react';

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
);

export default WhiteboardNote;
