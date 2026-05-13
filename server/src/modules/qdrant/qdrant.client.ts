import { QdrantClient } from "@qdrant/js-client-rest";

const qdrantClient = new QdrantClient({
  url: "http://localhost:6333",
});

export default qdrantClient;