/**
 * Seed data for the whiteboard: the viewer, the taggable members and the
 * starting notes.
 *
 * This is ~145 lines of static fixture that was sitting inside the component.
 * Phase 3's seam has no whiteboard endpoints yet (6.2 defines the tables,
 * 8.2 puts them behind the port), so it stays a local fixture until then --
 * but it does not belong in a hook body.
 */
// Mock current user
export const CURRENT_USER = {
    id: 1,
    name: "You",
    email: "you@example.com",
    avatar: "https://randomuser.me/api/portraits/men/32.jpg"
};

// Mock group members for tagging
export const GROUP_MEMBERS = [
    {
        id: 1,
        name: "You",
        email: "you@example.com",
        avatar: "https://randomuser.me/api/portraits/men/32.jpg"
    },
    {
        id: 2,
        name: "Rahul",
        email: "rahul@example.com",
        avatar: "https://randomuser.me/api/portraits/men/22.jpg"
    },
    {
        id: 3,
        name: "Priya",
        email: "priya@example.com",
        avatar: "https://randomuser.me/api/portraits/women/26.jpg"
    },
    {
        id: 4,
        name: "Amit",
        email: "amit@example.com",
        avatar: "https://randomuser.me/api/portraits/men/43.jpg"
    },
    {
        id: 5,
        name: "Neha",
        email: "neha@example.com",
        avatar: "https://randomuser.me/api/portraits/women/33.jpg"
    }
];

// Sample notes with attachments, user info, and mentions
export const SEED_NOTES = [
    {
        id: 1,
        text: "Everyone, I've uploaded the hotel booking receipt for our Thailand trip. @Rahul @Priya please check if the booking details are correct.",
        createdAt: "2025-01-06T10:30:00",
        author: {
            id: 1,
            name: "You",
            avatar: "https://randomuser.me/api/portraits/men/32.jpg"
        },
        attachments: [
            {
                id: 101,
                name: "thailand_hotel_receipt.jpg",
                type: "image/jpeg",
                size: "1.2 MB",
                url: "/api/placeholder/800/500",
            }
        ],
        tags: ["receipt", "trip"],
        mentions: [2, 3], // IDs of mentioned users
        reactions: {
            likes: [2, 3, 4], // User IDs who liked
            seen: [2, 3, 4, 5] // User IDs who've seen
        },
        comments: [
            {
                id: 201,
                text: "Looks good! The check-in time is perfect.",
                createdAt: "2025-01-06T11:42:00",
                author: {
                    id: 2,
                    name: "Rahul",
                    avatar: "https://randomuser.me/api/portraits/men/22.jpg"
                }
            }
        ]
    },
    {
        id: 2,
        text: "Remember to collect ₹500 from @Rahul for the dinner last week. I've attached the bill for reference.",
        createdAt: "2025-03-15T14:30:00",
        author: {
            id: 1,
            name: "You",
            avatar: "https://randomuser.me/api/portraits/men/32.jpg"
        },
        attachments: [
            {
                id: 102,
                name: "dinner_bill_march15.jpg",
                type: "image/jpeg",
                size: "0.8 MB",
                url: "/api/placeholder/800/500",
            }
        ],
        tags: ["reminder", "payment", "dinner"],
        mentions: [2],
        reactions: {
            likes: [2],
            seen: [2, 3, 5]
        },
        comments: []
    },
    {
        id: 3,
        text: "I made the first payment for our upcoming cricket match tickets. @Amit @Rahul we need to split this 3 ways.",
        createdAt: "2025-03-12T16:20:00",
        author: {
            id: 3,
            name: "Priya",
            avatar: "https://randomuser.me/api/portraits/women/26.jpg"
        },
        attachments: [
            {
                id: 103,
                name: "cricket_tickets_payment.pdf",
                type: "application/pdf",
                size: "0.5 MB",
                url: null,
            }
        ],
        tags: ["cricket", "tickets", "split"],
        mentions: [2, 4],
        reactions: {
            likes: [1, 2, 4],
            seen: [1, 2, 4, 5]
        },
        comments: [
            {
                id: 202,
                text: "I'll send you my share via UPI today.",
                createdAt: "2025-03-12T17:05:00",
                author: {
                    id: 4,
                    name: "Amit",
                    avatar: "https://randomuser.me/api/portraits/men/43.jpg"
                }
            }
        ]
    }
]
