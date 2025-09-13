import { Alert } from 'react-bootstrap';

const VerificationResult = ({ result }) => {
  if (!result) return null;

  const { status, message } = result;
  const variant = status === 'success' ? 'success' : 'danger';
  const icon = status === 'success' ? 'bi-check-circle-fill' : 'bi-x-octagon-fill';

  return (
    <Alert variant={variant} className="mt-4 shadow-sm">
      <Alert.Heading>
        <i className={`me-2 ${icon}`}></i>
        Verification Result
      </Alert.Heading>
      <p>{message}</p>
    </Alert>
  );
};

export default VerificationResult;