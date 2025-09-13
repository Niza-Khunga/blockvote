'use client';
import { useState, useEffect } from 'react';
import { Modal, Button, Form, Table, Alert, Spinner, Badge, Row, Col } from 'react-bootstrap';
import { ethers } from 'ethers';
import { useVotingContext } from '@/context/VotingContext';

const ManageUsers = ({ showModal, setShowModal }) => {
  const { votingContract, account, isAdmin } = useVotingContext();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [newAddress, setNewAddress] = useState('');
  const [role, setRole] = useState('admin'); // 'admin' or 'auditor'
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (showModal && isAdmin) {
      fetchUsers();
    }
  }, [showModal, isAdmin]);

  const fetchUsers = async () => {
    if (!votingContract) return;
    
    setLoading(true);
    try {
      console.log('Fetching admins...');
      const adminAddresses = await votingContract.getAdmins();
      console.log('Admins fetched:', adminAddresses);
      
      const admins = await Promise.all(adminAddresses.map(async (addr) => {
        try {
          const isHardcoded = await votingContract.isHardcodedAdmin(addr);
          return {
            address: addr,
            role: 'admin',
            isHardcoded: isHardcoded,
            removable: !isHardcoded && addr !== account
          };
        } catch (error) {
          console.error(`Error checking hardcoded status for ${addr}:`, error);
          return {
            address: addr,
            role: 'admin',
            isHardcoded: false,
            removable: addr !== account
          };
        }
      }));

      console.log('Fetching auditors...');
      const auditorAddresses = await votingContract.getAuditors();
      console.log('Auditors fetched:', auditorAddresses);
      
      const auditors = await Promise.all(auditorAddresses.map(async (addr) => {
        try {
          const isHardcoded = await votingContract.isHardcodedAuditor(addr);
          return {
            address: addr,
            role: 'auditor',
            isHardcoded: isHardcoded,
            removable: !isHardcoded
          };
        } catch (error) {
          console.error(`Error checking hardcoded status for ${addr}:`, error);
          return {
            address: addr,
            role: 'auditor',
            isHardcoded: false,
            removable: true
          };
        }
      }));

      setUsers([...admins, ...auditors]);
    } catch (error) {
      console.error('Error fetching users:', error);
      setError('Failed to fetch users: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const addUser = async () => {
    if (!newAddress || !role) {
      setError('Please fill all fields');
      return;
    }

    // Basic address validation
    if (!ethers.isAddress(newAddress)) {
      setError('Please enter a valid Ethereum address');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      console.log('Adding user:', { address: newAddress, role });
      
      // Check if the address is hardcoded
      const isHardcodedAdmin = await votingContract.isHardcodedAdmin(newAddress);
      const isHardcodedAuditor = await votingContract.isHardcodedAuditor(newAddress);
      
      if (isHardcodedAdmin || isHardcodedAuditor) {
        throw new Error('Cannot modify roles of hardcoded addresses');
      }

      // Check current role
      const currentRole = await votingContract.getRole(newAddress);
      console.log('Current role of address:', currentRole);
      
      // Convert to numbers for comparison
      const currentRoleNum = Number(currentRole);
      const targetRoleNum = role === 'admin' ? 2 : 1;
      
      if (currentRoleNum === targetRoleNum) {
        throw new Error('Address already has this role');
      }

      console.log('Calling assignRole with:', { address: newAddress, roleValue: targetRoleNum });
      
      const tx = await votingContract.assignRole(
        newAddress, 
        targetRoleNum, 
        { gasLimit: 500000 }
      );
      
      console.log('Transaction sent:', tx.hash);
      setSuccess(`Transaction sent: ${tx.hash}. Waiting for confirmation...`);
      
      const receipt = await tx.wait();
      console.log('Transaction confirmed:', receipt);
      
      setSuccess(`${role.charAt(0).toUpperCase() + role.slice(1)} added successfully`);
      setNewAddress('');
      
      // Refresh the list after a short delay
      setTimeout(() => fetchUsers(), 2000);
      
    } catch (error) {
      console.error('Error adding user:', error);
      
      // Handle specific error cases
      if (error.reason) {
        setError('Failed to add user: ' + error.reason);
      } else if (error.message) {
        setError('Failed to add user: ' + error.message);
      } else {
        setError('Failed to add user: Unknown error occurred');
      }
    } finally {
      setLoading(false);
    }
  };

  const removeUser = async (address, userRole) => {
    if (!window.confirm(`Are you sure you want to remove this ${userRole}?`)) return;

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      console.log('Removing user:', { address, userRole });
      
      let tx;
      if (userRole === 'admin') {
        // Check if hardcoded
        const isHardcoded = await votingContract.isHardcodedAdmin(address);
        if (isHardcoded) {
          throw new Error('Cannot remove hardcoded admin');
        }
        
        // Check current role
        const currentRole = await votingContract.getRole(address);
        if (Number(currentRole) !== 2) {
          throw new Error('Address is not an admin');
        }
        
        tx = await votingContract.removeAdmin(address, { gasLimit: 500000 });
      } else if (userRole === 'auditor') {
        // Check if hardcoded
        const isHardcoded = await votingContract.isHardcodedAuditor(address);
        if (isHardcoded) {
          throw new Error('Cannot remove hardcoded auditor');
        }
        
        // Check current role
        const currentRole = await votingContract.getRole(address);
        if (Number(currentRole) !== 1) {
          throw new Error('Address is not an auditor');
        }
        
        tx = await votingContract.removeAuditor(address, { gasLimit: 500000 });
      }
      
      console.log('Transaction sent:', tx.hash);
      setSuccess(`Transaction sent: ${tx.hash}. Waiting for confirmation...`);
      
      const receipt = await tx.wait();
      console.log('Transaction confirmed:', receipt);
      
      setSuccess(`${userRole.charAt(0).toUpperCase() + userRole.slice(1)} removed successfully`);
      
      // Refresh the list after a short delay
      setTimeout(() => fetchUsers(), 2000);
      
    } catch (error) {
      console.error('Error removing user:', error);
      
      if (error.reason) {
        setError('Failed to remove user: ' + error.reason);
      } else if (error.message) {
        setError('Failed to remove user: ' + error.message);
      } else {
        setError('Failed to remove user: Unknown error occurred');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setShowModal(false);
    setError('');
    setSuccess('');
    setNewAddress('');
  };

  const getRoleBadgeVariant = (role, isHardcoded) => {
    if (isHardcoded) {
      return role === 'admin' ? 'primary' : 'info';
    }
    return role === 'admin' ? 'success' : 'warning';
  };

  const getRoleDisplayName = (role, isHardcoded) => {
    return isHardcoded ? `Hardcoded ${role}` : role;
  };

  return (
    <Modal show={showModal} onHide={handleClose} size="lg">
      <Modal.Header closeButton>
        <Modal.Title>Manage Users</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {!isAdmin && (
          <Alert variant="warning">Admin access required to manage users.</Alert>
        )}

        {isAdmin && (
          <>
            {error && <Alert variant="danger">{error}</Alert>}
            {success && <Alert variant="success">{success}</Alert>}

            <h5>Add New User</h5>
            <Form className="mb-4">
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Wallet Address</Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="0x..."
                      value={newAddress}
                      onChange={(e) => setNewAddress(e.target.value)}
                    />
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group className="mb-3">
                    <Form.Label>Role</Form.Label>
                    <Form.Select
                      value={role}
                      onChange={(e) => setRole(e.target.value)}
                    >
                      <option value="admin">Admin</option>
                      <option value="auditor">Auditor</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={2} className="d-flex align-items-end">
                  <Button 
                    variant="primary" 
                    onClick={addUser}
                    disabled={loading}
                  >
                    {loading ? <Spinner size="sm" /> : 'Add'}
                  </Button>
                </Col>
              </Row>
            </Form>

            <h5>Current Users</h5>
            {loading ? (
              <div className="text-center">
                <Spinner animation="border" />
              </div>
            ) : users.length === 0 ? (
              <Alert variant="info">No users found</Alert>
            ) : (
              <Table striped bordered hover>
                <thead>
                  <tr>
                    <th>Address</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user, index) => (
                    <tr key={index}>
                      <td>
                        <small>{user.address}</small>
                        {user.address === account && (
                          <div>
                            <Badge bg="secondary" className="ms-1">Current User</Badge>
                          </div>
                        )}
                      </td>
                      <td>
                        <Badge bg={getRoleBadgeVariant(user.role, user.isHardcoded)}>
                          {getRoleDisplayName(user.role, user.isHardcoded)}
                        </Badge>
                      </td>
                      <td>
                        {user.isHardcoded ? (
                          <Badge bg="dark">Protected</Badge>
                        ) : (
                          <Badge bg="light" text="dark">Removable</Badge>
                        )}
                      </td>
                      <td>
                        {user.removable ? (
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => removeUser(user.address, user.role)}
                            disabled={loading}
                          >
                            Remove
                          </Button>
                        ) : (
                          <Button
                            variant="outline-secondary"
                            size="sm"
                            disabled
                            title={user.isHardcoded ? "Hardcoded users cannot be removed" : "Cannot remove yourself"}
                          >
                            Protected
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            )}

            <Alert variant="info" className="mt-3">
              <strong>Note:</strong> Hardcoded admins and auditors are protected and cannot be removed. 
              These addresses are permanently set in the contract for system security.
            </Alert>
          </>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={handleClose}>
          Close
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default ManageUsers;