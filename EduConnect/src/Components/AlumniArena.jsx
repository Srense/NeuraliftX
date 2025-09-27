import React, { useEffect, useState } from "react";
import { Container, Row, Col, Card, Button } from "react-bootstrap";

const AlumniArena = () => {
  const [alumniList, setAlumniList] = useState([]);

  useEffect(() => {
    const fetchAlumni = async () => {
      try {
        const res = await fetch("https://neuraliftx.onrender.com/api/alumni");
        const data = await res.json();
        setAlumniList(data);
      } catch (err) {
        console.error("Error fetching alumni:", err);
      }
    };
    fetchAlumni();
  }, []);

  return (
    <Container className="py-4">
      <h2 className="text-center mb-4">Alumni Arena</h2>
      <Row className="g-4">
        {alumniList.map((alumni) => (
          <Col key={alumni._id} xs={12} sm={6} md={4} lg={3}>
            <Card className="shadow-sm h-100">
              <Card.Body className="d-flex flex-column">
                <Card.Title>{alumni.name}</Card.Title>
                <Card.Subtitle className="mb-2 text-muted">
                  {alumni.designation} at {alumni.company}
                </Card.Subtitle>
                <Card.Text className="flex-grow-1">
                  {alumni.description || "No bio provided."}
                </Card.Text>
                <div className="mt-auto">
                  {alumni.linkedin && (
                    <Button
                      variant="primary"
                      className="me-2"
                      href={alumni.linkedin}
                      target="_blank"
                    >
                      Connect
                    </Button>
                  )}
                  {alumni.github && (
                    <Button
                      variant="dark"
                      href={alumni.github}
                      target="_blank"
                    >
                      GitHub
                    </Button>
                  )}
                </div>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>
    </Container>
  );
};

export default AlumniArena;
