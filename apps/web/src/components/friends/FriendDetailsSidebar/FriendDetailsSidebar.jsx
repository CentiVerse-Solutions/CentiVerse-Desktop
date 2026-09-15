import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '../../ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../ui/tabs';
import { X, ArrowUpRight, ArrowDownRight, Check, DollarSign, Receipt, User, Mail, Phone, AlertCircle, MoreHorizontal, ChevronDown } from 'lucide-react';
import { Avatar } from '../../common/Avatar/Avatar';
import FriendDetailsContent from '../../../features/friends/components/FriendDetailsContent';
import './FriendDetailsSidebar.css';

// Mock expense data (in a real app, this would come from your API)

const FriendDetailsSidebar = ({ friend, isOpen, onClose }) => {
    const [activeTab, setActiveTab] = useState('expenses');
    const [expandedExpenses, setExpandedExpenses] = useState({});

    // Toggle expense details expansion
    const toggleExpenseDetails = (expenseId) => {
        setExpandedExpenses(prev => ({
            ...prev,
            [expenseId]: !prev[expenseId]
        }));
    };

    // Format the date
    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

    // Format the time
    const formatTime = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // Determine balance status and styling
    const getBalanceInfo = () => {
        if (friend.balance === 0) {
            return {
                status: 'settled',
                icon: <Check size={20} />,
                text: 'All settled up',
                className: 'settled'
            };
        } else if (friend.balance > 0) {
            return {
                status: 'owesYou',
                icon: <ArrowDownRight size={20} />,
                text: `${friend.name} owes you $${friend.balance.toFixed(2)}`,
                className: 'owes-you'
            };
        } else {
            return {
                status: 'youOwe',
                icon: <ArrowUpRight size={20} />,
                text: `You owe ${friend.name} $${Math.abs(friend.balance).toFixed(2)}`,
                className: 'you-owe'
            };
        }
    };

    const balanceInfo = getBalanceInfo();

    return (
        <Sheet open={isOpen} onOpenChange={onClose}>
            <SheetContent className="fr-details-sidebar">
                <SheetHeader className="fr-details-header">
                    <SheetTitle className="fr-details-title">Friend Details</SheetTitle>
                </SheetHeader>

                <FriendDetailsContent
                    activeTab={activeTab}
                    balanceInfo={balanceInfo}
                    expandedExpenses={expandedExpenses}
                    formatDate={formatDate}
                    formatTime={formatTime}
                    friend={friend}
                    setActiveTab={setActiveTab}
                    toggleExpenseDetails={toggleExpenseDetails}
                />
            </SheetContent>
        </Sheet>
    );
};

export default FriendDetailsSidebar;