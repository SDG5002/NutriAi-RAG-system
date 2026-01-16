from langchain_community.document_loaders import PyPDFLoader, DirectoryLoader
from langchain_community.vectorstores import FAISS
from langchain_text_splitters import RecursiveCharacterTextSplitter

from langchain_huggingface import HuggingFaceEmbeddings
import os
import dotenv



dotenv.load_dotenv()

HUGGINGFACEHUB_API_TOKEN = os.environ.get("HF_TOKEN")




DATA_PATH="data/"
def load_pdf_files(data):
    loader = DirectoryLoader(data,
                             glob='*.pdf',
                             loader_cls=PyPDFLoader)
    
    documents=loader.load()
    return documents

documents=load_pdf_files(data=DATA_PATH)




def create_chunks(extracted_data):
    text_splitter=RecursiveCharacterTextSplitter(chunk_size=500,
                                                 chunk_overlap=50)
    text_chunks=text_splitter.split_documents(extracted_data)

    for idx, doc in enumerate(text_chunks):
        doc.metadata["chunk_id"] = idx

    return text_chunks

text_chunks=create_chunks(extracted_data=documents)


# Create Vector Embeddings 


embeddings = HuggingFaceEmbeddings(
    model_name="sentence-transformers/all-MiniLM-L6-v2"
)


# Store embeddings in FAISS

DB_FAISS_PATH="vectorstore/faiss_db"
db=vector_store = FAISS.from_documents(
    documents=text_chunks,
    embedding=embeddings
)
db.save_local(DB_FAISS_PATH)