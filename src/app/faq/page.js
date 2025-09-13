import { Container, Accordion, AccordionItem, AccordionHeader, AccordionBody } from 'react-bootstrap';

// Debug imports
console.log('Container:', Container);
console.log('Accordion:', Accordion);
console.log('AccordionItem:', AccordionItem);
console.log('AccordionHeader:', AccordionHeader);
console.log('AccordionBody:', AccordionBody);

export default function FAQ() {
  return (
    <Container className="py-4">
      <h1 className="text-center mb-4">Frequently Asked Questions</h1>
      <p className="text-center mb-4">
        Find answers to common questions about BlockVote, our secure and transparent blockchain-based voting system.
      </p>
      <Accordion defaultActiveKey="0">
        <AccordionItem eventKey="0">
          <AccordionHeader>What is BlockVote?</AccordionHeader>
          <AccordionBody>
            BlockVote is a decentralized voting platform that uses blockchain technology to ensure secure, transparent, and verifiable elections. It eliminates central points of failure and protects votes from tampering.
          </AccordionBody>
        </AccordionItem>
        <AccordionItem eventKey="1">
          <AccordionHeader>How does blockchain ensure secure voting?</AccordionHeader>
          <AccordionBody>
            Blockchain technology creates an immutable ledger where each vote is cryptographically secured. Once recorded, votes cannot be altered or deleted, ensuring integrity and transparency in the voting process.
          </AccordionBody>
        </AccordionItem>
        <AccordionItem eventKey="2">
          <AccordionHeader>How can I verify my vote?</AccordionHeader>
          <AccordionBody>
            After voting, you receive a unique transaction ID. You can use the Verify Vote page to check this ID against the blockchain ledger to confirm your vote was recorded accurately.
          </AccordionBody>
        </AccordionItem>
        <AccordionItem eventKey="3">
          <AccordionHeader>Who can vote using BlockVote?</AccordionHeader>
          <AccordionBody>
            BlockVote is designed for registered voters in supported elections. You need a compatible cryptocurrency wallet to participate, ensuring secure authentication via blockchain.
          </AccordionBody>
        </AccordionItem>
        <AccordionItem eventKey="4">
          <AccordionHeader>What is the Voter Dashboard?</AccordionHeader>
          <AccordionBody>
            The Voter Dashboard allows you to view your voting history, check upcoming elections, and manage your voting preferences securely within the BlockVote platform.
          </AccordionBody>
        </AccordionItem>
        <AccordionItem eventKey="5">
          <AccordionHeader>How do I contact support?</AccordionHeader>
          <AccordionBody>
            For support, contact the University of Zambia, School of Natural and Applied Sciences, Department of Computing and Informatics. More details are available in the footer of our website.
          </AccordionBody>
        </AccordionItem>
        <AccordionItem eventKey="6">
          <AccordionHeader>How are election results calculated?</AccordionHeader>
          <AccordionBody>
            Election results are aggregated from the blockchain ledger, where each vote is recorded transparently. Results are verifiable by all participants, ensuring trust and accuracy.
          </AccordionBody>
        </AccordionItem>
        <AccordionItem eventKey="7">
          <AccordionHeader>Is BlockVote accessible on mobile devices?</AccordionHeader>
          <AccordionBody>
            Yes, BlockVote is designed to be responsive and accessible on both desktop and mobile devices, allowing you to vote or verify votes from anywhere.
          </AccordionBody>
        </AccordionItem>
      </Accordion>
    </Container>
  );
}