import { useViewer } from './useViewer';
import { displayName, type Person } from './viewer';

/**
 * §5.4 -- the single component that renders a person's name. It resolves "You"
 * from the viewer rather than reading a name literal out of the data.
 */
interface PersonNameProps {
  person: Pick<Person, 'id' | 'name'> | null | undefined;
  fallback?: string;
}

const PersonName = ({ person, fallback = 'Unknown' }: PersonNameProps) => {
  const { viewerId } = useViewer();
  if (!person) return <>{fallback}</>;
  return <>{displayName(person, viewerId)}</>;
};

export default PersonName;
