import { AtSign, EyeOff, Paperclip, Search } from 'lucide-react';

/**
 * 7.4 -- extracted from Whiteboard verbatim (behaviour-preserving).
 */
const WhiteboardHeader = ({
    allTags,
    handleTagToggle,
    notes,
    searchQuery,
    selectedFilter,
    selectedTags,
    setSearchQuery,
    setSelectedFilter,
}) => (
    <div className="wb-header">
        <div className="wb-header-content">
            <h2 className="wb-header-title">Group Notes & Attachments</h2>
    
            <div className="wb-search-container">
                <Search className="wb-search-icon" />
                <input
                    type="text"
                    placeholder="Search notes, attachments, or people..."
                    className="wb-search-input"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>
        </div>
    
        {/* Filter options */}
        <div className="wb-filter-options">
            <button
                className={`wb-filter-btn ${selectedFilter === 'all' ? 'active' : ''}`}
                onClick={() => setSelectedFilter('all')}
            >
                All
            </button>
    
            <button
                className={`wb-filter-btn ${selectedFilter === 'mentions' ? 'active' : ''}`}
                onClick={() => setSelectedFilter('mentions')}
            >
                <AtSign className="wb-filter-icon" />
                Mentions
            </button>
    
            <button
                className={`wb-filter-btn ${selectedFilter === 'my-notes' ? 'active' : ''}`}
                onClick={() => setSelectedFilter('my-notes')}
            >
                My Notes
            </button>
    
            <button
                className={`wb-filter-btn ${selectedFilter === 'has-attachments' ? 'active' : ''}`}
                onClick={() => setSelectedFilter('has-attachments')}
            >
                <Paperclip className="wb-filter-icon" />
                With Attachments
            </button>
    
            <button
                className={`wb-filter-btn ${selectedFilter === 'unread' ? 'active' : ''}`}
                onClick={() => setSelectedFilter('unread')}
            >
                <EyeOff className="wb-filter-icon" />
                Unread
            </button>
        </div>
    
        {/* Tags filter */}
        {allTags.length > 0 && (
            <div className="wb-tags-filter">
                <span className="wb-tags-label">Tags:</span>
                {allTags.map(tag => (
                    <button
                        key={tag}
                        className={`wb-tag-btn ${selectedTags.includes(tag) ? 'active' : ''}`}
                        onClick={() => handleTagToggle(tag)}
                    >
                        #{tag}
                    </button>
                ))}
            </div>
        )}
    </div>
);

export default WhiteboardHeader;
