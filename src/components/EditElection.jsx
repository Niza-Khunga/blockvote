'use client';
import { useState, useEffect } from 'react';
import { Modal, Button, Form, InputGroup, Alert, Spinner, Row, Col } from 'react-bootstrap';
import { useElectionContext } from '../context/ElectionContext';
import { toast } from 'react-toastify';

const EditElection = ({ showModal, setShowModal, election, onElectionUpdated }) => {
  const { updateElection } = useElectionContext();
  
  const [formData, setFormData] = useState({
    title: '', description: '', candidates: [''], startDate: '', endDate: '',
  });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isElectionDefined, setIsElectionDefined] = useState(false);

  useEffect(() => {
    if (election && election.id) {
      setIsElectionDefined(true);
      setFormData({
        title: election.title || '',
        description: election.description || '',
        candidates: Array.isArray(election.candidates) ? [...election.candidates] : [''],
        startDate: election.startDate ? new Date(election.startDate).toISOString().slice(0, 16) : '',
        endDate: election.endDate ? new Date(election.endDate).toISOString().slice(0, 16) : '',
      });
    } else {
      setIsElectionDefined(false);
    }
  }, [election, showModal]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCandidateChange = (index, value) => {
    const newCandidates = [...formData.candidates];
    newCandidates[index] = value;
    setFormData({ ...formData, candidates: newCandidates });
  };

  const addCandidate = () => setFormData({ ...formData, candidates: [...formData.candidates, ''] });

  const removeCandidate = (index) => {
    if (formData.candidates.length > 2) {
      setFormData({ ...formData, candidates: formData.candidates.filter((_, i) => i !== index) });
    } else {
      toast.warn('An election must have at least two candidates.');
    }
  };

  // A dedicated helper function for frontend validation
  const validateForm = () => {
    const { title, candidates, startDate, endDate } = formData;
    
    if (!title.trim()) throw new Error('Election title is required.');

    const validCandidates = candidates.filter(c => c.trim() !== '');
    if (validCandidates.length < 2) throw new Error('At least two valid candidates are required.');

    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (start >= end) throw new Error('End date must be after the start date.');
    if (start < new Date()) throw new Error('The start date cannot be in the past.');

    return {
      title: title.trim(),
      description: formData.description.trim(),
      candidates: validCandidates,
      startTimestamp: Math.floor(start.getTime() / 1000),
      endTimestamp: Math.floor(end.getTime() / 1000)
    };
  };
  
  const handleElectionUpdate = async (e) => {
    e.preventDefault();
    setError(null);

    // Check if election is defined before proceeding
    if (!election || !election.id) {
      setError('Election data is not available. Please try again.');
      toast.error('Election data is not available.');
      return;
    }

    try {
      // 1. Validate the form data first
      const validatedData = validateForm();
      
      setLoading(true);

      // 2. Call the context function with the validated data
      await updateElection(election.id, validatedData);
      
      toast.success('Election has been successfully updated!');
      
      // Close the modal first
      setShowModal(false);
      
      // Then notify parent component to refresh with a slight delay
      setTimeout(() => {
        if (onElectionUpdated) {
          onElectionUpdated({
            ...election,
            title: validatedData.title,
            description: validatedData.description,
            candidates: validatedData.candidates,
            startDate: new Date(validatedData.startTimestamp * 1000),
            endDate: new Date(validatedData.endTimestamp * 1000)
          });
        }
      }, 100);

    } catch (err) {
      const errorMessage = err.reason || err.message || "Failed to update election.";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setShowModal(false);
      setError(null);
    }
  };

  // Don't render the modal if election is not defined or showModal is false
  if (!showModal || !isElectionDefined) return null;

  return (
    <Modal show={showModal} onHide={handleClose} centered backdrop="static" size="lg">
      <Modal.Header closeButton={!loading}>
        <Modal.Title>Edit Election #{election.id}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {error && <Alert variant="danger" onClose={() => setError(null)} dismissible>{error}</Alert>}
        
        <Form onSubmit={handleElectionUpdate}>
          <Form.Group className="mb-3">
            <Form.Label>Election Title *</Form.Label>
            <Form.Control type="text" name="title" value={formData.title} onChange={handleInputChange} required disabled={loading} />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Description *</Form.Label>
            <Form.Control as="textarea" rows={3} name="description" value={formData.description} onChange={handleInputChange} required disabled={loading} />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Candidates * (Minimum 2)</Form.Label>
            {formData.candidates.map((candidate, index) => (
              <InputGroup key={index} className="mb-2">
                <Form.Control type="text" placeholder={`Candidate ${index + 1}`} value={candidate} onChange={(e) => handleCandidateChange(index, e.target.value)} required disabled={loading} />
                {formData.candidates.length > 2 && (<Button variant="outline-danger" onClick={() => removeCandidate(index)} disabled={loading}>Remove</Button>)}
              </InputGroup>
            ))}
            <Button variant="outline-secondary" className="w-100" onClick={addCandidate} disabled={loading}>+ Add Candidate</Button>
          </Form.Group>
          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Start Date & Time *</Form.Label>
                <Form.Control type="datetime-local" name="startDate" value={formData.startDate} onChange={handleInputChange} required disabled={loading} min={new Date().toISOString().slice(0, 16)} />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>End Date & Time *</Form.Label>
                <Form.Control type="datetime-local" name="endDate" value={formData.endDate} onChange={handleInputChange} required disabled={loading} min={formData.startDate || new Date().toISOString().slice(0, 16)} />
              </Form.Group>
            </Col>
          </Row>
          <div className="d-grid mt-3">
            <Button variant="primary" type="submit" size="lg" disabled={loading}>
              {loading ? <><Spinner as="span" animation="border" size="sm" /> Updating...</> : 'Save Changes'}
            </Button>
          </div>
        </Form>
      </Modal.Body>
    </Modal>
  );
};

export default EditElection;