'use client';
import { useState, useEffect } from 'react';
import { Modal, Button, Table, Alert, Badge, Spinner, Card, Form, Row } from 'react-bootstrap';
import { useVotingContext } from '../context/VotingContext';
import { useElectionContext } from '../context/ElectionContext';
import { toast } from 'react-toastify';
import EditElection from './EditElection';

const ManageElections = ({ showModal, setShowModal }) => {
  const { votingContract, account, isAdmin } = useVotingContext();
  const { cancelElection, finalizeElection, getElections } = useElectionContext();
  const [elections, setElections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);
  const [selectedElection, setSelectedElection] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredElections, setFilteredElections] = useState([]);
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    const fetchElections = async () => {
      if (!votingContract) {
        setError('Please connect your wallet to manage elections.');
        setLoading(false);
        return;
      }

      if (!isAdmin) {
        setError('Only admin can manage elections.');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        let electionCount;
        try {
          console.log('Fetching election count...');
          electionCount = await votingContract.getElectionCount();
          console.log('Election count received:', electionCount.toString());
        } catch (err) {
          console.error('Error getting election count:', err);
          setError('Failed to connect to contract. Make sure it\'s deployed correctly.');
          setLoading(false);
          return;
        }
        
        const count = Number(electionCount);
        console.log('Total elections found:', count);

        if (count === 0) {
          setElections([]);
          setLoading(false);
          return;
        }

        const electionList = [];
        
        for (let i = 1; i <= count; i++) {
          try {
            let exists = true;
            try {
              exists = await votingContract.electionExists(i);
              console.log(`Election ${i} exists:`, exists);
            } catch (e) {
              console.warn('electionExists function not available, assuming election exists');
            }

            if (!exists) continue;

            console.log(`Fetching details for election ${i}...`);
            const details = await votingContract.getElectionDetails(i);
            console.log(`Election ${i} details:`, details);
            
            electionList.push({
              id: i,
              title: details.title || 'Untitled Election',
              description: details.description || '',
              status: Number(details.status),
              startDate: new Date(Number(details.startDate) * 1000),
              endDate: new Date(Number(details.endDate) * 1000),
              candidates: details.candidates || [],
              rawStatus: Number(details.status),
              isFinalized: details.isFinalized || false,
              totalVotes: Number(details.totalVotes || 0)
            });
          } catch (err) {
            console.warn(`Error fetching election ${i}:`, err);
            electionList.push({
              id: i,
              title: `Election #${i} (Error loading details)`,
              description: '',
              status: 0,
              startDate: new Date(),
              endDate: new Date(),
              candidates: [],
              rawStatus: 0,
              isFinalized: false,
              totalVotes: 0
            });
          }
        }

        setElections(electionList);
        setLoading(false);
        
      } catch (err) {
        console.error('Error fetching elections:', err);
        setError(`Failed to load elections: ${err.message || 'Unknown error'}`);
        setLoading(false);
      }
    };

    if (showModal) {
      fetchElections();
    }
  }, [votingContract, showModal, isAdmin]);

  // Filter elections based on search term and status
  useEffect(() => {
    if (elections.length > 0) {
      let filtered = elections;
      
      // Apply search term filter
      if (searchTerm) {
        filtered = filtered.filter(election => 
          election.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          election.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
          election.candidates.some(candidate => 
            candidate.toLowerCase().includes(searchTerm.toLowerCase())
          )
        );
      }
      
      // Apply status filter
      if (statusFilter !== 'all') {
        filtered = filtered.filter(election => {
          const statusNum = parseInt(statusFilter);
          return election.rawStatus === statusNum;
        });
      }
      
      setFilteredElections(filtered);
    } else {
      setFilteredElections(elections);
    }
  }, [elections, searchTerm, statusFilter]);

  const getStatusInfo = (election) => {
    const now = new Date();
    const startDate = new Date(election.startDate);
    const endDate = new Date(election.endDate);
    
    // If election is cancelled or finalized, use contract status
    if (election.rawStatus === 3) {
      return { text: 'Cancelled', variant: 'danger', canCancel: false, canEdit: false };
    }
    
    if (election.isFinalized) {
      return { text: 'Finalized', variant: 'info', canCancel: false, canEdit: false };
    }
    
    // Determine status based on current time
    if (now < startDate) {
      return { text: 'Upcoming', variant: 'secondary', canCancel: true, canEdit: true };
    } else if (now >= startDate && now <= endDate) {
      return { text: 'Active', variant: 'success', canCancel: true, canEdit: false };
    } else {
      return { text: 'Ended', variant: 'primary', canCancel: false, canEdit: false };
    }
  };

  // NEW: Unified action handler
  const handleAction = async (action, electionId) => {
    setActionLoading(action + electionId);
    try {
      if (action === 'cancel') {
        await cancelElection(electionId);
        toast.success(`Election #${electionId} has been canceled.`);
      } else if (action === 'finalize') {
        await finalizeElection(electionId);
        toast.success(`Election #${electionId} has been finalized.`);
      }
      
      // Refresh the elections list using the context function
      const updatedElections = await getElections();
      setElections(updatedElections);
      
    } catch (err) {
      toast.error(err.reason || err.message || 'An error occurred.');
      console.error(`Error performing action ${action}:`, err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleEditElection = (election) => {
    setSelectedElection(election);
    setShowEditModal(true);
  };

  const handleViewElection = (election) => {
    setSelectedElection(election);
    setShowViewModal(true);
  };

  const handleElectionUpdated = (updatedElection) => {
    setElections(elections.map(e => 
      e.id === updatedElection.id ? updatedElection : e
    ));
    setShowEditModal(false);
  };

  const formatDate = (date) => {
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  if (!showModal) return null;

  return (
    <>
      <Modal
        show={showModal}
        onHide={() => setShowModal(false)}
        centered
        backdrop="static"
        size="xl"
        scrollable
      >
        <Modal.Header closeButton={!loading}>
          <Modal.Title>📊 Manage Elections</Modal.Title>
        </Modal.Header>
        
        <Modal.Body>
          {error && (
            <Alert variant="danger" dismissible onClose={() => setError(null)}>
              <Alert.Heading>Error</Alert.Heading>
              {error}
              {error.includes('connect your wallet') && (
                <div className="mt-2">
                  <Button variant="outline-primary" size="sm" onClick={() => window.location.reload()}>
                    Refresh Page
                  </Button>
                </div>
              )}
            </Alert>
          )}

          {!isAdmin && account && (
            <Alert variant="warning">
              <strong>Admin Access Required</strong>
              <br />
              Only admin accounts can manage elections.
              <br />
              Connected: {account ? `${account.slice(0, 8)}...${account.slice(-6)}` : 'Not connected'}
            </Alert>
          )}

          {/* Search and Filter Section */}
          {elections.length > 0 && (
            <div className="row mb-3">
              <div className="col-md-6">
                <div className="input-group">
                  <span className="input-group-text">
                    <i className="bi bi-search"></i>
                  </span>
                  <Form.Control
                    type="text"
                    placeholder="Search elections by title, description, or candidates..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  {searchTerm && (
                    <Button
                      variant="outline-secondary"
                      onClick={() => setSearchTerm('')}
                    >
                      Clear
                    </Button>
                  )}
                </div>
              </div>
              <div className="col-md-6">
                <Form.Select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="all">All Statuses</option>
                  <option value="0">Upcoming</option>
                  <option value="1">Active</option>
                  <option value="2">Ended</option>
                  <option value="3">Cancelled</option>
                  <option value="finalized">Finalized</option>
                </Form.Select>
              </div>
            </div>
          )}

          {loading ? (
            <div className="text-center py-5">
              <Spinner animation="border" variant="primary" className="mb-3" />
              <p>Loading elections...</p>
            </div>
          ) : filteredElections.length === 0 ? (
            <div className="text-center py-5">
              <div className="text-muted mb-3">
                <i className="bi bi-search" style={{ fontSize: '3rem' }}></i>
              </div>
              <h5>No Elections Found</h5>
              <p className="text-muted">
                {searchTerm || statusFilter !== 'all' 
                  ? 'No elections match your search criteria.' 
                  : 'Create your first election to get started.'
                }
              </p>
              {(searchTerm || statusFilter !== 'all') && (
                <Button 
                  variant="outline-primary" 
                  onClick={() => {
                    setSearchTerm('');
                    setStatusFilter('all');
                  }}
                  className="me-2"
                >
                  Clear Filters
                </Button>
              )}
              <Button variant="primary" onClick={() => setShowModal(false)}>
                Create Election
              </Button>
            </div>
          ) : (
            <div className="table-responsive">
              <Table striped bordered hover className="align-middle">
                <thead className="table-dark">
                  <tr>
                    <th>ID</th>
                    <th>Title</th>
                    <th>Status</th>
                    <th>Period</th>
                    <th>Candidates</th>
                    <th>Votes</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredElections.map((election) => {
                    const statusInfo = getStatusInfo(election);
                    const isActive = statusInfo.text === 'Active';
                    
                    return (
                      <tr key={election.id} className={isActive ? 'table-success' : ''}>
                        <td>
                          <strong>#{election.id}</strong>
                        </td>
                        <td>
                          <div>
                            <strong>{election.title}</strong>
                            {election.description && (
                              <small className="d-block text-muted">
                                {election.description.length > 50 
                                  ? `${election.description.substring(0, 50)}...`
                                  : election.description
                                }
                              </small>
                            )}
                          </div>
                        </td>
                        <td>
                          <Badge bg={statusInfo.variant} className="fs-3">
                            {statusInfo.text}
                          </Badge>
                          {election.isFinalized && (
                            <Badge bg="info" className="ms-1">Finalized</Badge>
                          )}
                          {isActive && (
                            <div className="text-success small mt-1">
                              <i className="bi bi-circle-fill"></i> Live
                            </div>
                          )}
                        </td>
                        <td>
                          <small>
                            <div>Start: {formatDate(election.startDate)}</div>
                            <div>End: {formatDate(election.endDate)}</div>
                            {statusInfo.text === 'Upcoming' && (
                              <div className="text-warning small">
                                <i className="bi bi-clock"></i> Starts soon
                              </div>
                            )}
                          </small>
                        </td>
                        <td>
                          <small>
                            {election.candidates.slice(0, 3).map((candidate, index) => (
                              <Badge key={index} bg="light" text="dark" className="me-1 mb-1">
                                {candidate}
                              </Badge>
                            ))}
                            {election.candidates.length > 3 && (
                              <Badge bg="secondary">+{election.candidates.length - 3} more</Badge>
                            )}
                          </small>
                        </td>
                        <td>
                          <Badge bg="primary">{election.totalVotes}</Badge>
                        </td>
                        <td>
                          <div className="d-flex flex-wrap gap-1">
                            {statusInfo.canCancel && (
                              <Button
                                variant="danger"
                                size="sm"
                                onClick={() => handleAction('cancel', election.id)}
                                disabled={actionLoading === 'cancel' + election.id}
                              >
                                {actionLoading === 'cancel' + election.id ? (
                                  <Spinner animation="border" size="sm" />
                                ) : (
                                  'Cancel'
                                )}
                              </Button>
                            )}
                            
                            {statusInfo.text === 'Ended' && !election.isFinalized && (
                              <Button
                                variant="info"
                                size="sm"
                                onClick={() => handleAction('finalize', election.id)}
                                disabled={actionLoading === 'finalize' + election.id}
                              >
                                {actionLoading === 'finalize' + election.id ? (
                                  <Spinner animation="border" size="sm" />
                                ) : (
                                  'Finalize'
                                )}
                              </Button>
                            )}
                            
                            {statusInfo.canEdit && (
                              <Button
                                variant="warning"
                                size="sm"
                                onClick={() => handleEditElection(election)}
                              >
                                Edit
                              </Button>
                            )}
                            
                            <Button
                              variant="outline-info"
                              size="sm"
                              onClick={() => handleViewElection(election)}
                            >
                              View
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </Table>
              
              <Card className="mt-3">
                <Card.Body className="p-3">
                  <small className="text-muted">
                    <strong>Showing:</strong> {filteredElections.length} of {elections.length} Elections | 
                    <strong> Active:</strong> {filteredElections.filter(e => getStatusInfo(e).text === 'Active').length} | 
                    <strong> Ended:</strong> {filteredElections.filter(e => getStatusInfo(e).text === 'Ended').length} |
                    <strong> Finalized:</strong> {filteredElections.filter(e => e.isFinalized).length}
                  </small>
                </Card.Body>
              </Card>
            </div>
          )}
        </Modal.Body>
        
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)} disabled={loading}>
            Close
          </Button>
          <Button variant="primary" onClick={() => window.location.reload()} disabled={loading}>
            Refresh
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Edit Election Modal */}
      <EditElection
        showModal={showEditModal}
        setShowModal={setShowEditModal}
        election={selectedElection}
        onElectionUpdated={handleElectionUpdated}
      />

      {/* View Election Modal */}
      <Modal show={showViewModal} onHide={() => setShowViewModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>View Election #{selectedElection?.id}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedElection && (
            <div>
              <h5>{selectedElection.title}</h5>
              <p>{selectedElection.description}</p>
              
              <h6>Details:</h6>
              <ul>
                <li>Status: {getStatusInfo(selectedElection).text}</li>
                <li>Start: {formatDate(selectedElection.startDate)}</li>
                <li>End: {formatDate(selectedElection.endDate)}</li>
                <li>Total Votes: {selectedElection.totalVotes}</li>
                <li>Finalized: {selectedElection.isFinalized ? 'Yes' : 'No'}</li>
              </ul>
              
              <h6>Candidates:</h6>
              <ul>
                {selectedElection.candidates.map((candidate, index) => (
                  <li key={index}>{candidate}</li>
                ))}
              </ul>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowViewModal(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default ManageElections;