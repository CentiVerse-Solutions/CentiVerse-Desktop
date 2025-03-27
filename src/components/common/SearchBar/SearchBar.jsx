import React, { useState, useEffect, useRef } from 'react';
import './SearchBar.css';

export const SearchBar = ({
    placeholder = 'Search...',
    value = '',
    onSearch,
    className = '',
    animated = true
}) => {
    const [searchTerm, setSearchTerm] = useState(value);
    const [isFocused, setIsFocused] = useState(false);
    const inputRef = useRef(null);

    // Sync the internal state with external value prop
    useEffect(() => {
        setSearchTerm(value);
    }, [value]);

    const handleChange = (e) => {
        const newValue = e.target.value;
        setSearchTerm(newValue);
        onSearch(newValue);
    };

    const handleClear = () => {
        setSearchTerm('');
        onSearch('');
        if (inputRef.current) {
            inputRef.current.focus();
        }
    };

    const handleFocus = () => {
        setIsFocused(true);
    };

    const handleBlur = () => {
        setIsFocused(false);
    };

    return (
        <div className={`search-bar ${isFocused ? 'focused' : ''} ${animated ? 'animated' : ''} ${className}`}>
            <div className="search-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path
                        d="M11 19C15.4183 19 19 15.4183 19 11C19 6.58172 15.4183 3 11 3C6.58172 3 3 6.58172 3 11C3 15.4183 6.58172 19 11 19Z"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                    <path
                        d="M21 21L16.65 16.65"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                </svg>
            </div>

            <input
                type="text"
                ref={inputRef}
                placeholder={placeholder}
                value={searchTerm}
                onChange={handleChange}
                onFocus={handleFocus}
                onBlur={handleBlur}
                className="search-input"
            />

            {searchTerm && (
                <button className="clear-button" onClick={handleClear} type="button">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path
                            d="M18 6L6 18"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                        <path
                            d="M6 6L18 18"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                    </svg>
                </button>
            )}
        </div>
    );
};

export default SearchBar;