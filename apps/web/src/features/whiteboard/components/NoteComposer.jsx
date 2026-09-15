import { AtSign, Camera, FileText, Paperclip, X } from 'lucide-react';

/**
 * 7.4 -- extracted from Whiteboard verbatim (behaviour-preserving).
 */
const NoteComposer = ({
    fileInputRef,
    filteredMembers,
    handleAddNote,
    handleFileUpload,
    handleSelectMention,
    lastCursorPosition,
    mentionMenuRef,
    newNote,
    newNoteAttachments,
    noteInputRef,
    setNewNote,
    setNewNoteAttachments,
    setShowMentionUsers,
    showMentionUsers,
}) => (
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
);

export default NoteComposer;
