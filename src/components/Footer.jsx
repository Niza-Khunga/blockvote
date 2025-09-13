'use client';
import React from 'react';
import { Container, Row, Col, Nav } from 'react-bootstrap';
import Link from 'next/link';

const Footer = () => {
  return (
    <footer className="bg-dark text-light py-4 mt-auto">
      <Container>
        <Row>
          {/* Branding and Description */}
          <Col md={4} className="mb-3">
            <h5>BlockVote</h5>
            <p>Secure, transparent, and decentralized voting system powered by blockchain technology.</p>
          </Col>

          {/* Quick Links */}
          <Col md={4} className="mb-3">
            <h5>Quick Links</h5>
            <Nav className="flex-column">
              <Nav.Link as={Link} href="/" className="text-light">
                Home
              </Nav.Link>
              <Nav.Link as={Link} href="/how-it-works" className="text-light">
                How It Works
              </Nav.Link>
              <Nav.Link as={Link} href="/faq" className="text-light">
                FAQ
              </Nav.Link>
              <Nav.Link as={Link} href="/elections" className="text-light">
                Elections
              </Nav.Link>
              <Nav.Link as={Link} href="/results" className="text-light">
                Results
              </Nav.Link>
              <Nav.Link as={Link} href="/verify-vote" className="text-light">
                Verify Vote
              </Nav.Link>
            </Nav>
          </Col>

          {/* Contact Information */}
          <Col md={4} className="mb-3">
            <h5>Contact</h5>
            <p>
              University of Zambia<br />
              School of Natural and Applied Sciences<br />
              Department of Computing and Informatics
            </p>
          </Col>
        </Row>

        {/* Copyright and Credits */}
        <Row className="text-center mt-3">
          <Col>
            <p>
              &copy; 2025 BlockVote. All rights reserved.<br />
              Developed by Niza Khunga (2021503321), Faith Mayani (2021538354), Enala Saishi (2021463711)
            </p>
          </Col>
        </Row>
      </Container>
    </footer>
  );
};

export default Footer;