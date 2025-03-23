# Craft Fusion AI Training Platform

This application contains the training infrastructure and utilities for fine-tuning large language models (LLMs) for the Craft Fusion project. It enables customizing foundation models for domain-specific applications and integrates into the NX monorepo structure.

## 🌟 Features

- Parameter-efficient fine-tuning with LoRA adapters
- Multiple model architectures support (Mistral, DeepSeek, etc.)
- Integrated with NX build system for seamless workflow
- Domain-specific dataset management
- Advanced inference testing toolkit
- GPU memory optimization
- ETSCL data scraping for training data collection (see [ETSCL-SCRAPING.md](./ETSCL-SCRAPING.md))

## 📋 Requirements

- Python 3.9+ (3.10 recommended)
- CUDA-compatible GPU with at least 16GB VRAM (recommended)
- 32GB+ system RAM
- 100GB+ disk space for model weights and datasets

## 🚀 Getting Started

### Environment Setup

Initialize the Python environment:

```bash
# Create a virtual environment (recommended)
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Verify CUDA availability (should return True)
python -c "import torch; print(torch.cuda.is_available())"
```

### Using with NX

This training application is integrated with the NX workspace, allowing for seamless workflow integration:

```bash
# Set up environment
nx run training:setup

# Run data scraping and preparation
nx run training:prepare-data

# Run individual scraping tasks
nx run training:scrape-etscl
nx run training:scrape-github
nx run training:scrape-stackexchange

# Merge datasets
nx run training:merge-datasets

# Run fine-tuning
nx run training:finetune-mistral
nx run training:finetune-deepseek

# Test inference with fine-tuned models
nx run training:inference-test

# Run the complete pipeline (scrape → train → test)
nx run training:etscl-pipeline
```

## 📊 Training Data

The training data is organized in JSONL format, with each line containing an input/output pair for instruction tuning:

```jsonl
{"input": "Why should Angular modules be used over standalone components?", "output": "Modules enforce structure, maintainability, and clear separation of features, making them superior for large-scale applications."}
```

Data files are organized by domain:

- `training_data/web-development.jsonl`: Angular, React, and general web development knowledge
- `training_data/kaballah.jsonl`: Mysticism and Kabbalah concepts
- `training_data/mysticism.jsonl`: Various mystical traditions and concepts
- `training_data/jeffreysanford.jsonl`: Developer profile and expertise information
- `training_data/sumerian.jsonl`: Sumerian mythology and connections to Kabbalah
- `training_data/etscl/`: Technical support conversations from ETSCL scraping

### Data Collection

The project includes an ETSCL (Enhanced Technical Support Conversation Logs) scraper that can collect additional training data from various sources. The scraper extracts technical support conversations and formats them for model training.

#### Specialized Data Sources

1. **GitHub Issues Scraper**

   The GitHub scraper collects technical discussions from open source repositories, focusing on:
   
   - Problem descriptions and solutions
   - Code-oriented troubleshooting sequences
   - Discussions about architectural decisions
   - Bug reports and their resolutions
   
   This data is particularly valuable for training the model to handle software development questions, debugging scenarios, and code pattern recommendations.

   ```bash
   # Run the GitHub scraper
   nx run training:scrape-github
   ```

2. **Stack Exchange Scraper**

   The Stack Exchange scraper targets high-quality Q&A content from sites like Stack Overflow, focusing on:
   
   - Accepted answers with high vote counts
   - Technical explanations with code examples
   - Conceptual questions about programming patterns
   - Best practices and common pitfalls
   
   These curated Q&A pairs provide excellent training data for precise, authoritative technical responses.

   ```bash
   # Run the Stack Exchange scraper
   nx run training:scrape-stackexchange
   ```

3. **Web Support Forums Scraper**

   The original ETSCL scraper collects technical support conversations from forums and knowledge bases, focusing on:
   
   - User-to-support agent conversations
   - Structured troubleshooting sequences
   - Problem-resolution pairs
   
   ```bash
   # Run the original ETSCL scraper
   nx run training:scrape-etscl
   ```

#### Data Curation Workflow

The full data pipeline follows these steps:

1. **Collection**: Run the specialized scrapers to gather domain-specific data
2. **Cleaning**: Process raw data to normalize formatting and remove noise
3. **Deduplication**: Remove redundant training examples
4. **Merging**: Combine data from multiple sources with proper weighting
5. **Balancing**: Ensure even representation of different knowledge domains
6. **Validation**: Test data quality with inference validation

```bash
# Run the full data preparation pipeline
nx run training:prepare-data
```

For detailed information about the scraping functionality, see [ETSCL-SCRAPING.md](./ETSCL-SCRAPING.md).

## 🧠 Multi-Domain Training Strategy

Craft Fusion employs a multi-domain training strategy to build a balanced model with both specialized knowledge and general capabilities:

1. **Core Knowledge Domains**:
   - Software Development (Angular, React, JavaScript)
   - Ancient Philosophy (Sumerian, Kabbalah)
   - Technical Support (IT, DevOps, Infrastructure)
   - Biographical Information (Jeffrey Sanford's expertise)

2. **Training Approach**:
   
   We use a phased training approach:
   
   - **Phase 1**: Domain-specific pre-training on specialized data
   - **Phase 2**: Cross-domain integration to build connections
   - **Phase 3**: Fine-tuning for specific applications
   
   This approach creates a model that can make unique connections between disparate domains while maintaining technical accuracy.

3. **Evaluation Criteria**:
   
   The model is evaluated on multiple dimensions:
   
   - **Technical accuracy**: Correctness of software development guidance
   - **Conceptual depth**: Understanding of philosophical concepts
   - **Cross-domain synthesis**: Ability to connect concepts across domains
   - **Practical application**: Helpfulness of troubleshooting advice

## 🛠️ Available Scripts

### Fine-tuning Scripts

- `finetune-mistral-lora.py`: Fine-tune Mistral 7B with LoRA
  ```bash
  python finetune-mistral-lora.py --learning_rate 2e-4 --batch_size 8 --epochs 3
  ```

- `finetune-deepseek-lora.py`: Fine-tune DeepSeek Coder models with LoRA
  ```bash
  python finetune-deepseek-lora.py --model deepseek-ai/deepseek-coder-6.7b-base
  ```

### Testing Scripts

- `test-inference.py`: Test inference with fine-tuned models
  ```bash
  python test-inference.py --model_path ./models/mistral-7b-finetuned --test_file ./data/test_prompts.json
  ```

### Data Generation

- `new-etscl.ts/js`: TypeScript/JavaScript utilities for generating training data
- `entities.ts/js`: Entity definitions for structured data generation
- `merge-datasets.js`: Tool for combining and processing training datasets

## 📝 Configuration Options

### Fine-tuning Configurations

Key parameters that can be adjusted for fine-tuning:

| Parameter | Description | Default | Recommended Range |
|-----------|-------------|---------|------------------|
| learning_rate | Learning rate for optimizer | 2e-4 | 1e-5 to 3e-4 |
| batch_size | Batch size for training | 8 | 1 to 16 |
| epochs | Number of training epochs | 3 | 1 to 5 |
| lora_r | LoRA attention dimension | 16 | 8 to 64 |
| lora_alpha | LoRA alpha parameter | 32 | 16 to 64 |
| lora_dropout | Dropout probability for LoRA | 0.05 | 0.0 to 0.1 |

### Memory Optimization

For limited VRAM environments:

```bash
python finetune-mistral-lora.py --quantize 4bit --gradient_checkpointing --gradient_accumulation_steps 4
```

## 🏗️ Project Structure

```
apps/training/
├── README.md                      # This file
├── ETSCL-SCRAPING.md              # Scraping documentation
├── requirements.txt               # Python dependencies
├── package.json                   # Node.js dependencies for scrapers
├── project.json                   # NX integration configuration
├── finetune-mistral-lora.py       # Mistral fine-tuning script
├── finetune-deepseek-lora.py      # DeepSeek fine-tuning script
├── test-inference.py              # Inference testing utility
├── new-etscl.ts                   # Data scraping utility (TypeScript)
├── new-etscl.js                   # Data scraping utility (JavaScript)
├── merge-datasets.js              # Dataset processing utility
├── entities.ts                    # Entity definitions (TypeScript)
├── entities.js                    # Entity definitions (JavaScript)
├── training_data/                 # Training datasets
│   ├── web-development.jsonl      # Web development knowledge
│   ├── kaballah.jsonl             # Kabbalah concepts
│   ├── mysticism.jsonl            # Mystical traditions
│   ├── sumerian.jsonl             # Sumerian mythology
│   ├── jeffreysanford.jsonl       # Developer profile
│   └── etscl/                     # Technical support conversations
│       ├── scraped-support.jsonl  # Web forum data
│       ├── github-issues.jsonl    # GitHub data
│       └── stackexchange-qa.jsonl # Stack Exchange data
├── myths/                         # Ancient text fragments for training
│   ├── t.1.1.3.json               # Sumerian text fragments
│   └── t.2.1.7.json               # Sumerian text fragments
├── translation-categories.json    # Categories for translation tasks
├── report-etscl.json              # Example reports for training
└── models/                        # Output directory for fine-tuned models
    ├── mistral-7b-finetuned/      # Fine-tuned Mistral model
    └── deepseek-6.7b-finetuned/   # Fine-tuned DeepSeek model
```

## 📈 Performance Metrics

During training, the following metrics are tracked:

- Loss (training and validation)
- Perplexity 
- ROUGE scores
- BLEU scores
- Response accuracy

View training metrics using TensorBoard:

```bash
tensorboard --logdir ./logs
```

## 🚀 Future Development Roadmap

The Craft Fusion training platform has several planned enhancements:

1. **Advanced Scraping**:
   - Support for scraping PDF technical documentation
   - Integration with Discord technical communities
   - Automated quality filtering of scraped content

2. **Training Innovations**:
   - Implementation of RLHF (Reinforcement Learning from Human Feedback)
   - Exploration of specialized mixture-of-experts architectures
   - Integration of retrieval-augmented generation capabilities

3. **Application Integration**:
   - Tighter coupling with the Craft Fusion API
   - Real-time model improvements from user feedback
   - Specialized deployments for different knowledge domains

4. **Evaluation Framework**:
   - Expanded test suite for cross-domain reasoning
   - Automated benchmark testing across multiple models
   - Human evaluation pipeline for subjective quality assessment

## 🚢 Deployment

After fine-tuning, models can be:

1. Exported to ONNX format for production deployment:
   ```bash
   python export_model.py --model_path ./models/mistral-7b-finetuned --export_format onnx
   ```

2. Pushed to Hugging Face Hub:
   ```bash
   python push_to_hub.py --model_path ./models/mistral-7b-finetuned --repo_name username/model-name
   ```

3. Integrated into the Craft Fusion API:
   ```bash
   nx run model-integration:deploy --model-path ./models/mistral-7b-finetuned
   ```

## 🔍 Troubleshooting

### Common Issues

- **CUDA out of memory**: Reduce batch size or enable quantization
- **Slow training**: Increase gradient accumulation steps
- **Poor model quality**: Increase training epochs or adjust learning rate
- **Import errors**: Ensure all dependencies are installed

### VRAM Usage by Model

| Model | Full Precision | 8-bit | 4-bit |
|-------|----------------|-------|-------|
| Mistral 7B | 14GB | 7GB | 4GB |
| DeepSeek 6.7B | 13.5GB | 6.8GB | 3.8GB |
| DeepSeek 16.7B | 33.5GB | 17GB | 9GB |

## 📚 References

- [PEFT Library Documentation](https://huggingface.co/docs/peft)
- [Mistral AI Models](https://mistral.ai/news/announcing-mistral-7b/)
- [DeepSeek Coder Models](https://github.com/deepseek-ai/DeepSeek-Coder)
- [LoRA Paper](https://arxiv.org/abs/2106.09685)
- [QLoRA Paper](https://arxiv.org/abs/2305.14314)
- [Stack Exchange Data Explorer](https://data.stackexchange.com/)
- [GitHub REST API Documentation](https://docs.github.com/en/rest)

## 🤝 Contributing

1. Create new training datasets in the `training_data` directory
2. Test fine-tuning with different parameters
3. Submit pull requests with improvements
4. Report issues with training or inference

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.
