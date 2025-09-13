import { Container, Row, Col, Button } from 'react-bootstrap';
import Link from 'next/link';

export default function HowItWorks() {
  return (
    <div className="how-it-works">
      {/* Hero Section */}
      <section className="bg-dark text-light text-center py-4">
        <Container>
          <h1>How BlockVote Works</h1>
          <p className="lead">
            Discover how BlockVote leverages blockchain technology to deliver secure, transparent, and verifiable voting.
          </p>
        </Container>
      </section>

      {/* Process Section */}
      <section className="py-4">
        <Container>
          <h2 className="text-center mb-4">The Voting Process</h2>
          <Row>
            <Col md={6} className="mb-4">
              <h4>1. Connect Your Wallet</h4>
              <p>
                Start by connecting your cryptocurrency wallet to authenticate your identity. BlockVote uses blockchain-based wallet authentication to ensure only eligible voters can participate in the voting process.
              </p>
            </Col>
            <Col md={6} className="mb-4">
              <h4>2. Explore Available Elections</h4>
              <p>
                Navigate to the Elections page to view all ongoing and upcoming elections. Each election displays important details including candidates, voting periods, and current status.
              </p>
            </Col>
            <Col md={6} className="mb-4">
              <h4>3. Register to Vote</h4>
              <p>
                For each election you wish to participate in, complete the registration process. This ensures youre authorized to cast your vote in that specific election.
              </p>
            </Col>
            <Col md={6} className="mb-4">
              <h4>4. Cast Your Vote</h4>
              <p>
                Once registered, select your preferred candidate or option and submit your vote. Your vote is cryptographically signed and permanently recorded on the blockchain, ensuring it cannot be altered or duplicated.
              </p>
            </Col>
            <Col md={6} className="mb-4">
              <h4>5. Verify Your Vote</h4>
              <p>
                After voting, use the Verify Vote page to confirm your vote was recorded correctly. You can automatically verify votes from your history or manually verify using transaction details.
              </p>
            </Col>
            <Col md={6} className="mb-4">
              <h4>6. View Final Results</h4>
              <p>
                Once elections are finalized, visit the Results page to see the outcome. All results are aggregated directly from the blockchain, ensuring complete transparency and trust in the electoral process.
              </p>
            </Col>
          </Row>
        </Container>
      </section>

      {/* Why Blockchain Section */}
      <section className="bg-light text-center py-4">
        <Container>
          <h2 className="mb-4">Why Blockchain?</h2>
          <Row>
            <Col md={4} className="mb-3">
              <h4>Immutability</h4>
              <p>Once recorded, votes cannot be changed or deleted, guaranteeing the integrity of the election.</p>
            </Col>
            <Col md={4} className="mb-3">
              <h4>Decentralization</h4>
              <p>No single entity controls the voting process, reducing the risk of fraud or manipulation.</p>
            </Col>
            <Col md={4} className="mb-3">
              <h4>Transparency</h4>
              <p>All transactions are publicly verifiable on the blockchain, ensuring trust and accountability.</p>
            </Col>
          </Row>
        </Container>
      </section>

      {/* Call to Action */}
      <section className="text-center py-4">
        <Container>
          <h3>Ready to Vote Securely?</h3>
          <Button variant="primary" as={Link} href="/elections">
            Explore Elections
          </Button>
        </Container>
      </section>
    </div>
  );
}