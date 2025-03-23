#!/usr/bin/env python
"""
Fine-tuning script optimized for Jeffrey Sanford's portfolio data
"""

import argparse
import os
import json
from typing import Dict, List, Any

import torch
from transformers import (
    AutoModelForCausalLM,
    AutoTokenizer,
    BitsAndBytesConfig,
    TrainingArguments,
)
from peft import prepare_model_for_kbit_training, LoraConfig, get_peft_model
from datasets import load_dataset
from trl import SFTTrainer

# Portfolio knowledge domains
PORTFOLIO_DOMAINS = [
    "angular",
    "nestjs",
    "go",
    "typescript",
    "web-development",
    "devops",
    "database",
    "machine-learning",
]

def parse_args():
    parser = argparse.ArgumentParser(description="Fine-tune a model on Jeffrey Sanford's portfolio data")
    parser.add_argument(
        "--base_model",
        type=str,
        default="mistralai/Mistral-7B-v0.1",
        help="Base model to fine-tune",
    )
    parser.add_argument(
        "--data_paths",
        type=str,
        nargs="+",
        default=["./training_data/jeffreysanford.jsonl"],
        help="Paths to training data files",
    )
    parser.add_argument(
        "--output_dir",
        type=str,
        default="./models/portfolio-finetuned",
        help="Directory to save the fine-tuned model",
    )
    parser.add_argument(
        "--epochs",
        type=int,
        default=3,
        help="Number of training epochs",
    )
    parser.add_argument(
        "--batch_size",
        type=int,
        default=4,
        help="Batch size for training",
    )
    parser.add_argument(
        "--learning_rate",
        type=float,
        default=2e-4,
        help="Learning rate for training",
    )
    parser.add_argument(
        "--lora_r",
        type=int,
        default=16,
        help="LoRA attention dimension",
    )
    parser.add_argument(
        "--lora_alpha",
        type=int,
        default=32,
        help="LoRA alpha parameter",
    )
    parser.add_argument(
        "--lora_dropout",
        type=float,
        default=0.05,
        help="LoRA dropout probability",
    )
    parser.add_argument(
        "--domain_weights",
        type=json.loads,
        default={domain: 1.0 for domain in PORTFOLIO_DOMAINS},
        help="Weights for different knowledge domains (JSON)",
    )
    return parser.parse_args()

def load_and_prepare_datasets(data_paths: List[str], domain_weights: Dict[str, float]):
    """Load and prepare datasets with domain weighting"""
    
    print(f"Loading data from {data_paths}")
    
    # Load datasets from each path
    datasets = []
    for path in data_paths:
        # Extract domain from filename
        domain = os.path.basename(path).split('.')[0]
        weight = domain_weights.get(domain, 1.0)
        
        # Load dataset
        dataset = load_dataset('json', data_files=path, split='train')
        
        # Apply weight by repeating the dataset proportionally to its weight
        if weight != 1.0:
            # For weights > 1, we repeat the dataset
            if weight > 1.0:
                repeat_factor = int(weight)
                remainder = weight - repeat_factor
                
                # Repeat the full dataset 'repeat_factor' times
                weighted_dataset = dataset.map(lambda x: x, remove_columns=[])
                for _ in range(repeat_factor - 1):
                    weighted_dataset = weighted_dataset.concatenate(dataset)
                
                # Add a random sample for the remainder
                if remainder > 0:
                    remainder_size = int(len(dataset) * remainder)
                    if remainder_size > 0:
                        remainder_dataset = dataset.shuffle().select(range(remainder_size))
                        weighted_dataset = weighted_dataset.concatenate(remainder_dataset)
                
                datasets.append(weighted_dataset)
            # For weights < 1, we take a subset
            else:
                subset_size = int(len(dataset) * weight)
                if subset_size > 0:
                    weighted_dataset = dataset.shuffle().select(range(subset_size))
                    datasets.append(weighted_dataset)
        else:
            datasets.append(dataset)
    
    # Combine all datasets
    if len(datasets) > 1:
        combined_dataset = datasets[0]
        for dataset in datasets[1:]:
            combined_dataset = combined_dataset.concatenate(dataset)
    else:
        combined_dataset = datasets[0]
    
    # Shuffle the combined dataset
    combined_dataset = combined_dataset.shuffle(seed=42)
    
    print(f"Combined dataset size: {len(combined_dataset)} examples")
    return combined_dataset

def prepare_model(args):
    """Prepare the model for fine-tuning"""
    
    # Configure 4-bit quantization
    quantization_config = BitsAndBytesConfig(
        load_in_4bit=True,
        bnb_4bit_quant_type="nf4",
        bnb_4bit_compute_dtype=torch.float16,
        bnb_4bit_use_double_quant=True,
    )
    
    # Load model with quantization
    print(f"Loading base model: {args.base_model}")
    model = AutoModelForCausalLM.from_pretrained(
        args.base_model,
        quantization_config=quantization_config,
        device_map="auto",
        trust_remote_code=True,
    )
    model = prepare_model_for_kbit_training(model)
    
    # Load tokenizer
    tokenizer = AutoTokenizer.from_pretrained(args.base_model, trust_remote_code=True)
    tokenizer.pad_token = tokenizer.eos_token
    
    # Configure LoRA
    lora_config = LoraConfig(
        r=args.lora_r,
        lora_alpha=args.lora_alpha,
        lora_dropout=args.lora_dropout,
        bias="none",
        task_type="CAUSAL_LM",
        target_modules=["q_proj", "k_proj", "v_proj", "o_proj"],
    )
    
    # Apply LoRA
    model = get_peft_model(model, lora_config)
    
    return model, tokenizer

def train_model(model, tokenizer, dataset, args):
    """Train the model using SFTTrainer"""
    
    # Configure training arguments
    training_args = TrainingArguments(
        output_dir=args.output_dir,
        num_train_epochs=args.epochs,
        per_device_train_batch_size=args.batch_size,
        gradient_accumulation_steps=4,
        gradient_checkpointing=True,
        learning_rate=args.learning_rate,
        weight_decay=0.01,
        logging_steps=10,
        save_strategy="epoch",
        lr_scheduler_type="cosine",
        warmup_ratio=0.1,
        report_to="tensorboard",
        save_total_limit=3,
        push_to_hub=False,
        fp16=True,
    )
    
    # Configuration for formatting the training data
    def formatting_func(example):
        output_texts = []
        for i in range(len(example['input'])):
            text = f"### User:\n{example['input'][i]}\n\n### Assistant:\n{example['output'][i]}"
            output_texts.append(text)
        return output_texts
    
    # Create SFTTrainer
    trainer = SFTTrainer(
        model=model,
        train_dataset=dataset,
        args=training_args,
        formatting_func=formatting_func,
        tokenizer=tokenizer,
        packing=True,
        max_seq_length=1024,
    )
    
    # Train the model
    print("Starting training...")
    trainer.train()
    
    # Save the trained model
    print(f"Saving model to {args.output_dir}")
    trainer.save_model(args.output_dir)
    return trainer

def save_portfolio_metadata(args, dataset_stats):
    """Save metadata about the portfolio fine-tuning"""
    metadata = {
        "base_model": args.base_model,
        "training_data": {
            "files": args.data_paths,
            "total_examples": dataset_stats["total_examples"],
            "domain_weights": args.domain_weights,
            "domain_distribution": dataset_stats["domain_distribution"]
        },
        "training_params": {
            "epochs": args.epochs,
            "batch_size": args.batch_size,
            "learning_rate": args.learning_rate,
            "lora_r": args.lora_r,
            "lora_alpha": args.lora_alpha,
            "lora_dropout": args.lora_dropout
        },
        "portfolio_focus": "Jeffrey Sanford's full-stack expertise with Angular, NestJS, and Go",
        "capabilities": [
            "Craft Fusion architecture explanation",
            "Angular front-end implementation details",
            "NestJS API design patterns",
            "Go microservice implementation",
            "DevOps workflows and deployment strategies",
            "Technical skill assessment and recommendations"
        ]
    }
    
    os.makedirs(args.output_dir, exist_ok=True)
    with open(os.path.join(args.output_dir, "portfolio_metadata.json"), "w") as f:
        json.dump(metadata, f, indent=2)

def main():
    args = parse_args()
    
    # Create output directory
    os.makedirs(args.output_dir, exist_ok=True)
    
    # Load and prepare datasets
    dataset = load_and_prepare_datasets(args.data_paths, args.domain_weights)
    
    # Collect dataset statistics for metadata
    dataset_stats = {
        "total_examples": len(dataset),
        "domain_distribution": {}
    }
    
    # Prepare model and tokenizer
    model, tokenizer = prepare_model(args)
    
    # Train model
    trainer = train_model(model, tokenizer, dataset, args)
    
    # Save portfolio metadata
    save_portfolio_metadata(args, dataset_stats)
    
    print("Training complete!")

if __name__ == "__main__":
    main()
