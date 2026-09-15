import { useState } from 'react';
import { VIEWER_ID } from '../../shared/people/viewer';

/**
 * 7.4 -- the group screen's dialogs: settle-up, member removal and the shared
 * confirmation prompt. Lifted out of useGroupDetails verbatim.
 *
 * The confirm dialog is deliberately generic: a caller stashes an action, the
 * prompt runs it on confirm. That is why settle and remove both live here.
 */
export const useGroupDialogs = ({ group, setGroup, groupId, balances, createSettlement }) => {
    const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
    const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
    const [confirmAction, setConfirmAction] = useState(null);
    const [memberToRemove, setMemberToRemove] = useState(null);
    const [showSidebar, setShowSidebar] = useState(true);
    const [showExportModal, setShowExportModal] = useState(false);

    const toggleSidebar = () => setShowSidebar((prev) => !prev);

    const handleSettleUp = (memberId) => {
        if (!group) return;

        // Find the member
        const member = group.members.find(m => m.id === memberId);
        if (!member) return;

        // Get the balance for this member
        const balance = balances.find(b => b.id === memberId);
        if (!balance || balance.balance === 0) return;

        // Create a settlement expense
        const settlement = {
            id: Date.now(),
            groupId: parseInt(groupId),
            description: `Settlement with ${member.name}`,
            amount: Math.abs(balance.balance),
            date: new Date().toISOString().slice(0, 10),
            paidBy: balance.balance < 0
                ? member // They owe you
                : group.members.find(m => m.id === VIEWER_ID), // You owe them
            category: {
                id: 'other',
                name: 'Settlement',
                icon: '💰'
            },
            participants: [
                member,
                group.members.find(m => m.id === VIEWER_ID)
            ],
            isSettlement: true
        };

        // §4.4: a settlement is its own ledger entry between two real parties,
        // never a synthetic expense row.
        createSettlement.mutate({
            groupId: parseInt(groupId, 10),
            from: balance.balance < 0 ? member.id : VIEWER_ID,
            to: balance.balance < 0 ? VIEWER_ID : member.id,
            amountMinor: Math.round(Math.abs(balance.balance) * 100),
            currency: group.currency || 'INR',
            method: 'OTHER',
        });

        // Show success notification (in a real app)
        console.log('Settlement added:', settlement);
    };

    // Handle member removal with confirmation
    const handleRemoveMember = (memberId) => {
        if (!group) return;

        // Find the member
        const member = group.members.find(m => m.id === memberId);
        if (!member || member.id === VIEWER_ID) return;

        // Set up confirmation dialog
        setMemberToRemove(member);
        setConfirmAction(() => () => {
            // This would be an API call in a real app
            // const response = await fetch(`/api/groups/${groupId}/members/${memberId}`, {
            //   method: 'DELETE',
            // });

            // if (!response.ok) {
            //   console.error('Failed to remove member');
            //   return;
            // }

            const updatedGroup = {
                ...group,
                members: group.members.filter(m => m.id !== memberId)
            };

            setGroup(updatedGroup);
            setIsConfirmDialogOpen(false);

            // Show success notification
            console.log(`Removed ${member.name} from group`);
        });

        setIsConfirmDialogOpen(true);
    };

    const handleConfirmAction = () => {
        if (confirmAction) {
            confirmAction();
        }
        setIsConfirmDialogOpen(false);
    };

    const handleCancelConfirm = () => {
        setIsConfirmDialogOpen(false);
        setConfirmAction(null);
        setMemberToRemove(null);
    };

    return {
        isQuickAddOpen,
        setIsQuickAddOpen,
        isConfirmDialogOpen,
        confirmAction,
        memberToRemove,
        showSidebar,
        toggleSidebar,
        showExportModal,
        setShowExportModal,
        handleSettleUp,
        handleRemoveMember,
        handleConfirmAction,
        handleCancelConfirm,
    };
};
