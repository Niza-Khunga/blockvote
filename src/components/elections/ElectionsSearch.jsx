import { Row, Col, Form, Button } from 'react-bootstrap';

const ElectionsSearch = ({ 
  searchTerm, 
  statusFilter, 
  onSearchChange, 
  onStatusFilterChange,
  onRefresh 
}) => {
  return (
    <Row className="mb-4">
      <Col md={6}>
        <div className="input-group">
          <span className="input-group-text">
            <i className="bi bi-search"></i>
          </span>
          <Form.Control
            type="text"
            placeholder="Search elections by title, description, or candidates..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
          />
          {searchTerm && (
            <Button
              variant="outline-secondary"
              onClick={() => onSearchChange('')}
            >
              Clear
            </Button>
          )}
        </div>
      </Col>
      <Col md={4}>
        <Form.Select
          value={statusFilter}
          onChange={(e) => onStatusFilterChange(e.target.value)}
        >
          <option value="all">All Elections</option>
          <option value="active">Active</option>
          <option value="upcoming">Upcoming</option>
          <option value="ended">Ended</option>
          <option value="finalized">Finalized</option>
        </Form.Select>
      </Col>
      <Col md={2}>
        <Button 
          variant="outline-primary" 
          onClick={onRefresh}
          className="w-100"
        >
          <i className="bi bi-arrow-clockwise"></i> Refresh
        </Button>
      </Col>
    </Row>
  );
};

export default ElectionsSearch;