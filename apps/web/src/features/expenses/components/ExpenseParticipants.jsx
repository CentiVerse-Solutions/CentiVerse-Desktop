import { motion } from 'framer-motion';

/**
 * 7.4 -- split out of QuickAddExpense verbatim to bring it under the
 * 300-line limit. Behaviour-preserving.
 */
const ExpenseParticipants = ({
    group,
    expenseForm,
    formErrors,
    handleParticipantChange,
    handleExpenseFormChange,
}) => (
    <>
    <motion.div
        className="form-group modern-input"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.6 }}
    >
        <label>
            <motion.span whileHover={{ scale: 1.05 }}>Split type</motion.span>
        </label>
        <div className="split-type-selector modern-split-selector">
            <div className="split-type-icons modern-split-icons">
                {["equal", "unequal", "percent", "shares"].map((type, index) => (
                    <motion.div
                        key={type}
                        className={`split-type-icon modern-split-icon ${expenseForm.splitType === type ? 'active' : ''}`}
                        onClick={() => handleExpenseFormChange({ target: { name: 'splitType', value: type } })}
                        whileHover={{ y: -5, boxShadow: "0 8px 20px rgba(105, 162, 151, 0.2)" }}
                        whileTap={{ scale: 0.95 }}
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.6 + index * 0.05 }}
                    >
                        <div className={`icon-${type}`}>
                            {type === "equal" && (
                                <div className="equal-bars">
                                    <div className="equal-bar"></div>
                                    <div className="equal-bar"></div>
                                </div>
                            )}
                            {type === "unequal" && (
                                <div className="unequal-bars">
                                    <div className="unequal-bar tall"></div>
                                    <div className="unequal-bar medium"></div>
                                    <div className="unequal-bar short"></div>
                                </div>
                            )}
                            {type === "percent" && <div>%</div>}
                            {type === "shares" && <div className="shares-pie"></div>}
                        </div>
                        <span>{type.charAt(0).toUpperCase() + type.slice(1)}</span>
                    </motion.div>
                ))}
            </div>
        </div>
    </motion.div>
        
    <motion.div
        className={`form-group modern-input ${formErrors.participants ? 'has-error' : ''}`}
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.7 }}
    >
        <label>
            <motion.span whileHover={{ scale: 1.05 }}>Split between</motion.span>
        </label>
        <div className="member-checkboxes modern-checkboxes" role="group" aria-labelledby="participants-label">
            <span id="participants-label" className="sr-only">Select participants</span>
            <div className="checkbox-grid">
                {group.members.map((member, index) => (
                    <motion.div
                        key={member.id}
                        className="member-checkbox modern-checkbox"
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.7 + index * 0.05 }}
                        whileHover={{
                            backgroundColor: "rgba(105, 162, 151, 0.1)",
                            scale: 1.02
                        }}
                    >
                        <input
                            type="checkbox"
                            id={`member-${member.id}`}
                            checked={expenseForm.participants.includes(member.id)}
                            onChange={() => handleParticipantChange(member.id)}
                            aria-invalid={formErrors.participants ? "true" : "false"}
                        />
                        <label htmlFor={`member-${member.id}`} className="checkbox-label">
                            <div className="checkbox-participant-avatar">
                                <motion.img
                                    src={member.avatar}
                                    alt={member.name}
                                    whileHover={{ scale: 1.2 }}
                                />
                            </div>
                            <span>{member.name}</span>
                        </label>
                    </motion.div>
                ))}
            </div>
        </div>
        {formErrors.participants && (
            <motion.p
                className="form-error"
                role="alert"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
            >
                {formErrors.participants}
            </motion.p>
        )}
    </motion.div>
    </>
);

export default ExpenseParticipants;
