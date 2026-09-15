import { Check, X } from 'lucide-react';

/**
 * 7.4 -- split out of WhiteboardNote verbatim (behaviour-preserving).
 */
const NoteComments = ({
    note,
    currentUser,
    formatRelativeTime,
    handleAddComment,
    newComment,
    replyToComment,
    setNewComment,
    setReplyToComment,
}) => (
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
);

export default NoteComments;
