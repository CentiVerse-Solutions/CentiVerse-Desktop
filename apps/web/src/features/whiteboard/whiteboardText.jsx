import { AtSign } from 'lucide-react';

/**
 * Pure text and date helpers for the whiteboard: @mention parsing and
 * extraction, plus relative date formatting.
 *
 * These were closures inside useWhiteboard but never touched its state, so
 * they belong outside it. Behaviour-preserving: the bodies are unchanged.
 */
export const parseTextWithMentions = (text, mentions, groupMembers = []) => {
    if (!mentions || mentions.length === 0) return text;

    let result = text;
    // For each mentioned user
    groupMembers
        .filter(member => mentions.includes(member.id))
        .forEach(member => {
            // Replace @Username with styled version
            const regex = new RegExp(`@${member.name}`, 'g');
            result = result.replace(regex, `|MENTION:${member.id}:${member.name}|`);
        });

    // Then convert to JSX with styled mentions
    const parts = result.split('|');
    return parts.map((part, index) => {
        if (part.startsWith('MENTION:')) {
            const [_, userId, userName] = part.split(':');
            return (
                <span key={index} className="wb-mention-tag">
                    <AtSign size={12} className="wb-mention-icon" />
                    {userName}
                </span>
            );
        }
        return part;
    });
};

export const extractMentions = (text, groupMembers = []) => {
    const mentionedUsers = [];

    groupMembers.forEach(member => {
        if (text.includes(`@${member.name}`)) {
            mentionedUsers.push(member.id);
        }
    });

    return mentionedUsers;
};

export const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
};

export const formatRelativeTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 60) return 'just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;

    return formatDate(dateString).split(',')[0]; // Just return the date part
};
