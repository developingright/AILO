const ContextModel = require("../Models/Context");
const UserModel = require("../Models/User");
const express = require("express");
require('dotenv').config();

const router = express.Router();

function splitTextToChunks(text) {
  // You can split by paragraphs, sentences, or custom logic
  // For simplicity, split by sentences using period (.)
  const chunks = text.split(/(?<=\.)\s+/);
  return chunks;
}
async function getChunkEmbeddings(chunks, model) {
  let chunkEmbeddings = [];
  for (const chunk of chunks) {
      const result = await model.embedContent(chunk);
      chunkEmbeddings.push(result.embedding.values);
  }
  return chunkEmbeddings;
}
function averageEmbeddings(embeddings) {
    let globalEmbedding = Array(embeddings[0].length).fill(0);
    let numChunks = embeddings.length;

    // Sum embeddings across chunks
    embeddings.forEach(chunkEmbedding => {
        for (let i = 0; i < chunkEmbedding.length; i++) {
            globalEmbedding[i] += chunkEmbedding[i];
        }
    });

    // Average the embeddings
    for (let i = 0; i < globalEmbedding.length; i++) {
        globalEmbedding[i] /= numChunks;
    }

    return globalEmbedding;
}



async function runHierarchicalEmbedding(text) {
  const maxPayloadSize = 10000;

  // Helper function to get byte size of a string
  function getByteSize(str) {
      return new TextEncoder().encode(str).length;
  }

  // Split the text into smaller chunks, e.g., by sentences
  const chunks = splitTextToChunks(text);

  // Initialize the model (assuming the same embedding model is used)
  const model = genAI.getGenerativeModel({ model: "text-embedding-004" });

  // Generate embeddings for each chunk (first level)
  const chunkEmbeddings = await getChunkEmbeddings(chunks, model);

  // Aggregate the embeddings to form a global embedding (second level)
  const globalEmbedding = averageEmbeddings(chunkEmbeddings);

  return globalEmbedding;
}



const { GoogleGenerativeAI } = require("@google/generative-ai");
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
async function run(text) {
    // For embeddings, use the Text Embeddings model
    const maxPayloadSize = 10000;

    // Helper function to get byte size of a string
    function getByteSize(str) {
        return new TextEncoder().encode(str).length;
    }
  
    // Split the text into smaller chunks, e.g., by sentences
    const chunks = splitTextToChunks(text);
  
    // Initialize the model (assuming the same embedding model is used)
    const model = genAI.getGenerativeModel({ model: "text-embedding-004" });
  
    // Generate embeddings for each chunk (first level)
    const chunkEmbeddings = await getChunkEmbeddings(chunks, model);
  
    // Aggregate the embeddings to form a global embedding (second level)
    const globalEmbedding = averageEmbeddings(chunkEmbeddings);
    return globalEmbedding;
    }
    

const createEmbedding = async(query) =>{
    const response = await fetch('http://127.0.0.1:5000/embed', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ text: query })
    });

    const { embedding } = await response.json();
    return embedding;
}

async function findSimilarDocuments(embedding, userId) {
    try {

      const documents = await ContextModel.aggregate([
        {
          "$vectorSearch": {
            "index": "vector_index",
            "path": "embedding",
            "queryVector": embedding,
            "numCandidates": 6,
            "limit": 5 
          }
        },
        {
          "$project": {
            "context": 1,
            "UserId":1,
            "score": 1
          }
        }
      ]);
  
      // Step 2: Filter results by UserId
      const filteredDocuments = documents.filter(doc => doc.UserId && doc.UserId.toString() === userId.toString());
  
      return filteredDocuments;
    } catch (err) {
      console.error(err);
      throw new Error('Error querying similar documents');
    }
  }
  


  router.post('/query-embedding', async (req, res) => {
    try {
      const { query, UserId } = req.body;
  
      // Generate embedding for the input query
      const embedding = await run(query);
  
      // Find similar documents, filtered by UserId
      const similarDocuments = await findSimilarDocuments(embedding, UserId);
  
  
      // Get the document with the highest score
      const highestScoreDoc = similarDocuments.reduce((highest, current) => {
        return highest.score > current.score ? highest : current;
      }, { score: -Infinity }); // Initialize with a default value to handle empty arrays
  
  
      const response = {
        msg: "success",
        similarDocuments
      };
  
      res.json(response);
    } catch (err) {
      res.status(500).json({
        error: 'Internal server error',
        message: err.message,
      });
    }
  });
  


router.post("/create", async (req, res) => {
    try {
      const { url, UserId } = req.body;
  
      const response = await fetch(`${process.env.FLASK_URL}/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: url }),
      });
  
      if (!response.ok) {
        return res.json({ success: false, message: 'Failed to generate contexts' });
      }
  
      const all_contexts = await response.json();
      for (const item of all_contexts) {
        
        const embedding = await run(item);

        const context = item;
        const upload = {
          context,
          embedding,
          UserId,
        };
  
        const newContext = new ContextModel(upload);
        await newContext.save();

        const user = await UserModel.findById(UserId);
        if (user) {
          user.contexts.push(newContext);
          await user.save();
        } else {
          return res.json({ success: false, message: 'User not found' });
        }
      }
  
      return res.json({ success: true, message: 'Contexts created successfully' });
    } catch (error) {
      return res.json({ success: false, message: error.message });
    }
  });


module.exports = router;
