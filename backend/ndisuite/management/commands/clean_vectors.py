"""
Management command to clean vector database by removing orphaned or dummy vectors.

This command helps maintain the vector database integrity by:
1. Removing vectors that lack required metadata (file_id or session_id)
2. Removing vectors flagged as is_dummy=True
"""

import logging
from django.core.management.base import BaseCommand
from django.conf import settings
from langchain.vectorstores import Chroma
from langchain_community.embeddings import OpenAIEmbeddings
import os
import shutil
import json

logger = logging.getLogger('ndisuite')

class Command(BaseCommand):
    help = 'Clean the vector database by removing orphaned or dummy vectors'

    def add_arguments(self, parser):
        parser.add_argument(
            '--remove-orphans',
            action='store_true',
            help='Remove vectors with missing metadata (file_id/session_id)',
        )
        parser.add_argument(
            '--remove-dummies',
            action='store_true',
            help='Remove vectors flagged as is_dummy=True',
            default=True,
        )
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Show what would be deleted without actually deleting',
        )
        parser.add_argument(
            '--collection',
            type=str,
            help='Specific collection to clean (default: clean all)',
        )

    def handle(self, *args, **options):
        remove_orphans = options['remove_orphans']
        remove_dummies = options['remove_dummies']
        dry_run = options['dry_run']
        target_collection = options['collection']
        
        if not (remove_orphans or remove_dummies):
            self.stdout.write(self.style.WARNING('No clean actions specified. Use --remove-orphans or --remove-dummies'))
            return
        
        try:
            # Initialize OpenAI embeddings
            embeddings = OpenAIEmbeddings(
                openai_api_key=settings.OPENAI_API_KEY,
                model=settings.EMBEDDING_MODEL
            )
            
            # Get available collections
            collections = self._get_collections()
            
            if not collections:
                self.stdout.write(self.style.WARNING('No vector collections found'))
                return
            
            # Filter to target collection if specified
            if target_collection:
                if target_collection in collections:
                    collections = [target_collection]
                else:
                    self.stdout.write(self.style.ERROR(f'Collection {target_collection} not found'))
                    return

            total_removed = 0
            
            for collection_name in collections:
                self.stdout.write(f'Processing collection: {collection_name}')
                
                vector_store = Chroma(
                    collection_name=collection_name,
                    embedding_function=embeddings,
                    persist_directory=settings.VECTOR_STORE_PATH
                )
                
                # Get all documents and their IDs
                try:
                    collection = vector_store._collection
                    docs_to_delete = []
                    
                    # Get all embeddings with their metadata
                    all_metadatas = collection.get(include=['metadatas', 'documents', 'embeddings'])
                    ids = all_metadatas['ids']
                    metadatas = all_metadatas['metadatas']
                    
                    for i, metadata in enumerate(metadatas):
                        delete_id = False
                        doc_id = ids[i]
                        
                        # Check for missing file_id or session_id in document collection
                        if remove_orphans:
                            if collection_name == 'document_chunks':
                                if not metadata.get('file_id'):
                                    self.stdout.write(f'  Found orphaned document: {doc_id} - Missing file_id')
                                    delete_id = True
                            elif collection_name.startswith('session_'):
                                if not metadata.get('session_id'):
                                    self.stdout.write(f'  Found orphaned transcript: {doc_id} - Missing session_id')
                                    delete_id = True
                                elif not metadata.get('type') == 'transcript':
                                    self.stdout.write(f'  Found non-transcript in session collection: {doc_id}')
                                    delete_id = True
                        
                        # Check for dummy vectors
                        if remove_dummies and metadata.get('is_dummy') == True:
                            self.stdout.write(f'  Found dummy vector: {doc_id}')
                            delete_id = True
                        
                        if delete_id:
                            docs_to_delete.append(doc_id)
                    
                    # Delete the identified vectors
                    if docs_to_delete:
                        self.stdout.write(f'  Found {len(docs_to_delete)} vectors to remove from {collection_name}')
                        if not dry_run:
                            collection.delete(ids=docs_to_delete)
                            vector_store.persist()
                            self.stdout.write(self.style.SUCCESS(f'  Removed {len(docs_to_delete)} vectors'))
                        else:
                            self.stdout.write(self.style.WARNING(f'  DRY RUN: Would remove {len(docs_to_delete)} vectors'))
                        total_removed += len(docs_to_delete)
                    else:
                        self.stdout.write(self.style.SUCCESS(f'  No vectors to remove from {collection_name}'))
                
                except Exception as e:
                    self.stdout.write(self.style.ERROR(f'  Error processing collection {collection_name}: {str(e)}'))
            
            # Print summary
            if dry_run:
                self.stdout.write(self.style.WARNING(f'DRY RUN: Would remove {total_removed} vectors across all collections'))
            else:
                self.stdout.write(self.style.SUCCESS(f'Successfully removed {total_removed} vectors across all collections'))
                
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'Error cleaning vectors: {str(e)}'))

    def _get_collections(self):
        """Get all available Chroma collections"""
        try:
            collections = []
            vector_path = settings.VECTOR_STORE_PATH
            
            if not os.path.exists(vector_path):
                return collections
                
            # Look for collection directories
            for item in os.listdir(vector_path):
                coll_path = os.path.join(vector_path, item)
                if os.path.isdir(coll_path):
                    # Check if it's a valid Chroma collection (has chroma.sqlite3)
                    if os.path.exists(os.path.join(coll_path, 'chroma.sqlite3')):
                        collections.append(item)
            
            return collections
        except Exception as e:
            logger.error(f"Error getting collections: {str(e)}")
            return []
