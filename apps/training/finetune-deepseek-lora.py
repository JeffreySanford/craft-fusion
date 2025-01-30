import time
import psutil  # System monitoring
import torch
from transformers import AutoModelForCausalLM, AutoTokenizer, TrainingArguments, Trainer, AutoConfig
from huggingface_hub import login
from peft import LoraConfig, get_peft_model
from datasets import load_dataset, concatenate_datasets
import concurrent.futures  # For multi-threaded downloads

# Mock function to replace the missing import
import transformers.pytorch_utils
transformers.pytorch_utils.is_torch_greater_or_equal_than_1_10 = lambda: True
transformers.pytorch_utils.is_torch_greater_or_equal_than_1_13 = lambda: True  # Add this line

# Authenticate with Hugging Face
login(token="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")  # Ensure to set the token securely

# Load model configuration and set quantization_config to None
config = AutoConfig.from_pretrained("deepseek-ai/DeepSeek-R1", trust_remote_code=True)
config.quantization_config = None

# Load model & tokenizer
model = AutoModelForCausalLM.from_pretrained("deepseek-ai/DeepSeek-R1", config=config, trust_remote_code=True)
tokenizer = AutoTokenizer.from_pretrained("deepseek-ai/DeepSeek-R1", trust_remote_code=True)

# Function to download a single dataset file
def download_dataset_file(file):
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

with concurrent.futures.ThreadPoolExecutor(max_workers=5) as executor:
    datasets = list(executor.map(download_dataset_file, data_files))

dataset = concatenate_datasets(datasets)

# LoRA fine-tuning configuration
lora_config = LoraConfig(r=8, lora_alpha=32, lora_dropout=0.1)
model = get_peft_model(model, lora_config)

# Training arguments
training_args = TrainingArguments(
    output_dir="./fine-tuned-deepseek",
    per_device_train_batch_size=1,
    num_train_epochs=3,
    save_steps=100,
    logging_dir="./logs"
)

trainer = Trainer(model=model, args=training_args, train_dataset=dataset)

# System monitoring function
def log_system_usage(epoch):
    with open("training_performance.log", "a") as log_file:
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

        print(log_entry)
        log_file.write(log_entry)

# Start time tracking
start_time = time.time()

# Start training
for epoch in range(training_args.num_train_epochs):
    print(f"\n🚀 Starting Epoch {epoch+1}...\n")
    log_system_usage(epoch)  # Log system performance
    trainer.train()

# End time tracking
end_time = time.time()
total_time = (end_time - start_time) / 60

# Save final stats
with open("training_performance.log", "a") as log_file:
    final_entry = f"\n🔥 Training Complete! Total Time: {total_time:.2f} minutes\n"
    print(final_entry)
    log_file.write(final_entry)
