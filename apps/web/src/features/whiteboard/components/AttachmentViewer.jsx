import { Download, FileText, X } from 'lucide-react';

/**
 * 7.4 -- extracted from Whiteboard verbatim (behaviour-preserving).
 */
const AttachmentViewer = ({
    setViewingAttachment,
    viewingAttachment,
}) => (
    <div className="wb-modal-overlay" onClick={() => setViewingAttachment(null)}>
        <div className="wb-modal-container" onClick={e => e.stopPropagation()}>
            <div className="wb-modal-header">
                <h3 className="wb-modal-title">{viewingAttachment.name}</h3>
                <button
                    className="wb-modal-close"
                    onClick={() => setViewingAttachment(null)}
                >
                    <X className="wb-close-icon" />
                </button>
            </div>
    
            <div className="wb-modal-content">
                {viewingAttachment.type.startsWith('image/') ? (
                    <img
                        src={viewingAttachment.url}
                        alt={viewingAttachment.name}
                        className="wb-modal-image"
                    />
                ) : (
                    <div className="wb-file-preview">
                        <FileText className="wb-preview-file-icon" />
                        <p className="wb-preview-message">This file type cannot be previewed</p>
                    </div>
                )}
            </div>
    
            <div className="wb-modal-footer">
                <div className="wb-file-size">
                    {viewingAttachment.size}
                </div>
    
                <div className="wb-modal-actions">
                    <button className="wb-download-btn">
                        <Download className="wb-download-icon" />
                        Download
                    </button>
                </div>
            </div>
        </div>
    </div>
);

export default AttachmentViewer;
