'use client';
import { useState, useEffect, useCallback } from 'react';
import { Modal, Button, Form, Table, Alert, Badge, Spinner, Card, Row, Col } from 'react-bootstrap';
import { useVotingContext } from '@/context/VotingContext';
import { useElectionContext } from '@/context/ElectionContext';
import { ethers } from 'ethers';
import { toast } from 'react-toastify';

const ManageVoters = ({ showModal, setShowModal }) => {
  const { votingContract, isAdmin } = useVotingContext();
  const { elections, getElections } = useElectionContext();
  
  const [approvedVoters, setApprovedVoters] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('view');
  const [selectedElection, setSelectedElection] = useState('');
  
  // State for the forms
  const [voterAddress, setVoterAddress] = useState('');
  const [merkleRoot, setMerkleRoot] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch elections when the modal is shown
  useEffect(() => {
    if (showModal && isAdmin) {
      getElections();
    }
  }, [showModal, isAdmin, getElections]);

  // Fetch the list of approved voters when an election is selected
  const fetchVotersForElection = useCallback(async () => {
    if (!votingContract || !selectedElection) {
      setApprovedVoters([]);
      return;
    }
    setLoading(true);
    try {
      const voterList = await votingContract.getApprovedVoters(selectedElection);
      setApprovedVoters(voterList);
    } catch (err) {
      console.error('Error fetching voters:', err);
      toast.error('Could not fetch the voter list for this election.');
    } finally {
      setLoading(false);
    }
  }, [votingContract, selectedElection]);

  useEffect(() => {
    fetchVotersForElection();
  }, [selectedElection, fetchVotersForElection]);

  const isValidAddress = (address) => ethers.isAddress(address);

  const handleAdminRegister = async (e) => {
    e.preventDefault();
    if (!isValidAddress(voterAddress)) return toast.error('Invalid Ethereum address.');
    
    setLoading(true);
    try {
      const tx = await votingContract.adminRegisterVoter(selectedElection, voterAddress);
      await tx.wait();
      toast.success(`Voter ${voterAddress.slice(0, 6)}... registered successfully!`);
      setVoterAddress('');
      fetchVotersForElection(); // Refresh list
    } catch (err) {
      toast.error(err.reason || 'Failed to register voter.');
    } finally {
      setLoading(false);
    }
  };

  const handleRevokeVoter = async (addressToRevoke) => {
    setLoading(true);
    try {
      const tx = await votingContract.setVoterEligibility(selectedElection, addressToRevoke, false);
      await tx.wait();
      toast.success(`Voter ${addressToRevoke.slice(0, 6)}... has been revoked.`);
      fetchVotersForElection(); // Refresh list
    } catch (err) {
      toast.error(err.reason || 'Failed to revoke voter.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateMerkleRoot = async (e) => {
    e.preventDefault();
    if (!merkleRoot.startsWith('0x') || merkleRoot.length !== 66) {
      return toast.error('Invalid Merkle root format.');
    }
    
    setLoading(true);
    try {
      const tx = await votingContract.updateMerkleRoot(selectedElection, merkleRoot);
      await tx.wait();
      toast.success('Merkle root updated successfully!');
      setMerkleRoot('');
    } catch (err) {
      toast.error(err.reason || 'Failed to update Merkle root.');
    } finally {
      setLoading(false);
    }
  };
  
  const getStatusInfo = (election) => {
    const now = new Date();
    if (election.rawStatus === 3) return { text: 'Canceled', variant: 'danger' };
    if (election.isFinalized) return { text: 'Finalized', variant: 'dark' };
    if (now < election.startDate) return { text: 'Upcoming', variant: 'warning' };
    if (now >= election.startDate && now <= election.endDate) return { text: 'Active', variant: 'success' };
    if (now > election.endDate) return { text: 'Ended', variant: 'secondary' };
    return { text: 'Unknown', variant: 'light' };
  };

  const filteredVoters = approvedVoters.filter(address =>
    address.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Modal show={showModal} onHide={() => setShowModal(false)} centered backdrop="static" size="xl" scrollable>
      <Modal.Header closeButton={loading}><Modal.Title>👥 Voter Management</Modal.Title></Modal.Header>
      <Modal.Body>
        {error && <Alert variant="danger" dismissible onClose={() => setError(null)}>{error}</Alert>}
        
        <Card className="mb-4">
          <Card.Header><h6 className="mb-0">Select Election to Manage</h6></Card.Header>
          <Card.Body>
            <Form.Select value={selectedElection} onChange={(e) => setSelectedElection(e.target.value)} disabled={loading}>
              <option value="">Choose an election...</option>
              {elections.map(e => (<option key={e.id} value={e.id}>#{e.id} - {e.title}</option>))}
            </Form.Select>
          </Card.Body>
        </Card>

        {selectedElection && (
          <>
            <div className="mb-4 d-flex border-bottom">
              <Button variant={activeTab === 'view' ? 'primary' : 'outline-primary'} className="rounded-0 border-0" onClick={() => setActiveTab('view')}>View Voters ({approvedVoters.length})</Button>
              <Button variant={activeTab === 'manage' ? 'primary' : 'outline-primary'} className="rounded-0 border-0" onClick={() => setActiveTab('manage')}>Add / Revoke</Button>
              <Button variant={activeTab === 'merkle' ? 'primary' : 'outline-primary'} className="rounded-0 border-0" onClick={() => setActiveTab('merkle')}>Merkle Root</Button>
            </div>

            {activeTab === 'view' && (
              <Card><Card.Header>
                  <Row><Col><h6 className="mb-0">Approved Voters for Election #{selectedElection}</h6></Col>
                  <Col><Form.Control type="text" placeholder="Search address..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} size="sm" /></Col></Row>
              </Card.Header><Card.Body>
                {loading ? <div className="text-center"><Spinner animation="border" /></div> : 
                  filteredVoters.length === 0 ? <p className="text-muted text-center">No approved voters found for this election.</p> :
                  <Table striped bordered hover responsive>
                    <thead><tr><th>Wallet Address</th><th>Action</th></tr></thead>
                    <tbody>{filteredVoters.map((address) => (
                        <tr key={address}>
                          <td className="font-monospace">{address}</td>
                          <td><Button variant="outline-danger" size="sm" onClick={() => handleRevokeVoter(address)} disabled={loading}>Revoke</Button></td>
                        </tr>
                    ))}</tbody>
                  </Table>}
              </Card.Body></Card>
            )}

            {activeTab === 'manage' && (
              <Row>
                <Col md={6}><Card><Card.Header><h6 className="mb-0">Manually Register Voter</h6></Card.Header><Card.Body>
                  <Form onSubmit={handleAdminRegister}>
                    <Form.Group><Form.Label>Voter Wallet Address</Form.Label><Form.Control type="text" placeholder="0x..." value={voterAddress} onChange={(e) => setVoterAddress(e.target.value)} disabled={loading} /></Form.Group>
                    <Button type="submit" variant="primary" className="mt-3" disabled={loading || !voterAddress}>Register Voter</Button>
                  </Form>
                </Card.Body></Card></Col>
                <Col md={6}><Card><Card.Header><h6 className="mb-0">Revoke Voter Registration</h6></Card.Header><Card.Body>
                  <Form onSubmit={(e) => { e.preventDefault(); handleRevokeVoter(voterAddress);}}>
                    <Form.Group><Form.Label>Voter Wallet Address</Form.Label><Form.Control type="text" placeholder="0x..." value={voterAddress} onChange={(e) => setVoterAddress(e.target.value)} disabled={loading} /></Form.Group>
                    <Button type="submit" variant="danger" className="mt-3" disabled={loading || !voterAddress}>Revoke Voter</Button>
                  </Form>
                </Card.Body></Card></Col>
              </Row>
            )}

            {activeTab === 'merkle' && (
              <Card><Card.Header><h6 className="mb-0">Update Merkle Root</h6></Card.Header><Card.Body>
                <Form onSubmit={handleUpdateMerkleRoot}>
                  <Form.Group><Form.Label>Merkle Root Hash</Form.Label><Form.Control type="text" placeholder="0x..." value={merkleRoot} onChange={(e) => setMerkleRoot(e.target.value)} disabled={loading} /></Form.Group>
                  <Button type="submit" variant="primary" className="mt-3" disabled={loading || !merkleRoot}>Update Merkle Root</Button>
                </Form>
                <Alert variant="info" className="mt-3 small">This allows you to set a whitelist of eligible voters for this election. This should be done before the election starts.</Alert>
              </Card.Body></Card>
            )}
          </>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={() => setShowModal(false)} disabled={loading}>Close</Button>
      </Modal.Footer>
    </Modal>
  );
};

export default ManageVoters;