import Whiteboard from '../../../../components/groups/Whiteboard/Whiteboard';

/**
 * §7.4 — extracted from GroupDetails verbatim. Behaviour-preserving: same
 * markup, same ARIA wiring, same props.
 */
interface WhiteboardTabProps {
    groupId: number;
}

const WhiteboardTab = ({ groupId }: WhiteboardTabProps) => (
    <div
        className="whiteboard-container"
        role="tabpanel"
        id="whiteboard-tab"
        aria-labelledby="whiteboard-tab-btn"
    >
        <Whiteboard groupId={groupId} />
    </div>
);

export default WhiteboardTab;
