// src/utils/mockData.js
// This file contains mock data for testing the Group Details page

export const mockGroups = [
  {
    id: 1,
    name: "Goa Trip 2023",
    avatar:
      "https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&q=80",
    banner:
      "https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80",
    createdAt: "2023-06-15T12:00:00",
    currency: "INR",
    members: [
      {
        id: 1,
        name: "You",
        email: "you@example.com",
        avatar: "https://randomuser.me/api/portraits/men/32.jpg",
      },
      {
        id: 2,
        name: "Rahul",
        email: "rahul@example.com",
        avatar: "https://randomuser.me/api/portraits/men/22.jpg",
      },
      {
        id: 3,
        name: "Priya",
        email: "priya@example.com",
        avatar: "https://randomuser.me/api/portraits/women/26.jpg",
      },
      {
        id: 4,
        name: "Amit",
        email: "amit@example.com",
        avatar: "https://randomuser.me/api/portraits/men/43.jpg",
      },
      {
        id: 5,
        name: "Neha",
        email: "neha@example.com",
        avatar: "https://randomuser.me/api/portraits/women/33.jpg",
      },
      {
        id: 6,
        name: "Vikram",
        email: "vikram@example.com",
        avatar: "https://randomuser.me/api/portraits/men/55.jpg",
      },
    ],
  },
  {
    id: 2,
    name: "Roommates",
    avatar:
      "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&q=80",
    banner:
      "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80",
    createdAt: "2023-01-10T10:30:00",
    currency: "INR",
    members: [
      {
        id: 1,
        name: "You",
        email: "you@example.com",
        avatar: "https://randomuser.me/api/portraits/men/32.jpg",
      },
      {
        id: 2,
        name: "Rahul",
        email: "rahul@example.com",
        avatar: "https://randomuser.me/api/portraits/men/22.jpg",
      },
      {
        id: 4,
        name: "Amit",
        email: "amit@example.com",
        avatar: "https://randomuser.me/api/portraits/men/43.jpg",
      },
    ],
  },
  {
    id: 3,
    name: "Office Team Lunch",
    avatar:
      "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&q=80",
    banner:
      "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80",
    createdAt: "2023-05-20T14:15:00",
    currency: "INR",
    members: [
      {
        id: 1,
        name: "You",
        email: "you@example.com",
        avatar: "https://randomuser.me/api/portraits/men/32.jpg",
      },
      {
        id: 7,
        name: "Raj",
        email: "raj@example.com",
        avatar: "https://randomuser.me/api/portraits/men/76.jpg",
      },
      {
        id: 8,
        name: "Divya",
        email: "divya@example.com",
        avatar: "https://randomuser.me/api/portraits/women/67.jpg",
      },
      {
        id: 9,
        name: "Sanjay",
        email: "sanjay@example.com",
        avatar: "https://randomuser.me/api/portraits/men/89.jpg",
      },
    ],
  },
  {
    id: 4,
    name: "Weekend Getaway",
    avatar:
      "https://images.unsplash.com/photo-1566073771259-6a8506099945?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&q=80",
    banner:
      "https://images.unsplash.com/photo-1566073771259-6a8506099945?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80",
    createdAt: "2023-07-01T09:20:00",
    currency: "INR",
    members: [
      {
        id: 1,
        name: "You",
        email: "you@example.com",
        avatar: "https://randomuser.me/api/portraits/men/32.jpg",
      },
      {
        id: 3,
        name: "Priya",
        email: "priya@example.com",
        avatar: "https://randomuser.me/api/portraits/women/26.jpg",
      },
      {
        id: 5,
        name: "Neha",
        email: "neha@example.com",
        avatar: "https://randomuser.me/api/portraits/women/33.jpg",
      },
    ],
  },
];

export const mockExpenses = [
  {
    id: 1,
    groupId: 1,
    description: "Hotel Booking",
    amount: 12000,
    date: "2023-07-10T10:00:00",
    paidBy: {
      id: 5,
      name: "Neha",
      avatar: "https://randomuser.me/api/portraits/women/33.jpg",
    },
    participants: [
      {
        id: 1,
        name: "You",
        avatar: "https://randomuser.me/api/portraits/men/32.jpg",
      },
      {
        id: 2,
        name: "Rahul",
        avatar: "https://randomuser.me/api/portraits/men/22.jpg",
      },
      {
        id: 3,
        name: "Priya",
        avatar: "https://randomuser.me/api/portraits/women/26.jpg",
      },
      {
        id: 4,
        name: "Amit",
        avatar: "https://randomuser.me/api/portraits/men/43.jpg",
      },
      {
        id: 5,
        name: "Neha",
        avatar: "https://randomuser.me/api/portraits/women/33.jpg",
      },
      {
        id: 6,
        name: "Vikram",
        avatar: "https://randomuser.me/api/portraits/men/55.jpg",
      },
    ],
    category: { id: 1, name: "Accommodation", icon: "🏨" },
  },
  {
    id: 2,
    groupId: 1,
    description: "Dinner at Thalassa",
    amount: 7500,
    date: "2023-07-11T20:30:00",
    paidBy: {
      id: 1,
      name: "You",
      avatar: "https://randomuser.me/api/portraits/men/32.jpg",
    },
    participants: [
      {
        id: 1,
        name: "You",
        avatar: "https://randomuser.me/api/portraits/men/32.jpg",
      },
      {
        id: 2,
        name: "Rahul",
        avatar: "https://randomuser.me/api/portraits/men/22.jpg",
      },
      {
        id: 3,
        name: "Priya",
        avatar: "https://randomuser.me/api/portraits/women/26.jpg",
      },
      {
        id: 4,
        name: "Amit",
        avatar: "https://randomuser.me/api/portraits/men/43.jpg",
      },
      {
        id: 5,
        name: "Neha",
        avatar: "https://randomuser.me/api/portraits/women/33.jpg",
      },
      {
        id: 6,
        name: "Vikram",
        avatar: "https://randomuser.me/api/portraits/men/55.jpg",
      },
    ],
    category: { id: 2, name: "Food & Drink", icon: "🍔" },
  },
  {
    id: 3,
    groupId: 1,
    description: "Taxi to Airport",
    amount: 1800,
    date: "2023-07-09T06:15:00",
    paidBy: {
      id: 2,
      name: "Rahul",
      avatar: "https://randomuser.me/api/portraits/men/22.jpg",
    },
    participants: [
      {
        id: 1,
        name: "You",
        avatar: "https://randomuser.me/api/portraits/men/32.jpg",
      },
      {
        id: 2,
        name: "Rahul",
        avatar: "https://randomuser.me/api/portraits/men/22.jpg",
      },
      {
        id: 3,
        name: "Priya",
        avatar: "https://randomuser.me/api/portraits/women/26.jpg",
      },
    ],
    category: { id: 3, name: "Transportation", icon: "🚕" },
  },
  {
    id: 4,
    groupId: 1,
    description: "Beach Activities",
    amount: 3600,
    date: "2023-07-12T14:00:00",
    paidBy: {
      id: 4,
      name: "Amit",
      avatar: "https://randomuser.me/api/portraits/men/43.jpg",
    },
    participants: [
      {
        id: 1,
        name: "You",
        avatar: "https://randomuser.me/api/portraits/men/32.jpg",
      },
      {
        id: 2,
        name: "Rahul",
        avatar: "https://randomuser.me/api/portraits/men/22.jpg",
      },
      {
        id: 4,
        name: "Amit",
        avatar: "https://randomuser.me/api/portraits/men/43.jpg",
      },
      {
        id: 6,
        name: "Vikram",
        avatar: "https://randomuser.me/api/portraits/men/55.jpg",
      },
    ],
    category: { id: 4, name: "Entertainment", icon: "🏄‍♂️" },
  },
  {
    id: 5,
    groupId: 1,
    description: "Breakfast at Hotel",
    amount: 3000,
    date: "2023-07-11T08:30:00",
    paidBy: {
      id: 3,
      name: "Priya",
      avatar: "https://randomuser.me/api/portraits/women/26.jpg",
    },
    participants: [
      {
        id: 1,
        name: "You",
        avatar: "https://randomuser.me/api/portraits/men/32.jpg",
      },
      {
        id: 2,
        name: "Rahul",
        avatar: "https://randomuser.me/api/portraits/men/22.jpg",
      },
      {
        id: 3,
        name: "Priya",
        avatar: "https://randomuser.me/api/portraits/women/26.jpg",
      },
      {
        id: 4,
        name: "Amit",
        avatar: "https://randomuser.me/api/portraits/men/43.jpg",
      },
      {
        id: 5,
        name: "Neha",
        avatar: "https://randomuser.me/api/portraits/women/33.jpg",
      },
      {
        id: 6,
        name: "Vikram",
        avatar: "https://randomuser.me/api/portraits/men/55.jpg",
      },
    ],
    category: { id: 2, name: "Food & Drink", icon: "🍔" },
  },
  {
    id: 6,
    groupId: 2,
    description: "Monthly Rent",
    amount: 24000,
    date: "2023-07-02T09:00:00",
    paidBy: {
      id: 1,
      name: "You",
      avatar: "https://randomuser.me/api/portraits/men/32.jpg",
    },
    participants: [
      {
        id: 1,
        name: "You",
        avatar: "https://randomuser.me/api/portraits/men/32.jpg",
      },
      {
        id: 2,
        name: "Rahul",
        avatar: "https://randomuser.me/api/portraits/men/22.jpg",
      },
      {
        id: 4,
        name: "Amit",
        avatar: "https://randomuser.me/api/portraits/men/43.jpg",
      },
    ],
    category: { id: 5, name: "Housing", icon: "🏠" },
  },
  {
    id: 7,
    groupId: 2,
    description: "Electricity Bill",
    amount: 3600,
    date: "2023-07-05T17:30:00",
    paidBy: {
      id: 2,
      name: "Rahul",
      avatar: "https://randomuser.me/api/portraits/men/22.jpg",
    },
    participants: [
      {
        id: 1,
        name: "You",
        avatar: "https://randomuser.me/api/portraits/men/32.jpg",
      },
      {
        id: 2,
        name: "Rahul",
        avatar: "https://randomuser.me/api/portraits/men/22.jpg",
      },
      {
        id: 4,
        name: "Amit",
        avatar: "https://randomuser.me/api/portraits/men/43.jpg",
      },
    ],
    category: { id: 6, name: "Utilities", icon: "💡" },
  },
  {
    id: 8,
    groupId: 3,
    description: "Team Lunch at Olive",
    amount: 6000,
    date: "2023-06-15T13:00:00",
    paidBy: {
      id: 1,
      name: "You",
      avatar: "https://randomuser.me/api/portraits/men/32.jpg",
    },
    participants: [
      {
        id: 1,
        name: "You",
        avatar: "https://randomuser.me/api/portraits/men/32.jpg",
      },
      {
        id: 7,
        name: "Raj",
        avatar: "https://randomuser.me/api/portraits/men/76.jpg",
      },
      {
        id: 8,
        name: "Divya",
        avatar: "https://randomuser.me/api/portraits/women/67.jpg",
      },
      {
        id: 9,
        name: "Sanjay",
        avatar: "https://randomuser.me/api/portraits/men/89.jpg",
      },
    ],
    category: { id: 2, name: "Food & Drink", icon: "🍔" },
  },
];

// Update your mockFriends array to include balance and lastActivity
export const mockFriends = [
  {
    id: 2,
    name: "Rahul",
    email: "rahul@example.com",
    avatar: "https://randomuser.me/api/portraits/men/22.jpg",
    balance: -150.75, // You owe them
    lastActivity: "2023-07-10T14:30:00",
  },
  {
    id: 3,
    name: "Priya",
    email: "priya@example.com",
    avatar: "https://randomuser.me/api/portraits/women/26.jpg",
    balance: 250.0, // They owe you
    lastActivity: "2023-07-12T09:15:00",
  },
  {
    id: 4,
    name: "Amit",
    email: "amit@example.com",
    avatar: "https://randomuser.me/api/portraits/men/43.jpg",
    balance: 0, // All settled
    lastActivity: "2023-06-25T18:45:00",
  },
  {
    id: 5,
    name: "Neha",
    email: "neha@example.com",
    avatar: "https://randomuser.me/api/portraits/women/33.jpg",
    balance: 320.5, // They owe you
    lastActivity: "2023-07-08T12:20:00",
  },
  {
    id: 6,
    name: "Vikram",
    email: "vikram@example.com",
    avatar: "https://randomuser.me/api/portraits/men/55.jpg",
    balance: -75.25, // You owe them
    lastActivity: "2023-07-05T20:10:00",
  },
  {
    id: 7,
    name: "Raj",
    email: "raj@example.com",
    avatar: "https://randomuser.me/api/portraits/men/76.jpg",
    balance: 125.0, // They owe you
    lastActivity: "2023-06-30T11:40:00",
  },
  {
    id: 8,
    name: "Divya",
    email: "divya@example.com",
    avatar: "https://randomuser.me/api/portraits/women/67.jpg",
    balance: 0, // All settled
    lastActivity: "2023-07-01T16:55:00",
  },
  {
    id: 9,
    name: "Sanjay",
    email: "sanjay@example.com",
    avatar: "https://randomuser.me/api/portraits/men/89.jpg",
    balance: 60.75, // They owe you
    lastActivity: "2023-07-11T08:30:00",
  },
];
