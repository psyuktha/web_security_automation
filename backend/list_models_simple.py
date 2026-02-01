#!/usr/bin/env python3
"""Simple script to list available Google AI models."""

import os
import sys

# Try to load dotenv if available
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass  # Continue without dotenv

try:
    from google.genai import Client
    
    api_key = os.environ.get("GOOGLE_API_KEY")
    if not api_key:
        print("Error: GOOGLE_API_KEY not found.")
        print("Set it in your .env file or environment variables.")
        print("\nYou can also use Vertex AI by setting:")
        print("  GOOGLE_GENAI_USE_VERTEXAI=1")
        print("  GOOGLE_CLOUD_PROJECT=your-project-id")
        print("  GOOGLE_CLOUD_LOCATION=us-central1")
        sys.exit(1)
    
    client = Client(api_key=api_key)
    
    print("=" * 80)
    print("Available Google AI Models")
    print("=" * 80)
    print()
    
    models = client.models.list()
    
    for model in models:
        print(f"Model: {model.name}")
        if hasattr(model, 'display_name'):
            print(f"  Display Name: {model.display_name}")
        if hasattr(model, 'description'):
            print(f"  Description: {model.description}")
        if hasattr(model, 'supported_generation_methods'):
            methods = model.supported_generation_methods
            if methods:
                print(f"  Supported Methods: {', '.join(methods)}")
        if hasattr(model, 'input_token_limit'):
            print(f"  Input Token Limit: {model.input_token_limit:,}")
        if hasattr(model, 'output_token_limit'):
            print(f"  Output Token Limit: {model.output_token_limit:,}")
        print()
    
    print("=" * 80)
    print(f"Total models found: {len(list(models))}")
    print("=" * 80)
    
except ImportError as e:
    print(f"Error: Required library not installed: {e}")
    print("Install with: pip install google-genai python-dotenv")
except Exception as e:
    print(f"Error: {e}")
    import traceback
    traceback.print_exc()

