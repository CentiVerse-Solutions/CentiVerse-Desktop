import { useViewer } from './useViewer';
import { displayName } from './viewer';

/**
 * §5.4 -- the single component that renders a person's name. It resolves "You"
 * from the viewer rather than reading a name literal out of the data.
 */
const PersonName = ({ person, fallback = 'Unknown' }) => {
  const { viewerId } = useViewer();
  if (!person) return <>{fallback}</>;
  return <>{displayName(person, viewerId)}</>;
};

export default PersonName;
