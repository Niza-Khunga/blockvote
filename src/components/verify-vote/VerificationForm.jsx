'use client';
import { useState } from 'react';
import { Form, Button, Card, Row, Col, Spinner } from 'react-bootstrap';

const VerificationForm = ({ onVerify, loading }) => {
  const [formData, setFormData] = useState({
    electionId: '',
    voterAddress: '',
    candidate: '',
    encryptedVote: '',
    nonce: '',
    previousBlockHash: '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onVerify(formData);
  };

  return (
    <Card className="shadow-sm">
      <Card.Body>
        <Card.Title className="mb-4">Enter Vote Details</Card.Title>
        <Form onSubmit={handleSubmit}>
          <Row>
            <Col md={6}>
              <Form.Group className="mb-3" controlId="electionId">
                <Form.Label>Election ID</Form.Label>
                <Form.Control
                  type="number"
                  name="electionId"
                  value={formData.electionId}
                  onChange={handleChange}
                  placeholder="e.g., 1"
                  required
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3" controlId="voterAddress">
                <Form.Label>Voter Address</Form.Label>
                <Form.Control
                  type="text"
                  name="voterAddress"
                  value={formData.voterAddress}
                  onChange={handleChange}
                  placeholder="0x..."
                  required
                />
              </Form.Group>
            </Col>
          </Row>
          
          <Form.Group className="mb-3" controlId="candidate">
            <Form.Label>Candidate Name</Form.Label>
            <Form.Control
              type="text"
              name="candidate"
              value={formData.candidate}
              onChange={handleChange}
              placeholder="e.g., John Doe"
              required
            />
          </Form.Group>

          <Form.Group className="mb-3" controlId="encryptedVote">
            <Form.Label>Encrypted Vote Hash</Form.Label>
            <Form.Control
              type="text"
              name="encryptedVote"
              value={formData.encryptedVote}
              onChange={handleChange}
              placeholder="0x..."
              required
            />
          </Form.Group>

          <Row>
            <Col md={6}>
              <Form.Group className="mb-3" controlId="nonce">
                <Form.Label>Nonce</Form.Label>
                <Form.Control
                  type="number"
                  name="nonce"
                  value={formData.nonce}
                  onChange={handleChange}
                  placeholder="A number used once"
                  required
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3" controlId="previousBlockHash">
                <Form.Label>Previous Block Hash</Form.Label>
                <Form.Control
                  type="text"
                  name="previousBlockHash"
                  value={formData.previousBlockHash}
                  onChange={handleChange}
                  placeholder="0x..."
                  required
                />
              </Form.Group>
            </Col>
          </Row>

          <div className="d-grid">
            <Button variant="primary" type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Spinner animation="border" size="sm" className="me-2" />
                  Verifying...
                </>
              ) : (
                'Verify Vote'
              )}
            </Button>
          </div>
        </Form>
      </Card.Body>
    </Card>
  );
};

export default VerificationForm;