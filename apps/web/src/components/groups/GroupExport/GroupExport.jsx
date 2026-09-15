import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FileText,
    Download,
    X,
    Calendar,
    DollarSign,
    Users,
    CheckSquare,
    Clock,
    FileSpreadsheet,
    File,
    FileJson,
    FileImage,
    Printer
} from 'lucide-react';
import './GroupExport.css';
import ExportDateRange from '../../../features/groups/components/ExportDateRange';
import {
    generateCsvData as buildCsv,
    generateJsonData as buildJson,
} from '../../../features/groups/exportData';

const GroupExport = ({ isOpen, onClose, group, expenses, members, balances }) => {
    const [selectedFormat, setSelectedFormat] = useState('csv');
    const [dateRange, setDateRange] = useState('all');
    const [customDateStart, setCustomDateStart] = useState('');
    const [customDateEnd, setCustomDateEnd] = useState('');
    const [selectedData, setSelectedData] = useState({
        expenses: true,
        balances: true,
        members: true,
        summary: true
    });

    // Filter expenses based on date range
    const exportArgs = {
        group,
        expenses,
        balances,
        members,
        dateRange,
        customDateStart,
        customDateEnd,
        selectedData,
    };
    const generateCsvData = () => buildCsv(exportArgs);
    const generateJsonData = () => buildJson(exportArgs);

    const handleDownload = () => {
        let data, filename, type;

        if (selectedFormat === 'csv') {
            data = generateCsvData();
            filename = `${group.name}_export_${new Date().toISOString().split('T')[0]}.csv`;
            type = 'text/csv';
        } else if (selectedFormat === 'json') {
            data = generateJsonData();
            filename = `${group.name}_export_${new Date().toISOString().split('T')[0]}.json`;
            type = 'application/json';
        } else if (selectedFormat === 'pdf') {
            // For PDF, we would typically use a library like jsPDF
            // This is a placeholder for demonstration
            alert('PDF export would be implemented with a library like jsPDF');
            return;
        }

        // Create download link
        const blob = new Blob([data], { type });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.click();

        // Clean up
        URL.revokeObjectURL(url);
    };

    // Helpers for date selection
    const today = new Date().toISOString().split('T')[0];
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
    const threeMonthsAgoStr = threeMonthsAgo.toISOString().split('T')[0];

    // If not open, don't render
    if (!isOpen) return null;

    // Modal animation variants
    const overlayVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { duration: 0.3 }
        },
        exit: {
            opacity: 0,
            transition: { duration: 0.3 }
        }
    };

    const modalVariants = {
        hidden: { opacity: 0, scale: 0.9, y: 20 },
        visible: {
            opacity: 1,
            scale: 1,
            y: 0,
            transition: {
                type: "spring",
                stiffness: 300,
                damping: 30
            }
        },
        exit: {
            opacity: 0,
            scale: 0.9,
            y: 20,
            transition: { duration: 0.2 }
        }
    };

    return (
        <AnimatePresence>
            <motion.div
                className="modal-overlay"
                variants={overlayVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                onClick={onClose}
            >
                <motion.div
                    className="modal-content export-modal"
                    variants={modalVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    onClick={e => e.stopPropagation()}
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="export-title"
                >
                    <div className="modal-header">
                        <h2 id="export-title" className="modal-title">
                            <FileText className="modal-title-icon" size={20} />
                            Export Group Data
                        </h2>
                        <motion.button
                            className="modal-close-btn"
                            onClick={onClose}
                            whileHover={{ backgroundColor: "rgba(0, 0, 0, 0.06)" }}
                            whileTap={{ scale: 0.92 }}
                        >
                            <X size={20} />
                        </motion.button>
                    </div>

                    <div className="modal-body">
                        <ExportDateRange
                            today={today}
                            dateRange={dateRange}
                            setDateRange={setDateRange}
                            customDateStart={customDateStart}
                            setCustomDateStart={setCustomDateStart}
                            customDateEnd={customDateEnd}
                            setCustomDateEnd={setCustomDateEnd}
                            group={group}
                        />

                        <div className="export-section">
                            <h3 className="section-title">
                                <CheckSquare size={18} className="section-icon" />
                                Data to Include
                            </h3>
                            <div className="data-options">
                                <label className="data-option">
                                    <input
                                        type="checkbox"
                                        checked={selectedData.expenses}
                                        onChange={e => setSelectedData({ ...selectedData, expenses: e.target.checked })}
                                    />
                                    <span>Expenses</span>
                                </label>
                                <label className="data-option">
                                    <input
                                        type="checkbox"
                                        checked={selectedData.balances}
                                        onChange={e => setSelectedData({ ...selectedData, balances: e.target.checked })}
                                    />
                                    <span>Balances</span>
                                </label>
                                <label className="data-option">
                                    <input
                                        type="checkbox"
                                        checked={selectedData.members}
                                        onChange={e => setSelectedData({ ...selectedData, members: e.target.checked })}
                                    />
                                    <span>Members</span>
                                </label>
                                <label className="data-option">
                                    <input
                                        type="checkbox"
                                        checked={selectedData.summary}
                                        onChange={e => setSelectedData({ ...selectedData, summary: e.target.checked })}
                                    />
                                    <span>Summary</span>
                                </label>
                            </div>
                        </div>

                        <div className="export-section">
                            <h3 className="section-title">
                                <FileText size={18} className="section-icon" />
                                Export Format
                            </h3>
                            <div className="format-options">
                                <motion.div
                                    className={`format-option ${selectedFormat === 'csv' ? 'active' : ''}`}
                                    onClick={() => setSelectedFormat('csv')}
                                    whileHover={{ y: -5, backgroundColor: "rgba(105, 162, 151, 0.1)" }}
                                    whileTap={{ scale: 0.98 }}
                                >
                                    <FileSpreadsheet size={24} className="format-icon" />
                                    <div className="format-info">
                                        <h4>CSV</h4>
                                        <p>Spreadsheet format for data analysis</p>
                                    </div>
                                </motion.div>

                                <motion.div
                                    className={`format-option ${selectedFormat === 'json' ? 'active' : ''}`}
                                    onClick={() => setSelectedFormat('json')}
                                    whileHover={{ y: -5, backgroundColor: "rgba(105, 162, 151, 0.1)" }}
                                    whileTap={{ scale: 0.98 }}
                                >
                                    <FileJson size={24} className="format-icon" />
                                    <div className="format-info">
                                        <h4>JSON</h4>
                                        <p>Structured data for developers</p>
                                    </div>
                                </motion.div>

                                <motion.div
                                    className={`format-option ${selectedFormat === 'pdf' ? 'active' : ''}`}
                                    onClick={() => setSelectedFormat('pdf')}
                                    whileHover={{ y: -5, backgroundColor: "rgba(105, 162, 151, 0.1)" }}
                                    whileTap={{ scale: 0.98 }}
                                >
                                    <File size={24} className="format-icon" />
                                    <div className="format-info">
                                        <h4>PDF</h4>
                                        <p>Print-ready document format</p>
                                    </div>
                                </motion.div>
                            </div>
                        </div>
                    </div>

                    <div className="modal-footer">
                        <motion.button
                            className="btn btn-secondary"
                            onClick={onClose}
                            whileHover={{ y: -2 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            Cancel
                        </motion.button>

                        <motion.button
                            className="btn btn-primary"
                            onClick={handleDownload}
                            whileHover={{ y: -2, boxShadow: "0 5px 15px rgba(105, 162, 151, 0.3)" }}
                            whileTap={{ scale: 0.95 }}
                            disabled={
                                dateRange === 'custom' &&
                                (!customDateStart || !customDateEnd) ||
                                !Object.values(selectedData).some(val => val)
                            }
                        >
                            <Download size={18} />
                            Export
                        </motion.button>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

export default GroupExport;