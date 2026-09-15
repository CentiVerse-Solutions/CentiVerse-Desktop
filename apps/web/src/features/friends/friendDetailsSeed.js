/**
 * Component-local fixture for the friend detail panel.
 *
 * Still a fixture: the Phase 3 seam has no per-friend expense endpoint yet, and
 * its `paidBy: 'you' | 'friend'` flag is viewer-relative in the way 5.4 warns
 * about. Lifted out of the component so the panel itself is presentation only;
 * it goes away when the port grows a friends detail query.
 */
export const FRIEND_EXPENSES = [
    {
        id: 'exp1',
        description: 'Dinner at Olive Garden',
        amount: 65.50,
        paidBy: 'you',
        date: '2023-03-15T19:30:00',
        participants: ['you', 'friend'],
        split: {
            you: 32.75,
            friend: 32.75
        }
    },
    {
        id: 'exp2',
        description: 'Movie tickets',
        amount: 24.00,
        paidBy: 'friend',
        date: '2023-02-28T20:00:00',
        participants: ['you', 'friend'],
        split: {
            you: 12.00,
            friend: 12.00
        }
    },
    {
        id: 'exp3',
        description: 'Uber ride',
        amount: 18.75,
        paidBy: 'you',
        date: '2023-02-14T22:15:00',
        participants: ['you', 'friend'],
        split: {
            you: 9.38,
            friend: 9.38
        }
    }
];
