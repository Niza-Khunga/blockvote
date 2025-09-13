'use client';
import { useState, useEffect } from 'react';
import { Container, Row, Col, Card, CardBody, CardTitle, CardText, Button } from 'react-bootstrap';
import Link from 'next/link';
import { useVotingContext } from '../context/VotingContext';

const Analytics = () => {
  const { contract } = useVotingContext();
  const [analyticsData, setAnalyticsData] = useState({
    voterTurnout: 0,
    activeElections: 0,
    registeredVoters: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAnalytics = async () => {
      if (!contract) {
        setError('Please connect your wallet to view analytics.');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        // Fetch total election count
        const electionCount = await contract.getElectionCount();
        let activeCount = 0;
        let totalVoterTurnout = 0;

        // Loop through elections to count active ones and aggregate voter turnout
        for (let i = 1; i <= electionCount; i++) {
          const details = await contract.getElectionDetails(i);
          if (details.status === 1) { // Assuming Status.Active = 1
            activeCount++;
          }
          const turnout = await contract.getVoterTurnout(i);
          totalVoterTurnout += turnout.toNumber();
        }

        // Placeholder for registered voters (requires contract function to track total registered voters)
        // For now, using a mock value; replace with actual contract call if available
        const registeredVoters = 2567; // TODO: Implement contract function if available

        setAnalyticsData({
          voterTurnout: totalVoterTurnout,
          activeElections: activeCount,
          registeredVoters,
        });
        setLoading(false);
      } catch (err) {
        setError('Failed to load analytics data. Please try again.');
        setLoading(false);
        console.error('Error fetching analytics:', err);
      }
    };

    fetchAnalytics();
  }, [contract]);

  if (loading) {
    return (
      <section className="bg-light py-5">
        <Container>
          <h2 className="text-center mb-5">System Analytics</h2>
          <p className="text-center">Loading analytics...</p>
        </Container>
      </section>
    );
  }

  if (error) {
    return (
      <section className="bg-light py-5">
        <Container>
          <h2 className="text-center mb-5">System Analytics</h2>
          <p className="text-center text-danger">{error}</p>
        </Container>
      </section>
    );
  }

  return (
    <section className="bg-light py-5">
      <Container>
        <h2 className="text-center mb-5">System Analytics</h2>
        <Row className="g-4">
          <Col xs={12} md={4}>
            <Card className="h-100 shadow-sm">
              <CardBody>
                <CardTitle>Voter Turnout</CardTitle>
                <CardText>
                  Track the number of voters participating in active elections.
                </CardText>
                <p className="display-6 text-center">{analyticsData.voterTurnout.toLocaleString()}</p>
                <Button variant="outline-primary" className="w-100 btn-animated" as={Link} href="/view-voter-turnout">
                  View Details
                </Button>
              </CardBody>
            </Card>
          </Col>
          <Col xs={12} md={4}>
            <Card className="h-100 shadow-sm">
              <CardBody>
                <CardTitle>Active Elections</CardTitle>
                <CardText>
                  Monitor the number of ongoing elections on the platform.
                </CardText>
                <p className="display-6 text-center">{analyticsData.activeElections}</p>
                <Button variant="outline-primary" className="w-100 btn-animated" as={Link} href="/view-active-elections">
                  View Details
                </Button>
              </CardBody>
            </Card>
          </Col>
          <Col xs={12} md={4}>
            <Card className="h-100 shadow-sm">
              <CardBody>
                <CardTitle>Registered Voters</CardTitle>
                <CardText>
                  View the total number of registered voters.
                </CardText>
                <p className="display-6 text-center">{analyticsData.registeredVoters.toLocaleString()}</p>
                <Button variant="outline-primary" className="w-100 btn-animated" as={Link} href="/view-registered-voters">
                  View Details
                </Button>
              </CardBody>
            </Card>
          </Col>
        </Row>
      </Container>
    </section>
  );
};

export default Analytics;