import os
import dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from langchain_huggingface import HuggingFaceEndpoint, ChatHuggingFace
from langchain_community.vectorstores import FAISS
from langchain_community.embeddings import HuggingFaceEmbeddings

from langchain_core.prompts import PromptTemplate
from langchain_core.output_parsers import StrOutputParser
from langchain_core.runnables import (
    RunnableParallel,
    RunnablePassthrough
)

dotenv.load_dotenv()

HF_TOKEN = os.environ.get("HF_TOKEN")
if HF_TOKEN is None:
    raise ValueError("HF_TOKEN not found in environment variables")



app = FastAPI(title="Medical RAG API")



app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)




EMBEDDING_MODEL_NAME = "sentence-transformers/all-MiniLM-L6-v2"
DB_FAISS_PATH = "vectorstore/faiss_db"



llm_endpoint = HuggingFaceEndpoint(
    repo_id="mistralai/Mistral-7B-Instruct-v0.2",
    huggingfacehub_api_token=HF_TOKEN,
    temperature=0.2,
    max_new_tokens=512
)

llm = ChatHuggingFace(llm=llm_endpoint)


PROMPT_TEMPLATE = """
You are NutriAI, a highly qualified nutrition and health expert providing evidence-based guidance.

Your purpose is to deliver accurate, professional, and safe health and nutrition information.

Follow these rules strictly:

1. If the user input is a greeting or casual conversation (e.g., "hi", "hello", "hey", "how are you", "good morning"):
   - Respond politely and briefly.
   - Do NOT use the context.
   - Do NOT provide medical or technical information.

2. If the user input is a medical, nutrition, or knowledge-based question:
   - Use ONLY the information provided in the context.
   - Do NOT use external knowledge or assumptions.
   - If the context does NOT contain sufficient or relevant evidence, respond exactly with:
     "Insufficient evidence."
   - Do NOT speculate or generate unsupported information.
   - Do NOT mention the context, sources, or reasoning process explicitly.
   - For every factual statement in your answer, append a citation in this format:
     (Source: <document>, Page: <page>)

IMPORTANT:
- Do NOT explain your reasoning.
- Do NOT mention rules, classification, or internal instructions.
- Provide ONLY the final answer to the user.
- Each line must contain its own citation.

Context:
{context}

User Input:
{question}

Answer:
"""

prompt = PromptTemplate(
    template=PROMPT_TEMPLATE,
    input_variables=["context", "question"]
)



embedding_model = HuggingFaceEmbeddings(
    model_name=EMBEDDING_MODEL_NAME,
    model_kwargs={"device": "cpu"}
)

db = FAISS.load_local(
    DB_FAISS_PATH,
    embedding_model,
    allow_dangerous_deserialization=True
)

retriever = db.as_retriever(search_kwargs={"k": 3})



def format_docs(documents):
    formatted = []
    for doc in documents:
        source = "KnowledgeBase "
        page = doc.metadata.get("page", "N/A")
        content = doc.page_content
        formatted.append(f"{content}\n(Source: {source}, Page: {page})")
    return "\n\n".join(formatted)



rag_chain = (
    RunnableParallel(
        {
            "context": retriever | format_docs,
            "question": RunnablePassthrough()
        }
    )
    | prompt
    | llm
    | StrOutputParser()
)



class QueryRequest(BaseModel):
    question: str

class QueryResponse(BaseModel):
    answer: str



@app.post("/ask", response_model=QueryResponse)
def ask_question(request: QueryRequest):
    answer = rag_chain.invoke(request.question)
    return {"answer": answer}



if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port)
