import time
import psutil  # System monitoring
import torch
from transformers import AutoModelForCausalLM, AutoTokenizer, TrainingArguments, Trainer
from peft import LoraConfig, get_peft_model
from datasets import load_dataset, concatenate_datasets
import concurrent.futures  # For multi-threaded downloads
import argparse  # For command-line argument parsing
import requests  # For checking internet connection
import os  # For accessing environment variables
import logging  # For logging
import shutil  # For file operations
from colorama import Fore, Style  # For colored console output
import subprocess  # For running subprocesses

# Mock function to replace the missing import
import transformers.pytorch_utils
transformers.pytorch_utils.is_torch_greater_or_equal_than_1_10 = lambda: True
transformers.pytorch_utils.is_torch_greater_or_equal_than_1_13 = lambda: True  # Add this line

# Parse command-line arguments
parser = argparse.ArgumentParser(description="Fine-tune Mistral with LoRA")
parser.add_argument("--verbose", action="store_true", help="Enable verbose output")
args = parser.parse_args()

# Set up logging
logging.basicConfig(level=logging.DEBUG if args.verbose else logging.INFO)
logger = logging.getLogger(__name__)

# Set default Ollama host
default_ollama_host = "127.0.0.1:11434"

# Check if Ollama is running and start it if not
def start_ollama_server():
    try:
        response = requests.get(f"http://{default_ollama_host}/api/generate")
        if response.status_code == 200:
            logger.info(Fore.GREEN + "Ollama server is already running on the default port." + Style.RESET_ALL)
            return default_ollama_host
        else:
            raise requests.ConnectionError
    except requests.ConnectionError:
        logger.info(Fore.YELLOW + "Starting Ollama server on the default port..." + Style.RESET_ALL)
        subprocess.Popen(["ollama", "start"])
        return default_ollama_host

ollama_host = start_ollama_server()

# Get the list of models from Ollama
def get_ollama_models():
    try:
        result = subprocess.run(["ollama", "list"], capture_output=True, text=True)
        if result.returncode == 0:
            models = result.stdout.splitlines()
            return models
        else:
            logger.error(Fore.RED + "Failed to get the list of models from Ollama." + Style.RESET_ALL)
            exit(1)
    except Exception as e:
        logger.error(Fore.RED + f"Error getting the list of models: {e}" + Style.RESET_ALL)
        exit(1)

models = get_ollama_models()

# Check if the proper model is loaded
model_name = "mistral:latest"
if any(model_name in model for model in models):
    logger.info(Fore.GREEN + f"Ollama is running and the model '{model_name}' is loaded." + Style.RESET_ALL)
else:
    logger.error(Fore.RED + f"Ollama is running but the model '{model_name}' is not loaded." + Style.RESET_ALL)
    exit(1)

# Use the correct directory path for loading the model
model_path = "./models/mistral_model"
try:
    # Load model & tokenizer
    model = AutoModelForCausalLM.from_pretrained(model_path)
    tokenizer = AutoTokenizer.from_pretrained(model_path)
except EnvironmentError as e:
    logger.error(Fore.RED + f"Error: {e}" + Style.RESET_ALL)
    logger.error(Fore.RED + "Please ensure that the model path is correct and that the required files are available." + Style.RESET_ALL)
    exit(1)

# Function to download a single dataset file
def download_dataset_file(file):
    logger.debug(Fore.BLUE + f"Downloading dataset file: {file}" + Style.RESET_ALL)
    return load_dataset("json", data_files=[file])

# Load training dataset using multiple threads
data_files = [
    "angular.jsonl",
    "astrology.jsonl",
    "kaballah.jsonl",
    "mysticism.jsonl",
    "sumerian.jsonl",
    "web-development.jsonl",
    "constitutional_training.jsonl",
    "freemasonry.jsonl",
    "core-values.jsonl",
    "all_sumerian_myths.jsonl",
    "jeffreysanford.jsonl",
    "freedom-and-justice.jsonl",
]

logger.info(Fore.GREEN + "Starting dataset download..." + Style.RESET_ALL)

with concurrent.futures.ThreadPoolExecutor(max_workers=5) as executor:
    datasets = list(executor.map(download_dataset_file, data_files))

dataset = concatenate_datasets(datasets)

# LoRA fine-tuning configuration
lora_config = LoraConfig(r=8, lora_alpha=32, lora_dropout=0.1)
model = get_peft_model(model, lora_config)

# Training arguments
training_args = TrainingArguments(
    output_dir="./fine-tuned-mistral",
    per_device_train_batch_size=1,
    num_train_epochs=3,
    save_steps=100,
    logging_dir="./logs"
)

trainer = Trainer(model=model, args=training_args, train_dataset=dataset)

# System monitoring function
def log_system_usage(epoch):
    log_entry = f"\nEpoch {epoch+1} Performance Stats:\n"
    log_entry += f"CPU Usage: {psutil.cpu_percent()}%\n"
    log_entry += f"RAM Usage: {psutil.virtual_memory().percent}%\n"
    log_entry += f"Disk Read: {psutil.disk_io_counters().read_bytes / 1e6:.2f} MB\n"
    log_entry += f"Disk Write: {psutil.disk_io_counters().write_bytes / 1e6:.2f} MB\n"
    
    if torch.cuda.is_available():
        log_entry += f"GPU: {torch.cuda.get_device_name(0)}\n"
        log_entry += f"GPU Memory Allocated: {torch.cuda.memory_allocated() / 1e9:.2f} GB\n"
        log_entry += f"GPU Memory Cached: {torch.cuda.memory_reserved() / 1e9:.2f} GB\n"
    else:
        log_entry += "Training on CPU - No GPU detected.\n"

    logger.info(Fore.YELLOW + log_entry + Style.RESET_ALL)
    with open("training_performance.log", "a") as log_file:
        log_file.write(log_entry)

# Start time tracking
start_time = time.time()

# Start training
for epoch in range(training_args.num_train_epochs):
    logger.info(Fore.CYAN + f"\n🚀 Starting Epoch {epoch+1}...\n" + Style.RESET_ALL)
    log_system_usage(epoch)  # Log system performance
    trainer.train()

# End time tracking
end_time = time.time()
total_time = (end_time - start_time) / 60

# Save final stats
final_entry = f"\n🔥 Training Complete! Total Time: {total_time:.2f} minutes\n"
logger.info(Fore.GREEN + final_entry + Style.RESET_ALL)
with open("training_performance.log", "a") as log_file:
    log_file.write(final_entry)
