import { Button } from 'react-bootstrap';

const NoElections = ({ searchTerm, statusFilter, onClearFilters }) => {
  return (
    <div className="text-center py-5">
      <div className="text-muted mb-3">
        <i className="bi bi-calendar-x" style={{ fontSize: '4rem' }}></i>
      </div>
      <h4>No Elections Found</h4>
      <p className="text-muted">
        {searchTerm || statusFilter !== 'all' 
          ? 'No elections match your search criteria.' 
          : 'There are no elections available at the moment.'
        }
      </p>
      {(searchTerm || statusFilter !== 'all') && (
        <Button 
          variant="outline-primary" 
          onClick={onClearFilters}
        >
          Show All Elections
        </Button>
      )}
    </div>
  );
};

export default NoElections;