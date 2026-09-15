import { Check, FileText, X } from 'lucide-react';

/**
 * 7.4 -- split out of WhiteboardNote verbatim (behaviour-preserving).
 */
const NoteBody = ({
    note,
    currentUser,
    editingNoteId,
    editingNoteText,
    filteredMembers,
    handleRemoveTag,
    handleSelectMention,
    mentionMenuRef,
    noteInputRef,
    parseTextWithMentions,
    saveEditedNote,
    setEditingNoteId,
    setEditingNoteText,
    setViewingAttachment,
    showMentionUsers,
}) => (
    <>
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
    </>
);

export default NoteBody;
