'use client';
import { useState } from 'react';
import { Modal, Button, Form, InputGroup, Alert } from 'react-bootstrap';
import { useVotingContext } from '../context/VotingContext';
import { toast } from 'react-toastify';

const CreateElection = ({ showModal, setShowModal }) => {
  const { votingContract, account, isAdmin } = useVotingContext();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    candidates: [''],
    startDate: '',
    endDate: '',
    eligibility: '',
  });
  const [electionDetails, setElectionDetails] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleCandidateChange = (index, value) => {
    const newCandidates = [...formData.candidates];
    newCandidates[index] = value;
    setFormData({ ...formData, candidates: newCandidates });
  };

  const addCandidate = () => {
    setFormData({ ...formData, candidates: [...formData.candidates, ''] });
  };

  const removeCandidate = (index) => {
    if (formData.candidates.length > 1) {
      setFormData({
        ...formData,
        candidates: formData.candidates.filter((_, i) => i !== index),
      });
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const validateForm = () => {
    if (!votingContract || !account) {
      throw new Error('Please connect your wallet to create an election.');
    }

    if (!isAdmin) {
      throw new Error('Only admin accounts can create elections.');
    }

    if (!formData.title.trim()) {
      throw new Error('Election title is required.');
    }

    if (!formData.description.trim()) {
      throw new Error('Election description is required.');
    }

    const validCandidates = formData.candidates.filter(c => c.trim() !== '');
    if (validCandidates.length < 2) {
      throw new Error('At least two valid candidates are required.');
    }

    if (!formData.startDate || !formData.endDate) {
      throw new Error('Both start and end dates are required.');
    }

    const startDate = new Date(formData.startDate);
    const endDate = new Date(formData.endDate);
    const now = new Date();

    if (startDate >= endDate) {
      throw new Error('End date must be after start date.');
    }

    if (startDate < now) {
      throw new Error('Start date cannot be in the past.');
    }

    return {
      title: formData.title.trim(),
      description: formData.description.trim(),
      candidates: [...validCandidates], // Create fresh array to avoid read-only issues
      startTimestamp: Math.floor(startDate.getTime() / 1000),
      endTimestamp: Math.floor(endDate.getTime() / 1000)
    };
  };

  const handleElectionCreation = async (e) => {
    e.preventDefault();
    
    if (!votingContract || !account) {
      toast.error('Please connect your wallet to create an election.');
      setError('Please connect your wallet to create an election.');
      return;
    }

    if (!isAdmin) {
      toast.error('Only admin accounts can create elections.');
      setError('Only admin accounts can create elections.');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Validate form data
      const validatedData = validateForm();

      // Convert to BigInt for the contract call
      const merkleRoot = '0x0000000000000000000000000000000000000000000000000000000000000000';
      
      // Create a fresh copy of candidates array to avoid read-only issues
      const freshCandidates = [...validatedData.candidates];
      
      const txn = await votingContract.createElection(
        validatedData.title,
        validatedData.description,
        freshCandidates, // Use the fresh array copy
        BigInt(validatedData.startTimestamp),
        BigInt(validatedData.endTimestamp),
        merkleRoot,
        { gasLimit: 1000000 } // Add gas limit to prevent estimation issues
      );

      // Wait for transaction confirmation
      const receipt = await txn.wait();
      
      toast.success('Election has been successfully created!');
      
      // Get the election ID from the event logs
      let electionId = null;
      if (receipt.logs) {
        // Parse the event logs to find the ElectionCreated event
        for (const log of receipt.logs) {
          try {
            const parsedLog = votingContract.interface.parseLog(log);
            if (parsedLog && parsedLog.name === 'ElectionCreated') {
              electionId = parsedLog.args.electionId.toString();
              break;
            }
          } catch (e) {
            // Continue checking other logs
            continue;
          }
        }
      }

      // Reset form
      setFormData({
        title: '',
        description: '',
        candidates: [''],
        startDate: '',
        endDate: '',
        eligibility: '',
      });

      setElectionDetails({
        id: electionId || 'unknown',
        title: validatedData.title,
        startDate: new Date(validatedData.startTimestamp * 1000).toLocaleString(),
        endDate: new Date(validatedData.endTimestamp * 1000).toLocaleString()
      });

      setShowModal(false);
      
      // Optional: reload the page to refresh election lists
      setTimeout(() => window.location.reload(), 2000);

    } catch (error) {
      console.error('Error creating election:', error);
      let errorMessage = error.message || 'Failed to create election. Please try again.';
      
      // Enhanced error parsing
      if (error.reason) {
        errorMessage = error.reason;
      } else if (error.data?.message) {
        errorMessage = error.data.message;
      } else if (error.info?.error?.message) {
        errorMessage = error.info.error.message;
      }
      
      toast.error(errorMessage);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setShowModal(false);
      setError(null);
      setElectionDetails(null);
    }
  };

  return (
    <Modal
      show={showModal}
      onHide={handleClose}
      centered
      backdrop="static"
      size="lg"
    >
      <Modal.Header closeButton={!loading}>
        <Modal.Title>Create New Election</Modal.Title>
      </Modal.Header>
      
      <Modal.Body>
        {error && (
          <Alert variant="danger" dismissible onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {electionDetails && (
          <Alert variant="success">
            <strong>Election Created Successfully!</strong>
            <br />
            Title: {electionDetails.title}
            <br />
            ID: {electionDetails.id}
            <br />
            Start: {electionDetails.startDate}
            <br />
            End: {electionDetails.endDate}
          </Alert>
        )}

        {!isAdmin && account && (
          <Alert variant="warning">
            <strong>Admin Access Required</strong>
            <br />
            Only admin accounts can create elections. Your connected account does not have admin privileges.
          </Alert>
        )}

        <Form onSubmit={handleElectionCreation}>
          <Form.Group className="mb-3">
            <Form.Label>Election Title *</Form.Label>
            <Form.Control
              type="text"
              name="title"
              placeholder="Enter election title"
              value={formData.title}
              onChange={handleInputChange}
              required
              disabled={loading || !isAdmin}
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Description *</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              name="description"
              placeholder="Enter election description"
              value={formData.description}
              onChange={handleInputChange}
              required
              disabled={loading || !isAdmin}
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Candidates * (Minimum 2)</Form.Label>
            {formData.candidates.map((candidate, index) => (
              <InputGroup key={index} className="mb-2">
                <Form.Control
                  type="text"
                  placeholder={`Candidate ${index + 1} Name`}
                  value={candidate}
                  onChange={(e) => handleCandidateChange(index, e.target.value)}
                  required
                  disabled={loading || !isAdmin}
                />
                {formData.candidates.length > 1 && (
                  <Button
                    variant="outline-danger"
                    onClick={() => removeCandidate(index)}
                    disabled={loading || !isAdmin}
                  >
                    Remove
                  </Button>
                )}
              </InputGroup>
            ))}
            <Button
              variant="outline-primary"
              className="w-100"
              onClick={addCandidate}
              disabled={loading || !isAdmin || formData.candidates.length >= 10}
            >
              + Add Candidate
            </Button>
            <Form.Text className="text-muted">
              {formData.candidates.filter(c => c.trim() !== '').length} valid candidates
            </Form.Text>
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Start Date & Time *</Form.Label>
            <Form.Control
              type="datetime-local"
              name="startDate"
              value={formData.startDate}
              onChange={handleInputChange}
              required
              disabled={loading || !isAdmin}
              min={new Date().toISOString().slice(0, 16)}
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>End Date & Time *</Form.Label>
            <Form.Control
              type="datetime-local"
              name="endDate"
              value={formData.endDate}
              onChange={handleInputChange}
              required
              disabled={loading || !isAdmin}
              min={formData.startDate || new Date().toISOString().slice(0, 16)}
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Voter Eligibility Criteria (Optional)</Form.Label>
            <Form.Control
              type="text"
              name="eligibility"
              placeholder="e.g., Specific wallet addresses, roles, etc."
              value={formData.eligibility}
              onChange={handleInputChange}
              disabled={loading || !isAdmin}
            />
            <Form.Text className="text-muted">
              Note: You'll need to set voter eligibility separately after creating the election.
            </Form.Text>
          </Form.Group>

          <div className="d-grid gap-2">
            <Button
              variant="primary"
              type="submit"
              size="lg"
              disabled={loading || !isAdmin}
            >
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" />
                  Creating Election...
                </>
              ) : (
                'Create Election'
              )}
            </Button>
            
            <Button
              variant="outline-secondary"
              onClick={handleClose}
              disabled={loading}
            >
              Cancel
            </Button>
          </div>
        </Form>
      </Modal.Body>
    </Modal>
  );
};

export default CreateElection;