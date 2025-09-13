import { Spinner } from 'react-bootstrap';

const LoadingSpinner = () => {
  return (
    <div className="text-center py-5">
      <Spinner animation="border" variant="primary" className="mb-3" />
      <p>Loading elections...</p>
    </div>
  );
};

export default LoadingSpinner;