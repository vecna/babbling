# Babbling computer

A repository with tools for ~Large Language Model~ ChatBot independent assessment, and tools for data enrichement, visualization, and comparison.

The scripts normally works in conjunction with the servers (nocodb, etherpad, and other tools here available) installed in my server [babbling.computer](https://babbling.computer). **REMEMBER**: are all experiment free to fork and play with, **NO STABILITY GUARANTEE**, **ZERO RELIABILITY SHOULD BE EXPECTED**. It is my playground, it is broken until otherwise proven, and if something works is because of unexpected astral conjuction. And, of course, **DOCUMENTATION MIGHT CONTAIN FALSEHOOD**.

### What to expect?

This directory contains `package.json` for `npm` and `requirements.txt` for `pip`. You got it: it is like eating 🍫 with 🐟.

### Test sequence 

**Metamorphic testing**, confortably described in this nice blogpost: https://www.giskard.ai/knowledge/how-to-test-ml-models-4-metamorphic-testing is the first attempt I made.

In this case was also a necessary step to understand how to _distill_ information our of a large text corpus, because I don't want to read everything, because the `Distillation`/`Translation` tools have been developed to ingest the result of the `Production` tools

1. OpenAI
2. produce [a pad](https://babbling.computer/p/33b38c8c-a51e-40c9-b2a8-552de311480d), like ID: `33b38c8c-a51e-40c9-b2a8-552de311480d`.
3. `portions/etherpad-to-semantic.mjs --pad 33b38c8c-a51e-40c9-b2a8-552de311480d`
4. `portions/semantic-to-noco.mjs --pad 33b38c8c-a51e-40c9-b2a8-552de311480d`
5. `portions/noco-to-observable.mjs --chatId !$`

### (data) Production tool n.1

Inspired by https://simonwillison.net/2023/May/18/cli-tools-for-llms/

```
python --version
python -m venv babbling
source babbling/bin/activate
pip install -r requirements.txt
```

Then you need to set the environment variable `OPENAPI_API_KEY`, and then, before sending queries, I used the `init-db` and `logs` commands:

```
$ python babbling/bin/llm init-db
$ python babbling/bin/llm "hi, please, can you tell me the number pi?"
Sure, the number pi is 3.14159265358979323846 (and so on, it is an irrational and never-ending decimal number).
$ python babbling/bin/llm logs
```

### (data) Production tool n.2

You should install [ViolentMonkey](https://violentmonkey.github.io/) or any other compatible tool that runs [Userscripts](https://en.wikipedia.org/wiki/Userscript)


