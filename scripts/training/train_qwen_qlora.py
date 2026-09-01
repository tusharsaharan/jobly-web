#!/usr/bin/env python3
"""
Jobly Qwen 2.5 Unsloth + QLoRA Fine-Tuning Pipeline
Trains Qwen 2.5 3B/7B models on synthetic JSON schema datasets with GGUF export for Ollama.
"""

import os
import sys
import argparse
import torch

def train_qwen(
    model_name: str = "Qwen/Qwen2.5-3B-Instruct",
    dataset_path: str = "scripts/training/data/resumes_synthetic_train.jsonl",
    output_dir: str = "scripts/training/outputs/qwen_jobly_lora",
    max_seq_length: int = 4096,
    num_epochs: int = 3,
    batch_size: int = 2,
    gradient_accumulation_steps: int = 4,
    learning_rate: float = 2e-4,
    export_gguf: bool = True,
    quantization_method: str = "q4_k_m",
):
    print("=" * 70)
    print(f"🚀 Jobly Fine-Tuning Pipeline: {model_name}")
    print(f"📂 Dataset: {dataset_path}")
    print(f"💾 Output:  {output_dir}")
    print("=" * 70)

    try:
        from unsloth import FastLanguageModel
        from unsloth.chat_templates import get_chat_template
        from datasets import load_dataset
        from trl import SFTTrainer
        from transformers import TrainingArguments
    except ImportError:
        print("\n❌ Error: Unsloth and training dependencies are not installed.")
        print("To install on a GPU machine / Google Colab:")
        print("  pip install \"unsloth[cu121-torch230] @ git+https://github.com/unslothai/unsloth.git\"")
        print("  pip install --no-deps trl peft accelerate bitsandbytes")
        return

    # 1. Load Model with 4-bit Quantization
    print("\n[1/5] Loading 4-bit Quantized Base Model...")
    model, tokenizer = FastLanguageModel.from_pretrained(
        model_name=model_name,
        max_seq_length=max_seq_length,
        load_in_4bit=True,
        dtype=None, # Auto-detect fp16/bf16
    )

    # 2. Add LoRA Adapters
    print("\n[2/5] Initializing LoRA Target Modules...")
    model = FastLanguageModel.get_peft_model(
        model,
        r=16,
        lora_alpha=32,
        lora_dropout=0,
        target_modules=[
            "q_proj", "k_proj", "v_proj", "o_proj",
            "gate_proj", "up_proj", "down_proj"
        ],
        bias="none",
        use_gradient_checkpointing="unsloth",
        random_state=42,
    )

    # 3. Format Dataset with Qwen 2.5 Native ChatML Template
    print("\n[3/5] Formatting Dataset with Qwen-2.5 Chat Template...")
    tokenizer = get_chat_template(tokenizer, chat_template="qwen-2.5")

    def formatting_prompts_func(examples):
        convos = examples["messages"]
        texts = [
            tokenizer.apply_chat_template(convo, tokenize=False, add_generation_prompt=False)
            for convo in convos
        ]
        return {"text": texts}

    dataset = load_dataset("json", data_files=dataset_path, split="train")
    dataset = dataset.map(formatting_prompts_func, batched=True)

    # 4. Configure SFTTrainer
    print("\n[4/5] Starting QLoRA Supervised Fine-Tuning...")
    training_args = TrainingArguments(
        output_dir=output_dir,
        per_device_train_batch_size=batch_size,
        gradient_accumulation_steps=gradient_accumulation_steps,
        warmup_ratio=0.05,
        num_train_epochs=num_epochs,
        learning_rate=learning_rate,
        fp16=not torch.cuda.is_bf16_supported(),
        bf16=torch.cuda.is_bf16_supported(),
        logging_steps=10,
        optim="adamw_8bit",
        weight_decay=0.01,
        lr_scheduler_type="cosine",
        seed=42,
        save_strategy="epoch",
    )

    trainer = SFTTrainer(
        model=model,
        tokenizer=tokenizer,
        train_dataset=dataset,
        dataset_text_field="text",
        max_seq_length=max_seq_length,
        dataset_num_proc=2,
        packing=False,
        args=training_args,
    )

    trainer_stats = trainer.train()
    print(f"\n✅ Training completed in {trainer_stats.metrics['train_runtime']:.2f} seconds!")

    # 5. Export to 16-bit LoRA and GGUF
    print("\n[5/5] Saving Merged LoRA Weights and Exporting GGUF...")
    model.save_pretrained_merged(output_dir, tokenizer, save_method="merged_16bit")
    print(f"💾 Merged 16-bit model saved to: {output_dir}")

    if export_gguf:
        gguf_path = os.path.join(output_dir, f"jobly-qwen-{quantization_method}.gguf")
        print(f"📦 Exporting directly to GGUF ({quantization_method})...")
        model.save_pretrained_gguf(
            output_dir,
            tokenizer,
            quantization_method=quantization_method,
        )
        print(f"🎉 GGUF model exported to: {gguf_path}")
        print(f"\nTo deploy into Ollama, run:")
        print(f"  ollama create jobly-qwen:3b -f scripts/training/Modelfile.resume-3b")


def main():
    parser = argparse.ArgumentParser(description="Jobly Qwen 2.5 Unsloth QLoRA Fine-Tuning")
    parser.add_argument("--model", type=str, default="Qwen/Qwen2.5-3B-Instruct", help="HuggingFace model ID")
    parser.add_argument("--data", type=str, default="scripts/training/data/resumes_synthetic_train.jsonl", help="Dataset path")
    parser.add_argument("--output", type=str, default="scripts/training/outputs/qwen_jobly_lora", help="Output directory")
    parser.add_argument("--epochs", type=int, default=3, help="Training epochs")
    parser.add_argument("--batch-size", type=int, default=2, help="Batch size per device")
    parser.add_argument("--quant", type=str, default="q4_k_m", choices=["q4_k_m", "q8_0", "f16"], help="GGUF quantization")
    args = parser.parse_args()

    train_qwen(
        model_name=args.model,
        dataset_path=args.data,
        output_dir=args.output,
        num_epochs=args.epochs,
        batch_size=args.batch_size,
        quantization_method=args.quant,
    )


if __name__ == "__main__":
    main()
