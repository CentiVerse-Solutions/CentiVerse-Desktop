import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Card,
    CardContent,
    Chip,
    Avatar,
    Collapse,
    Divider,
    useTheme
} from '@mui/material';
import { motion } from 'framer-motion';
import { formatCurrency, formatDate, timeAgo } from '../../../utils/formatters';

// Create MUI theme extension with your color palette
const colorPalette = {
    teal: '#69a297',
    sage: '#a3c9a8',
    tealLight: '#84b59f',
    tealDark: '#50808e',
    darkAccent: '#2c3e50',
    cream: '#ddd8c4',

    // Activity-specific colors
    settledColor: '#4caf50',
    settledBg: 'rgba(76, 175, 80, 0.1)',
    youOweColor: '#ff9800',
    youOweBg: 'rgba(255, 152, 0, 0.1)',
    youAreOwedColor: '#2196f3',
    youAreOwedBg: 'rgba(33, 150, 243, 0.1)',
    expenseColor: '#50808e', // tealDark
    expenseBg: 'rgba(80, 128, 142, 0.1)',
    paymentColor: '#9c27b0',
    paymentBg: 'rgba(156, 39, 176, 0.1)',
};

// Activity type icons as MUI-styled components
const ExpenseIcon = () => (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 1V23" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M17 5H9.5C8.57174 5 7.6815 5.36875 7.02513 6.02513C6.36875 6.6815 6 7.57174 6 8.5C6 9.42826 6.36875 10.3185 7.02513 10.9749C7.6815 11.6313 8.57174 12 9.5 12H14.5C15.4283 12 16.3185 12.3687 16.9749 13.0251C17.6313 13.6815 18 14.5717 18 15.5C18 16.4283 17.6313 17.3185 16.9749 17.9749C16.3185 18.6313 15.4283 19 14.5 19H6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

const PaymentIcon = () => (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M19 5H5C3.89543 5 3 5.89543 3 7V17C3 18.1046 3.89543 19 5 19H19C20.1046 19 21 18.1046 21 17V7C21 5.89543 20.1046 5 19 5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M3 10H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M7 15H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M15 15H17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

const SettlementIcon = () => (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M19 21H5C3.89543 21 3 20.1046 3 19V5C3 3.89543 3.89543 3 5 3H15L21 9V19C21 20.1046 20.1046 21 19 21Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M17 21V13H7V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M7 3V9H15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

// Helper function to group activities by month
const groupActivitiesByMonth = (activities) => {
    const grouped = {};

    activities.forEach(activity => {
        const date = new Date(activity.date);
        const monthYear = `${date.toLocaleString('default', { month: 'long' })} ${date.getFullYear()}`;

        if (!grouped[monthYear]) {
            grouped[monthYear] = [];
        }

        grouped[monthYear].push(activity);
    });

    return grouped;
};

// Component to display when there are no activities
const EmptyActivityFeed = ({ activeFilter }) => (
    <Card className="w-full overflow-hidden shadow-md rounded-xl">
        <CardContent className="flex flex-col items-center justify-center py-12">
            <motion.div
                initial={{ opacity: 0.6, scale: 0.9 }}
                animate={{
                    opacity: [0.6, 0.8, 0.6],
                    scale: [1, 1.05, 1]
                }}
                transition={{
                    duration: 2,
                    repeat: Infinity,
                    repeatType: "loop"
                }}
                className="text-sage mb-6"
            >
                <svg width="60" height="60" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M19 21H5C3.89543 21 3 20.1046 3 19V5C3 3.89543 3.89543 3 5 3H15L21 9V19C21 20.1046 20.1046 21 19 21Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M17 21V13H7V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M7 3V9H15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
            </motion.div>
            <Typography variant="h5" className="font-semibold text-darkAccent mb-2">
                No activities to show
            </Typography>
            <Typography variant="body2" className="text-gray-500 max-w-xs text-center">
                {activeFilter !== 'all' ? (
                    `There are no ${activeFilter} activities to display`
                ) : (
                    'When you add expenses or make payments, they will appear here'
                )}
            </Typography>
        </CardContent>
    </Card>
);

// ActivityItem component with MUI and Tailwind
const ActivityItem = ({ activity }) => {
    const getActivityIcon = (type) => {
        switch (type) {
            case 'expense':
                return <ExpenseIcon />;
            case 'payment':
                return <PaymentIcon />;
            case 'settlement':
                return <SettlementIcon />;
            default:
                return <ExpenseIcon />;
        }
    };

    const getIconBgColor = (type) => {
        switch (type) {
            case 'expense':
                return colorPalette.expenseBg;
            case 'payment':
                return colorPalette.paymentBg;
            case 'settlement':
                return colorPalette.settledBg;
            default:
                return colorPalette.expenseBg;
        }
    };

    const getIconColor = (type) => {
        switch (type) {
            case 'expense':
                return colorPalette.expenseColor;
            case 'payment':
                return colorPalette.paymentColor;
            case 'settlement':
                return colorPalette.settledColor;
            default:
                return colorPalette.expenseColor;
        }
    };

    const getBorderColor = (type) => {
        switch (type) {
            case 'expense':
                return colorPalette.expenseColor;
            case 'payment':
                return colorPalette.paymentColor;
            case 'settlement':
                return colorPalette.settledColor;
            default:
                return colorPalette.expenseColor;
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            whileHover={{ y: -3, boxShadow: "0 5px 15px rgba(0, 0, 0, 0.08)" }}
            className="w-full"
        >
            <Card
                className="w-full overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 rounded-xl"
                sx={{
                    borderLeft: `3px solid ${getBorderColor(activity.type)}`,
                    '&:hover': {
                        transform: 'translateY(-3px)',
                    }
                }}
            >
                <CardContent className="p-5">
                    <div className="flex justify-between gap-4 flex-col md:flex-row">
                        {/* Left side with description and details */}
                        <div className="flex items-start gap-4">
                            {/* Icon container */}
                            <Box
                                className="flex items-center justify-center rounded-lg p-2 flex-shrink-0 w-10 h-10"
                                sx={{
                                    backgroundColor: getIconBgColor(activity.type),
                                    color: getIconColor(activity.type)
                                }}
                            >
                                {getActivityIcon(activity.type)}
                            </Box>

                            {/* Group avatar */}
                            {activity.group && (
                                <Avatar
                                    src={activity.group.image}
                                    alt={activity.group.name}
                                    className="rounded-lg flex-shrink-0 w-10 h-10"
                                />
                            )}

                            {/* Details */}
                            <div className="flex-1 min-w-0">
                                <Typography
                                    variant="subtitle1"
                                    className="font-semibold text-darkAccent mb-1 truncate"
                                >
                                    {activity.description}
                                </Typography>

                                <div className="flex gap-3 flex-wrap text-xs text-gray-500 mb-2">
                                    {activity.group && (
                                        <Typography
                                            variant="caption"
                                            className="font-medium"
                                            sx={{ color: colorPalette.tealDark }}
                                        >
                                            {activity.group.name}
                                        </Typography>
                                    )}

                                    <Typography variant="caption" className="font-medium">
                                        {timeAgo(activity.date)}
                                    </Typography>

                                    <Typography variant="caption" className="text-gray-400">
                                        {formatDate(activity.date)}
                                    </Typography>
                                </div>

                                {/* Participants */}
                                <Typography variant="body2" className="text-gray-600 text-xs md:text-sm">
                                    {activity.type === 'expense' && (
                                        <>
                                            <span className="block">
                                                <span className="font-semibold text-darkAccent">{activity.paidBy.name}</span> paid
                                            </span>
                                            <span className="block">
                                                {activity.participants.length > 3
                                                    ? `Split equally among ${activity.participants.length} people`
                                                    : `Split equally among ${activity.participants.map(p => p.name).join(', ')}`
                                                }
                                            </span>
                                        </>
                                    )}

                                    {activity.type === 'payment' && (
                                        <span>
                                            <span className="font-semibold text-darkAccent">{activity.paidBy.name}</span> paid <span className="font-semibold text-darkAccent">{activity.paidTo.name}</span>
                                        </span>
                                    )}

                                    {activity.type === 'settlement' && (
                                        <span>
                                            <span className="font-semibold text-darkAccent">{activity.paidBy.name}</span> settled up with <span className="font-semibold text-darkAccent">{activity.paidTo.name}</span>
                                        </span>
                                    )}
                                </Typography>
                            </div>
                        </div>

                        {/* Right side with amount and status */}
                        <div className="flex flex-col items-end justify-center gap-1 md:min-w-28 flex-shrink-0">
                            <Typography
                                variant="subtitle1"
                                className="font-bold"
                                sx={{
                                    color: activity.paidBy.name === 'You'
                                        ? colorPalette.tealDark
                                        : colorPalette.darkAccent
                                }}
                            >
                                {formatCurrency(activity.amount)}
                            </Typography>

                            {activity.type === 'expense' && activity.paidBy.name !== 'You' && (
                                <Typography
                                    variant="caption"
                                    className="font-medium"
                                    sx={{ color: colorPalette.youOweColor }}
                                >
                                    You owe {formatCurrency(activity.participants.find(p => p.name === 'You')?.amount || 0)}
                                </Typography>
                            )}

                            {activity.type === 'expense' && activity.paidBy.name === 'You' && (
                                <Typography
                                    variant="caption"
                                    className="font-medium"
                                    sx={{ color: colorPalette.youAreOwedColor }}
                                >
                                    You lent {formatCurrency(activity.amount - (activity.participants.find(p => p.name === 'You')?.amount || 0))}
                                </Typography>
                            )}

                            <Chip
                                label={activity.status === 'settled' ? 'Settled' : 'Unsettled'}
                                size="small"
                                sx={{
                                    height: '20px',
                                    fontSize: '0.65rem',
                                    fontWeight: 600,
                                    textTransform: 'uppercase',
                                    backgroundColor: activity.status === 'settled'
                                        ? colorPalette.settledBg
                                        : colorPalette.youOweBg,
                                    color: activity.status === 'settled'
                                        ? colorPalette.settledColor
                                        : colorPalette.youOweColor,
                                    borderRadius: '12px',
                                    '.MuiChip-label': {
                                        padding: '0 8px',
                                    }
                                }}
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    );
};

// Month section component
const MonthSection = ({ month, activities }) => {
    return (
        <Box className="mb-10">
            <Box className="mb-4">
                <Typography
                    variant="h6"
                    className="font-semibold text-darkAccent inline-block relative pb-2"
                    sx={{
                        '&:after': {
                            content: '""',
                            position: 'absolute',
                            bottom: 0,
                            left: 0,
                            width: '30px',
                            height: '3px',
                            background: `linear-gradient(to right, ${colorPalette.teal}, ${colorPalette.tealLight})`,
                            borderRadius: '1.5px',
                        }
                    }}
                >
                    {month}
                </Typography>
            </Box>

            <Box className="space-y-3">
                {activities
                    .sort((a, b) => new Date(b.date) - new Date(a.date))
                    .map((activity, index) => (
                        <ActivityItem key={activity.id} activity={activity} index={index} />
                    ))}
            </Box>
        </Box>
    );
};

// Main ActivityFeed component
const ActivityFeed = ({ activities, activeFilter = 'all' }) => {
    const [filteredActivities, setFilteredActivities] = useState([]);
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        // Filter activities based on activeFilter
        if (activeFilter === 'all') {
            setFilteredActivities(activities);
        } else {
            const filtered = activities.filter(activity => activity.type === activeFilter);
            setFilteredActivities(filtered);
        }

        // Trigger animation after a small delay
        const timer = setTimeout(() => {
            setIsLoaded(true);
        }, 100);

        return () => clearTimeout(timer);
    }, [activities, activeFilter]);

    // Group activities by month
    const groupedActivities = groupActivitiesByMonth(filteredActivities);

    // If no activities match the filter, show empty state
    if (filteredActivities.length === 0) {
        return <EmptyActivityFeed activeFilter={activeFilter} />;
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isLoaded ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="w-full"
        >
            {Object.entries(groupedActivities)
                .sort(([monthA], [monthB]) => {
                    // Sort months descending (newest first)
                    const dateA = new Date(monthA);
                    const dateB = new Date(monthB);
                    return dateB - dateA;
                })
                .map(([month, monthActivities], index) => (
                    <MonthSection
                        key={month}
                        month={month}
                        activities={monthActivities}
                    />
                ))}
        </motion.div>
    );
};

export default ActivityFeed;