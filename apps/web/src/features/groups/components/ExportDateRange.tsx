import type { Group } from '../../../data/port';
import { Calendar } from 'lucide-react';

/**
 * 7.4 -- the export date-range picker, split out of GroupExport verbatim.
 */
interface ExportDateRangeProps {
    today: string;
    dateRange: string;
    setDateRange: (value: unknown) => void;
    customDateStart: string;
    setCustomDateStart: (value: unknown) => void;
    customDateEnd: string;
    setCustomDateEnd: (value: unknown) => void;
    group: Group;
}

const ExportDateRange = ({
    today,
    dateRange,
    setDateRange,
    customDateStart,
    setCustomDateStart,
    customDateEnd,
    setCustomDateEnd,
    group,
}: ExportDateRangeProps) => (
    <div className="export-section">
        <h3 className="section-title">
            <Calendar size={18} className="section-icon" />
            Date Range
        </h3>
        <div className="date-range-options">
            <label className="date-option">
                <input
                    type="radio"
                    name="dateRange"
                    value="all"
                    checked={dateRange === 'all'}
                    onChange={e => setDateRange(e.target.value)}
                />
                <span>All Time</span>
            </label>
            <label className="date-option">
                <input
                    type="radio"
                    name="dateRange"
                    value="month"
                    checked={dateRange === 'month'}
                    onChange={e => setDateRange(e.target.value)}
                />
                <span>This Month</span>
            </label>
            <label className="date-option">
                <input
                    type="radio"
                    name="dateRange"
                    value="quarter"
                    checked={dateRange === 'quarter'}
                    onChange={e => setDateRange(e.target.value)}
                />
                <span>This Quarter</span>
            </label>
            <label className="date-option">
                <input
                    type="radio"
                    name="dateRange"
                    value="year"
                    checked={dateRange === 'year'}
                    onChange={e => setDateRange(e.target.value)}
                />
                <span>This Year</span>
            </label>
            <label className="date-option">
                <input
                    type="radio"
                    name="dateRange"
                    value="custom"
                    checked={dateRange === 'custom'}
                    onChange={e => setDateRange(e.target.value)}
                />
                <span>Custom</span>
            </label>
        </div>
    
        {dateRange === 'custom' && (
            <div className="custom-date-range">
                <div className="date-input-group">
                    <label htmlFor="start-date">Start Date</label>
                    <input
                        type="date"
                        id="start-date"
                        value={customDateStart}
                        onChange={e => setCustomDateStart(e.target.value)}
                        max={customDateEnd || today}
                    />
                </div>
                <div className="date-input-group">
                    <label htmlFor="end-date">End Date</label>
                    <input
                        type="date"
                        id="end-date"
                        value={customDateEnd}
                        onChange={e => setCustomDateEnd(e.target.value)}
                        min={customDateStart}
                        max={today}
                    />
                </div>
            </div>
        )}
    </div>
);

export default ExportDateRange;
