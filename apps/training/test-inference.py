#!/usr/bin/env python
"""
Test script for running inference with fine-tuned models
"""

import argparse
import json
import os
import time
from pathlib import Path

import torch
from transformers import (
    AutoModelForCausalLM,
    AutoTokenizer,
    BitsAndBytesConfig,
    pipeline,
)
from peft import PeftModel

def parse_args():
    parser = argparse.ArgumentParser(description="Test a fine-tuned model with inference")
    parser.add_argument(
        "--model_path",
        type=str,
        default="./models/mistral-7b-finetuned",
        help="Path to the fine-tuned model directory",
    )
    parser.add_argument(
        "--base_model",
        type=str,
        default="mistralai/Mistral-7B-v0.1",
        help="Base model identifier",
    )
    parser.add_argument(
        "--test_file",
        type=str,
        default="./data/test_prompts.json",
        help="JSON file with test prompts",
    )
    parser.add_argument(
        "--output_file",
        type=str,
        default="./outputs/test_results.json",
        help="File to save results",
    )
    parser.add_argument(
        "--quantize",
        action="store_true",
        help="Load model in 4-bit quantization",
    )
    return parser.parse_args()

def load_model(args):
    """Load the fine-tuned model"""
    print(f"Loading model from {args.model_path}...")
    
    # Configure quantization if needed
    if args.quantize:
        quantization_config = BitsAndBytesConfig(
            load_in_4bit=True,
            bnb_4bit_quant_type="nf4",
            bnb_4bit_compute_dtype=torch.float16,
            bnb_4bit_use_double_quant=True,
        )
    else:
        quantization_config = None
    
    # Load base model with quantization if specified
    device_map = "auto"
    base_model = AutoModelForCausalLM.from_pretrained(
        args.base_model,
        quantization_config=quantization_config,
        device_map=device_map,
        trust_remote_code=True,
    )
    
    # Load adapter if it exists
    if os.path.exists(os.path.join(args.model_path, "adapter_model.bin")):
        print("Loading LoRA adapter...")
        model = PeftModel.from_pretrained(base_model, args.model_path)
    else:
        model = base_model
    
    tokenizer = AutoTokenizer.from_pretrained(args.base_model, trust_remote_code=True)
    return model, tokenizer

def generate_responses(model, tokenizer, prompts):
    """Generate responses for the given prompts"""
    generator = pipeline(
        "text-generation",
        model=model,
        tokenizer=tokenizer,
        max_new_tokens=512,
        temperature=0.7,
        top_p=0.95,
        repetition_penalty=1.15
    )
    
    results = []
    for idx, prompt in enumerate(prompts):
        print(f"Processing prompt {idx+1}/{len(prompts)}...")
        start_time = time.time()
        
        response = generator(prompt["prompt"], return_full_text=False)
        
        end_time = time.time()
        
        results.append({
            "prompt": prompt["prompt"],
            "expected": prompt.get("expected", ""),
            "response": response[0]["generated_text"],
            "time_taken": end_time - start_time
        })
    
    return results

def main():
    args = parse_args()
    
    # Create output directory if it doesn't exist
    os.makedirs(os.path.dirname(args.output_file), exist_ok=True)
    
    # Load test prompts
    if os.path.exists(args.test_file):
        with open(args.test_file, "r", encoding="utf-8") as f:
            test_prompts = json.load(f)
    else:
        print(f"Test file {args.test_file} not found. Using sample prompts.")
        test_prompts = [
            {"prompt": "Explain the concept of LoRA fine-tuning in simple terms."},
            {"prompt": "What are the advantages of using parameter-efficient fine-tuning?"},
            {"prompt": "How can I deploy a fine-tuned LLM in a production environment?"}
        ]
    
    # Load model and tokenizer
    model, tokenizer = load_model(args)
    
    # Generate responses
    results = generate_responses(model, tokenizer, test_prompts)
    
    # Save results
    with open(args.output_file, "w", encoding="utf-8") as f:
        json.dump(results, f, indent=2)
    
    print(f"Results saved to {args.output_file}")

if __name__ == "__main__":
    main()
