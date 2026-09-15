import { motion } from 'framer-motion';
import { Avatar } from '../../../components/common/Avatar/Avatar';
import { Button } from '../../../components/common/Button/Button';
import { ArrowDownLeft, ArrowUpRight, CheckCircle, ChevronDown, ChevronUp, DollarSign, Link } from 'lucide-react';

/**
 * 7.4 -- extracted from Activity verbatim (behaviour-preserving).
 */
const ActivityTimeline = ({
    activities,
    expandedItems,
    filterCategory,
    filterGroup,
    filterSettlement,
    filterType,
    formatCurrency,
    formatDate,
    groupedActivities,
    handleSettle,
    itemVariants,
    searchQuery,
    setFilterCategory,
    setFilterGroup,
    setFilterSettlement,
    setFilterType,
    setSearchQuery,
    summary,
    toggleExpenseDetails,
}) => (
    <motion.div className="act-timeline" variants={itemVariants}>
        {Object.keys(groupedActivities).length > 0 ? (
            Object.entries(groupedActivities).map(([monthYear, monthActivities]) => (
                <div key={monthYear} className="act-timeline-month">
                    <div className="act-month-header">
                        <h2 className="act-month-label">{monthYear}</h2>
                        <div className="act-month-line"></div>
                    </div>
    
                    <div className="act-month-activities">
                        {monthActivities.map(activity => (
                            <motion.div
                                key={activity.id}
                                className="act-item"
                                variants={itemVariants}
                                whileHover={{ scale: 1.01 }}
                            >
                                <div
                                    className={`act-card ${activity.isSettled ? 'settled' : ''} ${activity.settlementType}`}
                                    onClick={() => toggleExpenseDetails(activity.id)}
                                >
                                    <div className="act-date">
                                        <div className="act-date-circle">
                                            <span className="act-date-day">
                                                {new Date(activity.date).getDate()}
                                            </span>
                                        </div>
                                    </div>
    
                                    <div className="act-main">
                                        <div className="act-card-header">
                                            <div className="act-basic-info">
                                                <div className="act-title-row">
                                                    <h3 className="act-description">
                                                        {activity.description}
                                                    </h3>
                                                    {activity.isSettled ? (
                                                        <span className="act-status-tag settled">
                                                            <CheckCircle size={12} />
                                                            Settled
                                                        </span>
                                                    ) : (
                                                        <span className="act-status-tag pending">
                                                            Pending
                                                        </span>
                                                    )}
                                                </div>
                                                <span className="act-meta">
                                                    {activity.group ? (
                                                        <span className="act-group">
                                                            {activity.group.name}
                                                        </span>
                                                    ) : (
                                                        <span className="act-group">Personal</span>
                                                    )}
                                                    <span className="act-category">
                                                        {activity.category.icon} {activity.category.name}
                                                    </span>
                                                </span>
                                            </div>
    
                                            <div className="act-amount-container">
                                                <div className={`act-settlement-indicator ${activity.settlementType}`}>
                                                    {activity.settlementType === 'youOwe' ? (
                                                        <>
                                                            <ArrowUpRight size={14} />
                                                            <span>You owe</span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <ArrowDownLeft size={14} />
                                                            <span>Owes you</span>
                                                        </>
                                                    )}
                                                </div>
                                                <span className="act-amount">
                                                    {formatCurrency(activity.amount)}
                                                </span>
                                                <span className="act-settlement-amount">
                                                    Your share: {formatCurrency(activity.settlementAmount)}
                                                </span>
                                                <span className="act-time">
                                                    {activity.isSettled
                                                        ? `Settled ${formatDate(activity.settledDate)}`
                                                        : formatDate(activity.date)}
                                                </span>
                                            </div>
                                        </div>
    
                                        <div className="act-summary">
                                            <div className="act-paid-by">
                                                <Avatar
                                                    src={activity.paidBy.avatar}
                                                    alt={activity.paidBy.name}
                                                    size="small"
                                                />
                                                <span>
                                                    {activity.paidBy.name} paid
                                                </span>
                                            </div>
    
                                            <div className="act-participants">
                                                <div className="act-participant-avatars">
                                                    {activity.participants.slice(0, 3).map(participant => (
                                                        <Avatar
                                                            key={participant.id}
                                                            src={participant.avatar}
                                                            alt={participant.name}
                                                            size="xsmall"
                                                        />
                                                    ))}
                                                    {activity.participants.length > 3 && (
                                                        <div className="act-avatar-more">
                                                            +{activity.participants.length - 3}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
    
                                            <button className="act-expander">
                                                {expandedItems[activity.id]
                                                    ? <ChevronUp size={18} />
                                                    : <ChevronDown size={18} />
                                                }
                                            </button>
                                        </div>
                                    </div>
                                </div>
    
                                {expandedItems[activity.id] && (
                                    <motion.div
                                        className="act-details"
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        transition={{ duration: 0.3 }}
                                    >
                                        <div className="act-details-section">
                                            <h4 className="act-details-title">Participants</h4>
                                            <div className="act-participants-list">
                                                {activity.participants.map(participant => (
                                                    <div key={participant.id} className="act-participant-item">
                                                        <Avatar
                                                            src={participant.avatar}
                                                            alt={participant.name}
                                                            size="small"
                                                        />
                                                        <span className="act-participant-name">
                                                            {participant.name}
                                                        </span>
                                                        <span className="act-participant-share">
                                                            {formatCurrency(activity.amount / activity.participants.length)}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
    
                                        <div className="act-details-section">
                                            <h4 className="act-details-title">Settlement Details</h4>
                                            <div className="act-details-grid">
                                                <div className="act-detail-item">
                                                    <span className="act-detail-label">Status</span>
                                                    <span className={`act-detail-value ${activity.isSettled ? 'settled-text' : 'pending-text'}`}>
                                                        {activity.isSettled ? 'Settled' : 'Pending settlement'}
                                                    </span>
                                                </div>
    
                                                {activity.isSettled && (
                                                    <div className="act-detail-item">
                                                        <span className="act-detail-label">Settled On</span>
                                                        <span className="act-detail-value">
                                                            {new Date(activity.settledDate).toLocaleDateString('en-US', {
                                                                month: 'long',
                                                                day: 'numeric',
                                                                year: 'numeric'
                                                            })}
                                                        </span>
                                                    </div>
                                                )}
    
                                                <div className="act-detail-item">
                                                    <span className="act-detail-label">Total Amount</span>
                                                    <span className="act-detail-value">
                                                        {formatCurrency(activity.amount)}
                                                    </span>
                                                </div>
    
                                                <div className="act-detail-item">
                                                    <span className="act-detail-label">Your Share</span>
                                                    <span className="act-detail-value">
                                                        {formatCurrency(activity.amount / activity.participants.length)}
                                                    </span>
                                                </div>
    
                                                <div className="act-detail-item">
                                                    <span className="act-detail-label">Settlement</span>
                                                    <span className="act-detail-value">
                                                        {activity.settlementType === 'youOwe' ? (
                                                            <span className="act-owe-text">You owe {activity.paidBy.name}</span>
                                                        ) : (
                                                            <span className="act-owed-text">Others owe you</span>
                                                        )}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
    
                                        <div className="act-details-section">
                                            <h4 className="act-details-title">Expense Details</h4>
                                            <div className="act-details-grid">
                                                <div className="act-detail-item">
                                                    <span className="act-detail-label">Date</span>
                                                    <span className="act-detail-value">
                                                        {new Date(activity.date).toLocaleDateString('en-US', {
                                                            month: 'long',
                                                            day: 'numeric',
                                                            year: 'numeric'
                                                        })}
                                                    </span>
                                                </div>
    
                                                <div className="act-detail-item">
                                                    <span className="act-detail-label">Group</span>
                                                    {activity.group ? (
                                                        <Link to={`/groups/${activity.groupId}`} className="act-detail-value link">
                                                            {activity.group.name}
                                                        </Link>
                                                    ) : (
                                                        <span className="act-detail-value">Personal</span>
                                                    )}
                                                </div>
    
                                                <div className="act-detail-item">
                                                    <span className="act-detail-label">Category</span>
                                                    <span className="act-detail-value">
                                                        {activity.category.icon} {activity.category.name}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
    
                                        <div className="act-details-actions">
                                            {!activity.isSettled && (
                                                <Button
                                                    variant="primary"
                                                    className="act-details-btn"
                                                    icon={<DollarSign size={16} />}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleSettle(activity.id);
                                                    }}
                                                >
                                                    {activity.settlementType === 'youOwe'
                                                        ? 'Mark as Paid'
                                                        : 'Mark as Received'}
                                                </Button>
                                            )}
    
                                            <Button
                                                variant={activity.isSettled ? "primary" : "outline"}
                                                className="act-details-btn"
                                            >
                                                View Full Details
                                            </Button>
                                        </div>
                                    </motion.div>
                                )}
                            </motion.div>
                        ))}
                    </div>
                </div>
            ))
        ) : (
            <div className="act-no-results">
                <p>No activities found matching your criteria.</p>
                {(searchQuery || filterType !== 'all' || filterGroup !== 'all' || filterCategory !== 'all' || filterSettlement !== 'all') && (
                    <Button onClick={() => {
                        setSearchQuery('');
                        setFilterType('all');
                        setFilterGroup('all');
                        setFilterCategory('all');
                        setFilterSettlement('all');
                    }}>
                        Clear Filters
                    </Button>
                )}
            </div>
        )}
    </motion.div>
);

export default ActivityTimeline;
