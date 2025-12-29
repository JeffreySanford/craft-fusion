import os
import json
import torch
from transformers import AutoModelForCausalLM, AutoTokenizer, TrainingArguments, Trainer, DataCollatorForLanguageModeling
from peft import LoraConfig, get_peft_model, TaskType
from datasets import load_dataset, DatasetDict
from colorama import Fore, Style

# ===================== CONFIGURATION =====================
MODEL_NAME = "deepseek-ai/deepseek-coder-1.5b"  # If unavailable, use an alternative model
OUTPUT_DIR = "./fine-tuned-model"
TRAIN_DATA_DIR = "./training_data"
OLLAMA_URL = "http://localhost:11434/api/generate"  # Default Ollama API endpoint

def log_message(message, color=Fore.WHITE):
    """Logging function with color support"""
    print(f"{color}[LOG] {message}{Style.RESET_ALL}")

# ===================== DISPLAY TRAINING FILES =====================
def list_training_files():
    """Lists and validates all training files in the training_data directory."""
    log_message("Listing all training files:", Fore.YELLOW)
    files = [os.path.join(TRAIN_DATA_DIR, f) for f in os.listdir(TRAIN_DATA_DIR) if f.endswith(".jsonl")]
    
    if not files:
        log_message("No valid training files found! Exiting.", Fore.RED)
        exit(1)
    
    for file in files:
        log_message(f" - {file}", Fore.CYAN)
    return files

# ===================== LOAD DATA =====================
def load_training_data():
    """Loads all JSONL training files from the training_data directory."""
    log_message("Loading training data...", Fore.YELLOW)
    files = list_training_files()
    
    # Separate files into different configurations based on their columns
    datasets = {}
    for file in files:
        try:
            with open(file, "r", encoding="utf-8") as f:
                first_line = json.loads(f.readline())
                columns = tuple(first_line.keys())
                if columns not in datasets:
                    datasets[columns] = []
                datasets[columns].append(file)
        except json.JSONDecodeError as e:
            log_message(f"Skipping malformed JSONL file: {file} - {e}", Fore.RED)
    
    dataset_dict = DatasetDict()
    for columns, files in datasets.items():
        dataset_name = "_".join(columns)
        dataset_dict[dataset_name] = load_dataset("json", data_files={"train": files})["train"]
    
    log_message("Training data loaded successfully.", Fore.GREEN)
    return dataset_dict

# ===================== TOKENIZE DATA =====================
def tokenize_data(dataset_dict, tokenizer):
    """Tokenizes the dataset using the provided tokenizer."""
    log_message("Tokenizing data...", Fore.YELLOW)
    
    def tokenize_function(examples):
        if "text" in examples:
            text = examples["text"]
        elif "input" in examples:
            text = examples["input"]
        else:
            text = " ".join(" ".join(item) if isinstance(item, list) else str(item) for item in examples.values())
        return tokenizer(text, padding="max_length", truncation=True)
    
    tokenized_datasets = {}
    for name, dataset in dataset_dict.items():
        tokenized_datasets[name] = dataset.map(tokenize_function, batched=True)
    
    log_message("Data tokenized successfully.", Fore.GREEN)
    return DatasetDict(tokenized_datasets)

# ===================== SETUP MODEL =====================
def setup_model():
    """Loads the base model and tokenizer, and applies LoRA fine-tuning."""
    log_message("Loading base model and tokenizer...", Fore.YELLOW)
    try:
        tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME)
        model = AutoModelForCausalLM.from_pretrained(MODEL_NAME, torch_dtype=torch.float16, device_map="auto")
        log_message("Model and tokenizer loaded successfully.", Fore.GREEN)
    except Exception as e:
        log_message(f"Error loading model or tokenizer: {e}", Fore.RED)
        log_message("Falling back to a default model 'gpt2'...", Fore.YELLOW)
        tokenizer = AutoTokenizer.from_pretrained("gpt2")
        model = AutoModelForCausalLM.from_pretrained("gpt2", torch_dtype=torch.float16, device_map="auto")
        log_message("Default model 'gpt2' loaded successfully.", Fore.GREEN)
    
    # Add padding token if it does not exist
    if tokenizer.pad_token is None:
        tokenizer.add_special_tokens({'pad_token': tokenizer.eos_token})
        model.resize_token_embeddings(len(tokenizer))
        log_message("Added padding token to the tokenizer.", Fore.GREEN)
    
    log_message("Applying LoRA fine-tuning...", Fore.YELLOW)
    lora_config = LoraConfig(
        task_type=TaskType.CAUSAL_LM,
        r=8,
        lora_alpha=32,
        lora_dropout=0.1,
        target_modules=["q_proj", "v_proj"]
    )

    try:
        model = get_peft_model(model, lora_config)
        log_message("LoRA fine-tuning applied.", Fore.GREEN)
    except ValueError as e:
        log_message(f"Error applying LoRA fine-tuning: {e}", Fore.RED)
        log_message("Skipping LoRA fine-tuning and proceeding with the base model.", Fore.YELLOW)
    return model, tokenizer

# ===================== TRAINING CONFIGURATION =====================
def configure_training():
    """Configures training parameters for fine-tuning."""
    log_message("Setting up training configuration...", Fore.YELLOW)
    training_args = TrainingArguments(
        output_dir=OUTPUT_DIR,
        num_train_epochs=3,
        per_device_train_batch_size=4,
        per_device_eval_batch_size=4,
        save_steps=500,
        save_total_limit=2,
        eval_strategy="no",  # Updated to avoid deprecated warning
        logging_dir=f"{OUTPUT_DIR}/logs",
        logging_steps=100,
        report_to="none",
        remove_unused_columns=False  # Ensure all columns are kept
    )
    log_message("Training configuration set up successfully.", Fore.GREEN)
    return training_args

# ===================== START TRAINING =====================
def train_model():
    """Runs the training process."""
    dataset_dict = load_training_data()
    model, tokenizer = setup_model()
    training_args = configure_training()
    
    tokenized_dataset_dict = tokenize_data(dataset_dict, tokenizer)
    data_collator = DataCollatorForLanguageModeling(tokenizer=tokenizer, mlm=False)
    
    for name, tokenized_dataset in tokenized_dataset_dict.items():
        log_message(f"Starting model training for dataset: {name}...", Fore.YELLOW)
        trainer = Trainer(
            model=model,
            args=training_args,
            train_dataset=tokenized_dataset,
            tokenizer=tokenizer,
            data_collator=data_collator
        )
        trainer.train()
        log_message(f"Model training completed successfully for dataset: {name}.", Fore.GREEN)
    
    log_message("Saving fine-tuned model...", Fore.YELLOW)
    trainer.save_model(OUTPUT_DIR)
    log_message(f"Fine-tuned model saved at {OUTPUT_DIR}", Fore.CYAN)

# ===================== EXECUTE SCRIPT =====================
if __name__ == "__main__":
    log_message("Initializing DeepSeek fine-tuning script", Fore.YELLOW)
    train_model()
